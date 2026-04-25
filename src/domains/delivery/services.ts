import {
  type DeliveryOrder,
  DeliveryOrderStatus,
  type DeliveryRun,
  DeliveryRunStatus,
  type DeliveryStop,
  DeliveryStopStatus,
  Prisma,
} from "@prisma/client";
import { database } from "../../lib/database";
import { HTTPError, errors } from "../../lib/http/errors";
import type { AuthData } from "../../types/auth";
import type { AssignOrderDto } from "./dto/assign-order";
import type { CompleteStopDto } from "./dto/complete-stop";
import type { FailStopDto } from "./dto/fail-stop";
import type { AssignOrderResult, ResolveStopResult } from "./types";

const PRISMA_UNIQUE_VIOLATION = "P2002";

/**
 * Assign an order to a delivery run as a single atomic unit:
 *   bump run.nextSequence + create stop + flip order to ASSIGNED.
 *
 * Concurrency strategy:
 *   - SELECT ... FOR UPDATE on the run row serializes assigns into the same run,
 *     so nextSequence is read + incremented without race.
 *   - SELECT ... FOR UPDATE on the order row prevents the same order from being
 *     assigned to two runs concurrently (second tx waits, then sees ASSIGNED).
 *   - DeliveryStop.orderId @unique is the DB-level safety net: if any race slips
 *     past the row locks, the second INSERT raises P2002 and we map it to the
 *     idempotent path (or reject as Conflict).
 *
 * Idempotency:
 *   - Retry into the SAME run returns 200 with the existing stop (alreadyAssigned).
 *   - Retry into a DIFFERENT run is a real conflict → OrderNotAssignable.
 */
async function assignOrderToRun(
  user: AuthData,
  runId: number,
  body: AssignOrderDto,
): Promise<AssignOrderResult> {
  try {
    return await database.$transaction(
      async (tx) => {
        const [run] = await tx.$queryRaw<DeliveryRun[]>`
          SELECT * FROM "DeliveryRun" WHERE id = ${runId} FOR UPDATE
        `;
        if (!run) {
          throw new HTTPError(errors.NotFound, "Delivery run not found");
        }
        if (run.status === DeliveryRunStatus.COMPLETED) {
          throw new HTTPError(errors.RunClosed);
        }

        const [order] = await tx.$queryRaw<DeliveryOrder[]>`
          SELECT * FROM "DeliveryOrder" WHERE id = ${body.orderId} FOR UPDATE
        `;
        if (!order) {
          throw new HTTPError(errors.NotFound, "Delivery order not found");
        }

        if (
          order.status === DeliveryOrderStatus.ASSIGNED &&
          order.deliveryRunId === runId
        ) {
          const existingStop = await tx.deliveryStop.findUniqueOrThrow({
            where: { orderId: order.id },
          });
          return {
            order,
            stop: existingStop,
            alreadyAssigned: true,
          };
        }

        if (order.status !== DeliveryOrderStatus.PENDING) {
          throw new HTTPError(errors.OrderNotAssignable);
        }

        const sequence = run.nextSequence;

        await tx.deliveryRun.update({
          where: { id: runId },
          data: { nextSequence: { increment: 1 } },
        });

        const stop = await tx.deliveryStop.create({
          data: {
            orderId: order.id,
            runId,
            sequence,
            status: DeliveryStopStatus.PENDING,
          },
        });

        const updatedOrder = await tx.deliveryOrder.update({
          where: { id: order.id },
          data: { deliveryRunId: runId, status: DeliveryOrderStatus.ASSIGNED },
        });

        return { order: updatedOrder, stop, alreadyAssigned: false };
      },
      { timeout: 10_000 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === PRISMA_UNIQUE_VIOLATION
    ) {
      const stop = await database.deliveryStop.findUnique({
        where: { orderId: body.orderId },
        include: { order: true },
      });
      if (stop && stop.runId === runId) {
        return { order: stop.order, stop, alreadyAssigned: true };
      }
      throw new HTTPError(errors.OrderNotAssignable);
    }
    throw err;
  }
}

/**
 * Driver marks a stop as delivered with proof.
 *
 * Concurrency / idempotency:
 *   - Lock the stop row first (FOR UPDATE). Concurrent retries serialize here;
 *     the second one re-reads status = COMPLETED and returns the idempotent
 *     response (alreadyResolved) instead of throwing.
 *   - Same proof on retry → idempotent success. Different proof → ProofMismatch
 *     (refuse to silently overwrite a finalized record).
 *   - assertDriverOwnsRun also locks the run row, which gates against an
 *     assign-order tx inserting a new pending stop while we are about to
 *     auto-complete the run (would otherwise produce a COMPLETED run with
 *     PENDING stops).
 */
async function completeStop(
  user: AuthData,
  stopId: number,
  body: CompleteStopDto,
): Promise<ResolveStopResult> {
  return await database.$transaction(
    async (tx) => {
      const [stop] = await tx.$queryRaw<DeliveryStop[]>`
        SELECT * FROM "DeliveryStop" WHERE id = ${stopId} FOR UPDATE
      `;
      if (!stop) {
        throw new HTTPError(errors.NotFound, "Stop not found");
      }

      await assertDriverOwnsRun(tx, stop.runId, user.uid);

      if (stop.status === DeliveryStopStatus.COMPLETED) {
        if (stop.proofPhotoUrl !== body.proofPhotoUrl) {
          throw new HTTPError(errors.ProofMismatch);
        }
        return { stop, runCompleted: false, alreadyResolved: true };
      }
      if (stop.status === DeliveryStopStatus.FAILED) {
        throw new HTTPError(errors.StopAlreadyResolved);
      }

      const updatedStop = await tx.deliveryStop.update({
        where: { id: stopId },
        data: {
          status: DeliveryStopStatus.COMPLETED,
          proofPhotoUrl: body.proofPhotoUrl,
          proofSignatureUrl: body.proofSignatureUrl,
          resolvedAt: new Date(),
        },
      });

      await tx.deliveryOrder.update({
        where: { id: stop.orderId },
        data: { status: DeliveryOrderStatus.DELIVERED },
      });

      const runCompleted = await maybeCompleteRun(tx, stop.runId);

      return {
        stop: updatedStop,
        runCompleted,
        alreadyResolved: false,
      };
    },
    { timeout: 10000 },
  );
}

/**
 * Driver marks a stop as failed with a reason.
 * Same locking + idempotency model as completeStop. A stop can only resolve once
 * (COMPLETED or FAILED, never both). Same reason on retry → idempotent success.
 */
async function failStop(
  user: AuthData,
  stopId: number,
  body: FailStopDto,
): Promise<ResolveStopResult> {
  return await database.$transaction(
    async (tx) => {
      const [stop] = await tx.$queryRaw<DeliveryStop[]>`
        SELECT * FROM "DeliveryStop" WHERE id = ${stopId} FOR UPDATE
      `;
      if (!stop) {
        throw new HTTPError(errors.NotFound, "Stop not found");
      }

      await assertDriverOwnsRun(tx, stop.runId, user.uid);

      if (stop.status === DeliveryStopStatus.FAILED) {
        if (stop.failureReason !== body.failureReason) {
          throw new HTTPError(errors.StopAlreadyResolved);
        }
        return { stop, runCompleted: false, alreadyResolved: true };
      }
      if (stop.status === DeliveryStopStatus.COMPLETED) {
        throw new HTTPError(errors.StopAlreadyResolved);
      }

      const updatedStop = await tx.deliveryStop.update({
        where: { id: stopId },
        data: {
          status: DeliveryStopStatus.FAILED,
          failureReason: body.failureReason,
          proofPhotoUrl: body.proofPhotoUrl,
          resolvedAt: new Date(),
        },
      });

      await tx.deliveryOrder.update({
        where: { id: stop.orderId },
        data: { status: DeliveryOrderStatus.FAILED },
      });

      const runCompleted = await maybeCompleteRun(tx, stop.runId);

      return { stop: updatedStop, runCompleted, alreadyResolved: false };
    },
    { timeout: 10000 },
  );
}

/**
 * Verifies the caller (Firebase uid) is the driver assigned to this run.
 *
 * The FOR UPDATE on the run row is doing two jobs:
 *   1. Authorization read of driverId (could be a normal SELECT).
 *   2. Lock barrier — assignOrderToRun also takes this lock, so once we hold
 *      it, no new pending stop can be inserted until we commit. This is what
 *      makes the subsequent maybeCompleteRun count race-free.
 */
async function assertDriverOwnsRun(
  tx: Prisma.TransactionClient,
  runId: number,
  driverUid: string,
): Promise<void> {
  const driver = await tx.deliveryDriver.findUnique({
    where: { uid: driverUid },
  });
  if (!driver) {
    throw new HTTPError(errors.Forbidden, "Not a registered driver");
  }
  const [run] = await tx.$queryRaw<{ driverId: number }[]>`
    SELECT "driverId" FROM "DeliveryRun" WHERE id = ${runId} FOR UPDATE
  `;
  if (!run || run.driverId !== driver.id) {
    throw new HTTPError(errors.Forbidden, "Not assigned to this run");
  }
}

/**
 * Auto-completes the run when no PENDING stops remain.
 * Caller must already hold FOR UPDATE on the run row (via assertDriverOwnsRun) —
 * otherwise an assign-order tx could insert a new pending stop between the count
 * and the status update, leaving a COMPLETED run with PENDING children.
 */
async function maybeCompleteRun(
  tx: Prisma.TransactionClient,
  runId: number,
): Promise<boolean> {
  const remaining = await tx.deliveryStop.count({
    where: { runId, status: DeliveryStopStatus.PENDING },
  });
  if (remaining > 0) return false;

  await tx.deliveryRun.update({
    where: { id: runId },
    data: { status: DeliveryRunStatus.COMPLETED },
  });
  return true;
}

/** Read-only view of a run with its stops, orders and customer. No locking needed. */
async function getRun(runId: number) {
  const run = await database.deliveryRun.findUnique({
    where: { id: runId },
    include: {
      driver: true,
      stops: {
        orderBy: { sequence: "asc" },
        include: {
          order: { include: { customer: true, items: true } },
        },
      },
    },
  });
  if (!run) {
    throw new HTTPError(errors.NotFound, "Delivery run not found");
  }
  return run;
}

export default {
  assignOrderToRun,
  completeStop,
  failStop,
  getRun,
};
