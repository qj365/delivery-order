import fs from "node:fs";
import { generate } from "openapi-typescript-codegen";

function genClient(input: string, output: string) {
  generate({
    input: input,
    output: `${output}/client`,
    httpClient: "fetch",
    indent: "2",
    useOptions: true,
    clientName: "ClientApi",
  }).then(() => {
    // copy index.ts
    fs.copyFileSync("scripts/gen-client/index.ts.hbs", `${output}/index.ts`);
  });
}

genClient("docs/seller-api.yaml", "api/seller");
genClient("docs/supplier-api.yaml", "api/supplier");
genClient("docs/admin-api.yaml", "api/admin");
