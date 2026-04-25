import type { DeliveryOrder, DeliveryStop } from "@prisma/client";

export type AssignOrderResult = {
  order: DeliveryOrder;
  stop: DeliveryStop;
  alreadyAssigned: boolean;
};

export type ResolveStopResult = {
  stop: DeliveryStop;
  runCompleted: boolean;
  alreadyResolved: boolean;
};
