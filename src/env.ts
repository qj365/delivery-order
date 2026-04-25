import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envVariables = z.object({
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  WEB_BASE_URL: z.string().default("http://localhost:3001"),

  JWT_SECRET_KEY: z.string().default("secret"),

  DATABASE_URL: z
    .string()
    .url()
    .default("mysql://root:root@localhost:3306/fulfillment"),
  DATABASE_READ_URL: z
    .string()
    .url()
    .default("mysql://root:root@localhost:3306/fulfillment"),
  DATABASE_LOG_LEVEL: z.string().optional().default("error"),

  REDIS_URL: z.string().url().default("redis://localhost:6379"),
});

let env = envVariables._type;
if (!process.env.IS_UNIT_TEST_ENV) {
  env = envVariables.parse(process.env);
} else {
  // biome-ignore lint: no-explicit-any
  env = {} as any;
}

export { env };
