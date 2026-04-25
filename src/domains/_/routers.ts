import { Controller, Get, Route, Tags } from "tsoa";

import services from "./services";

@Route("health")
@Tags("Health")
export class HealthController extends Controller {
  @Get("")
  public async healthCheck() {
    return await services.healthCheck();
  }
}
