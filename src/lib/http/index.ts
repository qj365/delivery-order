import { env } from "@src/env";
import bodyParser from "body-parser";
import cors from "cors";
import express, { type Request, type Response, type Router } from "express";
import logger, { logMiddleware } from "../logger";
import { errorHandler, notFoundRouteHandler, rawBodySaver } from "./middleware";

export default class HTTPSever {
  app: express.Application;

  constructor(setup?: (app: Router) => void) {
    this.app = express();

    this.app.use(bodyParser.json({ limit: "10mb", verify: rawBodySaver }));
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: "10mb",
        verify: rawBodySaver,
      }),
    );
    this.app.use(
      cors({
        origin:
          env.NODE_ENV === "development" ? "*" : (env.WEB_BASE_URL ?? "*"),
      }),
    );

    this.app.use(logMiddleware);

    // OpenAPI validator in development mode
    // to make sure the API spec is written correctly
    if (env.NODE_ENV !== "production") {
      logger.info("Serve OpenAPI documentation");

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const setupOpenApi = require("./openapi").default;
      setupOpenApi(this.app);
    }

    if (setup) {
      setup(this.app);
    }

    this.app.use(notFoundRouteHandler);

    this.app.use(errorHandler);

    this.app.use((err: object, req: Request, res: Response) => {
      res.status(500).json(err);
    });
  }

  listen() {
    this.app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server started on port ${env.PORT}`);
    });
  }
}
