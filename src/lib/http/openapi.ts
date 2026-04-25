import fs from "node:fs";
import type { Router } from "express";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

const useOpenApi = (app: Router) => {
  const swaggerDocument = yaml.load(
    fs.readFileSync("docs/api.yaml", "utf8"),
  ) as swaggerUi.JsonObject;
  app.use(
    "/api-docs",
    swaggerUi.serveFiles(swaggerDocument),
    swaggerUi.setup(swaggerDocument),
  );
};

export default useOpenApi;
