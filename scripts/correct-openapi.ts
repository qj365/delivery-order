import fs from "node:fs";
import parser from "@apidevtools/swagger-parser"; // cspell:disable-line
import yaml from "js-yaml";
import { type OpenAPIV2, OpenAPIV3 } from "openapi-types"; // cspell:disable-line

parser.parse("docs/api.yaml", (err, _api) => {
  if (err || !_api) {
    console.error(err);
    return;
  }

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  const api = _api as OpenAPIV3.Document<{}>;
  if (!api.components) {
    api.components = {};
  }
  if (!api.components.responses) {
    api.components.responses = {};
  }
  api.info.title = "backend-api";

  checkAndAddResponse(api.components.responses, 500, "Internal server error");
  checkAndAddResponse(api.components.responses, 400, "Bad request");
  checkAndAddResponse(api.components.responses, 401, "Invalid token");
  checkAndAddResponse(api.components.responses, 404, "Not found");
  checkAndAddResponse(api.components.responses, 403, "Forbidden");

  const paths = api.paths;
  if (!paths) {
    console.error("No paths found");
    return;
  }

  const adminApi: OpenAPIV3.Document<object> = JSON.parse(JSON.stringify(api));
  adminApi.paths = {};
  adminApi.info.title = "admin-api";

  const sellerApi: OpenAPIV3.Document<object> = JSON.parse(
    JSON.stringify(adminApi),
  );
  sellerApi.info.title = "seller-api";

  const supplierApi: OpenAPIV3.Document<object> = JSON.parse(
    JSON.stringify(adminApi),
  );
  supplierApi.info.title = "supplier-api";

  for (const path in paths) {
    const pathItem = paths[path];
    for (const m in pathItem) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (!Object.values(OpenAPIV3.HttpMethods).includes(m as any)) {
        continue;
      }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const method: OpenAPIV3.HttpMethods = m as any;
      const operation = pathItem[method];
      if (!operation || typeof operation === "string") {
        continue;
      }

      if ("responses" in operation) {
        const responses = operation.responses as
          | OpenAPIV2.ResponsesObject
          | OpenAPIV3.ResponsesObject;
        checkAndAddResponseToRequest(responses, 500, "Internal server error");
        checkAndAddResponseToRequest(responses, 400, "Bad request");
        checkAndAddResponseToRequest(responses, 404, "Not found");
        checkAndAddResponseToRequest(responses, 403, "Forbidden");

        if ("security" in operation) {
          const security = operation.security as
            | OpenAPIV3.SecurityRequirementObject[]
            | OpenAPIV2.SecurityRequirementObject[];
          if (security.length > 0) {
            checkAndAddResponseToRequest(responses, 401, "Invalid token");
          }
        }
      }

      if (operation.tags) {
        let found = false;
        if (checkAllowSite("admin", operation)) {
          if (!adminApi.paths[path]) {
            adminApi.paths[path] = {};
          }
          const op: OpenAPIV3.OperationObject = JSON.parse(
            JSON.stringify(operation),
          );
          op.tags = op.tags?.filter((t) => !t.endsWith("Site"));
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          adminApi.paths[path]![method] = op;
          found = true;
        }

        if (checkAllowSite("seller", operation)) {
          if (!sellerApi.paths[path]) {
            sellerApi.paths[path] = {};
          }
          const op: OpenAPIV3.OperationObject = JSON.parse(
            JSON.stringify(operation),
          );
          op.tags = op.tags?.filter((t) => !t.endsWith("Site"));
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          sellerApi.paths[path]![method] = op;
          found = true;
        }

        if (checkAllowSite("supplier", operation)) {
          if (!supplierApi.paths[path]) {
            supplierApi.paths[path] = {};
          }
          const op: OpenAPIV3.OperationObject = JSON.parse(
            JSON.stringify(operation),
          );
          op.tags = op.tags?.filter((t) => !t.endsWith("Site"));
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          supplierApi.paths[path]![method] = op;
          found = true;
        }

        if (!found) {
          console.error(`No tag found for ${path} ${method}`);
        }
      }
    }
  }

  fs.writeFileSync("docs/admin-api.yaml", yaml.dump(adminApi));
  fs.writeFileSync("docs/seller-api.yaml", yaml.dump(sellerApi));
  fs.writeFileSync("docs/supplier-api.yaml", yaml.dump(supplierApi));
  fs.writeFileSync("docs/api.yaml", yaml.dump(api));
});

function checkAndAddResponse(
  response: OpenAPIV2.ResponsesObject | OpenAPIV3.ResponsesObject,
  code: number,
  description: string,
) {
  if (!(`${code}` in response)) {
    response[`${code}`] = {
      description: description,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: description,
              },
              code: {
                type: "integer",
                example: code,
              },
              statusCode: {
                type: "integer",
                example: code,
              },
            },
          },
        },
      },
    };
  }
}

function checkAndAddResponseToRequest(
  response: OpenAPIV2.ResponsesObject | OpenAPIV3.ResponsesObject,
  code: number,
  description: string,
) {
  if (!(`${code}` in response)) {
    response[`${code}`] = {
      $ref: `#/components/responses/${code}`,
    };
  }
}

// cspell:disable-next-line
function checkAllowSite(site: string, operation: OpenAPIV3.OperationObject) {
  if (operation.tags?.map((t) => t.toLowerCase()).includes("private")) {
    return false;
  }

  if (
    operation.tags
      ?.map((t) => t.toLowerCase())
      .includes(`${site.toLowerCase()} site`)
  ) {
    return true;
  }

  if (
    !operation.security ||
    operation.security.length === 0 ||
    operation.security.flatMap((s) => Object.keys(s)).includes("noAuth")
  ) {
    return true;
  }

  const jwtSecurity = operation.security.find((s) => "jwt" in s);
  if (!jwtSecurity) {
    return false;
  }

  const roles = jwtSecurity.jwt as string[];
  if (roles.length === 0) {
    return true;
  }
  if (roles.map((r) => r.toLowerCase()).includes(site)) {
    return true;
  }

  return false;
}
