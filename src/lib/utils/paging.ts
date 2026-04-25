import type {
  Cursor,
  CursorPagingResponse,
  NumberedPagingResponse,
} from "@src/types/paging";

export function convertToPaging<T extends { [key: string]: unknown }, Y>(
  data: T[],
  prePageIndex?: Y,
  indexKey?: keyof T,
) {
  let _indexKey = indexKey;
  if (data.length === 0) {
    return {
      data: data,
      total: 0,
      prePageIndex: prePageIndex ?? null,
      nextPageIndex: null,
      orderBy: _indexKey as string,
    };
  }

  if (!_indexKey) {
    if (!Object.keys(data[0]).includes("id")) {
      throw new Error("convertToPaging: indexKey is required");
    }
    _indexKey = "id" as keyof T;
  }
  return {
    data: data,
    total: data.length,
    prePageIndex: prePageIndex ?? null,
    nextPageIndex:
      data.length > 0 ? (data[data.length - 1][_indexKey] as Y) : null,
    orderBy: _indexKey as string,
  };
}

export function convertToNumberedPaging<T extends { [key: string]: unknown }>(
  data: T[],
  total: number,
  pageSize: number,
  page: number,
): NumberedPagingResponse<T[]> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function convertToCursorPaging<T extends { [key: string]: unknown }>(
  data: T[],
  pageSize: number,
  cursor?: string,
  indexKey: keyof T = "id",
): CursorPagingResponse<T[]> {
  const hasNextPage = data.length > pageSize;
  const resultsToReturn = data.slice(0, pageSize);

  return {
    data: resultsToReturn,
    nextCursor: hasNextPage
      ? String(resultsToReturn[resultsToReturn.length - 1][indexKey])
      : undefined,
    previousCursor: cursor,
  };
}

/**
 *
 * @param sort sort query string
 * @returns {column: string, order: "asc" | "desc"}[]
 * @example
 * parseSortQuery("date, -name") => [{column: "date", order: "asc"}, {column: "name", order: "desc"}]
 */
export function parseSortQuery(sort: string) {
  return sort.split(",").map((s) => {
    const order: "desc" | "asc" = s.trim().startsWith("-") ? "desc" : "asc";
    return {
      column: s.replace("-", "").trim(),
      order,
    };
  });
}

export function decodeCursor(cursor: string) {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

export function encodeCursor(cursor: string | number): Cursor {
  return Buffer.from(String(cursor)).toString("base64");
}
