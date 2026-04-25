import logger from "@lib/logger";
import { sleep } from "./timer";

export interface RetryOptions<T> {
  /** Function to execute */
  fn: () => Promise<T>;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Callback to execute each time an attempt fails */
  onFail?: (error: Error, attempt: number) => Promise<void> | void;
  /** Callback to execute when all retry attempts are exhausted */
  onExhausted?: (error: Error, attempts: number) => Promise<void> | void;
  /** Delay in milliseconds between retries (default: 1000ms) */
  delay?: number;
  /** Throw error or not when all retry attempts are exhausted */
  throwErrorOnExhausted?: boolean;
}

/**
 * Retries a function with specified number of attempts and calls callbacks on failures
 * @param options Retry configuration options
 * @returns The result of the function or undefined if the function throws an error
 */
export async function retryFn<T>({
  fn,
  maxRetries,
  onFail = () => {},
  onExhausted = () => {},
  delay = 100,
  throwErrorOnExhausted = true,
}: RetryOptions<T>): Promise<T | undefined> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Await the onFail callback
      await onFail(lastError, attempt + 1);

      if (attempt < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }

  // Await the onExhausted callback
  await onExhausted(lastError, maxRetries);

  if (throwErrorOnExhausted) {
    throw lastError;
  }

  return undefined;
}
