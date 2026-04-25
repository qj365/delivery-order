import HTTPServer from "@lib/http";
import { RegisterRoutes } from "./routes";

// add toJSON for bigint
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const httpServer = new HTTPServer(RegisterRoutes);

async function main() {
  httpServer.listen();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
