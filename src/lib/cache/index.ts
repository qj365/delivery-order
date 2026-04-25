import { env } from "@src/env";
import Redis from "ioredis";

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

function genKey(clusterKey: string, primaryKey: string) {
  return `${clusterKey}:${primaryKey}`;
}

/**
 * Get a caching, if not then execute a function and cache result
 * @param redisClient redis client
 * @param key key to get from cache
 * @param json if true return object else return string
 * @return return object if option json = true else return a string
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function getCachedValue<T = any>(
  redisClient: Redis,
  key: string,
  json = true,
) {
  const value = await redisClient.get(key);

  if (!value) return null;

  if (json) {
    return JSON.parse(value) as T;
  }
  return value as T;
}

/**
 * Set a caching
 * @param redisClient redis client
 * @param key key to set cache
 * @param value value to set
 * @param ttl expire time in seconds, if -1 then never expire
 */
async function setCachedValue(
  redisClient: Redis,
  key: string,
  value: object | string | number,
  ttl = -1,
) {
  let parseValue: string | number;
  if (typeof value === "object") {
    parseValue = JSON.stringify(value);
  } else {
    parseValue = value;
  }

  if (ttl === -1) {
    await redisClient.set(key, parseValue);
  } else {
    await redisClient.set(key, parseValue, "EX", ttl);
  }
}

// function right push to list
async function leftPushList(
  redisClient: Redis,
  key: string,
  value: object | string | number,
  ttl = -1,
) {
  let parseValue: string | number;
  if (typeof value === "object") {
    parseValue = JSON.stringify(value);
  } else {
    parseValue = value;
  }

  await redisClient.lpush(key, parseValue);
  if (ttl !== -1) {
    await redisClient.expire(key, ttl);
  }
}

// function last element of list
async function getFromListByIndex(
  redisClient: Redis,
  key: string,
  index: number,
  json = true,
) {
  const value = await redisClient.lindex(key, index);
  return value && json ? JSON.parse(value) : null;
}

async function cachedFn<T extends string | number | object>(
  redisClient: Redis,
  {
    key,
    ttl = -1,
    json = true,
  }: {
    key: string;
    ttl?: number;
    json?: boolean;
  },
  fn: () => Promise<T>,
) {
  const cachedValue = await getCachedValue(redisClient, key, json);
  if (cachedValue) {
    return cachedValue;
  }

  const result = await fn();
  await setCachedValue(redisClient, key, result, ttl);
  return result;
}

export default {
  getConnection: () => redis,
  genKey,
  getCachedValue,
  setCachedValue,
  leftPushList,
  getFromListByIndex,
  cachedFn,
};
