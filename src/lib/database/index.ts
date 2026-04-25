import { type Prisma, PrismaClient } from "@prisma/client";
import "../../types/prisma";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { env } from "@src/env";

const logs: Array<Prisma.LogLevel | Prisma.LogDefinition> =
  env.DATABASE_LOG_LEVEL?.split(",").map(
    (str) => str.trim() as Prisma.LogLevel,
  ) ?? ["error"];

export const database = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: logs,
});

export const databaseRead = env.DATABASE_READ_URL
  ? new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_READ_URL,
        },
      },
      log: logs,
    })
  : database;

export type PrismaTransactionClient =
  | Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >
  | PrismaClient<
      {
        datasources: {
          db: {
            url: string;
          };
        };
        log: ("query" | "warn" | "error" | "info")[];
      },
      never,
      DefaultArgs
    >;
