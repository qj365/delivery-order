export type Cursor = string;

export class QueriesNumberedPaging {
  /**
   * @isNumber page should be a number
   * @minimum 1 page should not be less than 1
   */
  page = 1;

  /**
   * @isNumber pageSize should be a number
   * @minimum 1 pageSize should not be less than 1
   */
  pageSize = 20;
}

export class QueriesCursorPaging {
  /**
   * @isString cursor should be a string
   */
  cursor?: string;

  // cursor must be encoded in base64
  /**
   * @isNumber pageSize should be a number
   * @minimum 1 pageSize should not be less than 1
   */
  pageSize = 20;
}

export type NumberedPagingResponse<T> = {
  data: T;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CursorPagingResponse<T> = {
  data: T;
  nextCursor?: Cursor;
  previousCursor?: Cursor;
};

export type ElasticSearchAfter = {
  score: number;
  id: string;
  page: number;
};

export type ElasticCursorPagingResponse<T> = {
  data: T;
  searchAfter?: ElasticSearchAfter;
};

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}
