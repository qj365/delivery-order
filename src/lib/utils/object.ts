export function excludeField<T, Key extends keyof T>(
  data: T,
  keys: Key[],
): Omit<T, Key> {
  for (const key of keys) {
    delete data[key];
  }
  return data;
}

export function excludeFieldArr<T, Key extends keyof T>(
  data: T[],
  keys: Key[],
): Omit<T, Key>[] {
  return data.map((item) => excludeField(item, keys));
}

export function createIncrementFields<
  T extends Record<string, number | undefined>,
>(data: T) {
  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = { increment: value };
      }
      return acc;
    },
    {} as Record<string, { increment: number }>,
  );
}
