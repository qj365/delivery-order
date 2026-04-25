import { env } from "@src/env";
import pino, { type Logger } from "pino";
import pinoHttp, { type HttpLogger } from "pino-http";

const pinoOptions = {
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:standard",
      colorize: true,
      ignore: "pid,hostname",
    },
  },
};

const logger: Logger = pino(pinoOptions);
const logMiddleware: HttpLogger = pinoHttp({
  ...pinoOptions,
  serializers: {
    req: (req) => `${req.method} ${req.url}`,
    res: (res) => `${res.statusCode}`,
  },
});

export { logMiddleware };
export default logger;
