import redis from "@lib/cache";
import { HTTPError, errors } from "@lib/http/errors";
import logger from "@lib/logger";
import Redlock, { type Lock } from "redlock";

// Create Redis client and connect
const redisClient = redis.getConnection();

const redlock = new Redlock([redisClient], {
  retryCount: 5,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 5000,
});

export function genLockKey(clusterKey: string, primaryKey: string) {
  return `lock:${clusterKey}:${primaryKey}`;
}

export const acquireLock = async (resourceKey: string, ttl = 10000) => {
  try {
    const lock = await redlock.acquire([resourceKey], ttl);
    return lock;
  } catch (error) {
    logger.error(
      `Failed to acquire lock for resource: ${resourceKey} - ${
        (error as Error).message
      }`,
    );
    throw new HTTPError(
      errors.Conflict,
      "Failed to acquire lock. Another operation may be in progress.",
    );
  }
};

export const releaseLock = async (lock: Lock) => {
  try {
    await lock.release();
  } catch (error) {
    logger.error(`Failed to release lock: ${(error as Error).message}`);
  }
};

export const extendLock = async (lock: Lock, ttl: number) => {
  try {
    await lock.extend(ttl);
  } catch (error) {
    logger.error(`Failed to extend lock: ${(error as Error).message}`);
  }
};
