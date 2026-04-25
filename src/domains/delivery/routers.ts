import { SecurityName } from "@src/auth-middleware";
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { getUserOrThrow } from "../../lib/utils/auth";
import type { AuthRequest } from "../../types/auth";
import type { AssignOrderDto } from "./dto/assign-order";
import type { CompleteStopDto } from "./dto/complete-stop";
import type { FailStopDto } from "./dto/fail-stop";
import services from "./services";

@Route("delivery")
@Tags("Delivery")
export class DeliveryController extends Controller {
  @Security(SecurityName.JWT, ["ADMIN"])
  @Post("runs/{runId}/assign-order")
  public async assignOrder(
    @Request() request: AuthRequest,
    @Path() runId: number,
    @Body() body: AssignOrderDto,
  ) {
    return await services.assignOrderToRun(
      getUserOrThrow(request),
      runId,
      body,
    );
  }

  @Security(SecurityName.JWT, ["DRIVER"])
  @Post("stops/{stopId}/complete")
  public async completeStop(
    @Request() request: AuthRequest,
    @Path() stopId: number,
    @Body() body: CompleteStopDto,
  ) {
    return await services.completeStop(getUserOrThrow(request), stopId, body);
  }

  @Security(SecurityName.JWT, ["DRIVER"])
  @Post("stops/{stopId}/fail")
  public async failStop(
    @Request() request: AuthRequest,
    @Path() stopId: number,
    @Body() body: FailStopDto,
  ) {
    return await services.failStop(getUserOrThrow(request), stopId, body);
  }

  @Security(SecurityName.JWT)
  @Get("runs/{runId}")
  public async getRun(@Path() runId: number) {
    return await services.getRun(runId);
  }
}
