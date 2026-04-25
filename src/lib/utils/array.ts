export function splitArray<T>(array: T[], size: number) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function mapByBatch<T, Y>(
  array: T[],
  batchSize: number,
  handler: (batch: T) => Promise<Y> | Y,
) {
  const batches = splitArray(array, batchSize);
  const results: Y[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const result = await Promise.all(batch.map(handler));
    results.push(...result);
  }

  return results;
}

export function groupByField<T>(array: T[], field: keyof T) {
  if (array.length === 0) {
    return [];
  }

  type Y = T[keyof T];
  const tmp: {
    [key: string]: {
      indexes: Y[];
      data: Omit<T, typeof field>;
    };
  } = {};

  for (const item of array) {
    const { [field]: index, ...data } = item;
    const key = JSON.stringify(data);

    if (!tmp[key]) {
      tmp[key] = {
        indexes: [index],
        data,
      };
    } else {
      tmp[key].indexes.push(index);
    }
  }

  return Object.values(tmp);
}

/**
 *
 * @param array
 * @returns true if all elements in the array are unique, false otherwise
 */
export function isUniqueArray<T>(array: T[]) {
  return new Set(array).size === array.length;
}

/**
 * Combine arrays into a single array
 * @param arrays
 * @returns an array of arrays
 * @example combineArrays([['a', 'b'], ['1', '2']]) => [['a', '1'], ['a', '2'], ['b', '1'], ['b', '2']]
 */
export function combineArrays<T>(...arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];

  if (arrays.length === 1) return arrays[0].map((item) => [item]);

  const firstArray = arrays[0];
  const remainingArrays = arrays.slice(1);

  const combined = combineArrays(...remainingArrays);

  return firstArray.flatMap((item) =>
    combined.map((combo) => [item, ...combo]),
  );
}

/**
 * Split array into batches and process each batch
 * @param array the array to be split
 * @param batchSize the size of each batch
 * @param handler the function to process each batch
 * @returns an array of results
 */
export async function processBatches<T, Y>(
  array: T[],
  batchSize: number,
  handler: (batch: T[]) => Promise<Y> | Y,
) {
  const batches = splitArray(array, batchSize);
  const results: Y[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const result = await handler(batch);
    results.push(result);
  }

  return results;
}

export function checkDuplicateField<T>(array: T[], field: keyof T): boolean {
  const fieldValues = new Set<T[keyof T]>();
  for (const item of array) {
    const value = item[field];

    fieldValues.add(value);
  }

  return fieldValues.size !== array.length;
}
