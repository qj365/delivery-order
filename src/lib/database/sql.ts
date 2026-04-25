import { Prisma } from "@prisma/client";
import { database } from "../../lib/database";

interface PaginationQuery {
  select?: string;
  table: string;
  filter?: string;
  orderBy?: {
    column: string;
    order: "asc" | "desc";
  }[];
  limit: number;
  offset: number;
}

/**
 *
 * @param select
 * @param table
 * @param filter
 * @param orderBy
 * @param limit
 * @param offset
 * @returns {data: any[], total: number}
 * @example
 * const { data, total } = await paginationQuery({
 * select: "*",
 * table: "users",
 * filter: "name = 'John'",
 * orderBy: [{ column: "createdAt", order: "desc" }],
 * limit: 10,
 * offset: 0,
 * });
 */
export async function paginationQuery({
  select = "*",
  table,
  filter = "",
  orderBy = [{ column: "createdAt", order: "desc" }],
  limit,
  offset,
}: PaginationQuery): Promise<{
  data: { [key: string]: unknown }[];
  total: number;
}> {
  const orderByQuery = orderBy
    .map((order) => `${order.column} ${order.order}`)
    .concat("id asc")
    .join(", ");

  const filterQuery = filter
    ? Prisma.sql`WHERE ${Prisma.raw(filter)}`
    : Prisma.empty;

  const dataQuery = database.$queryRaw<{ [key: string]: unknown }[]>`
  SELECT ${Prisma.raw(select)} FROM ${Prisma.raw(table)}
    INNER JOIN (
        SELECT id FROM ${Prisma.raw(table)}
        ${filterQuery}
        ORDER BY ${Prisma.raw(orderByQuery)}
        LIMIT ${limit} OFFSET ${offset}
    ) AS t2 USING (id)
  ORDER BY ${Prisma.raw(orderByQuery)}`;

  const totalQuery = database.$queryRaw<{ total: number }[]>(
    Prisma.sql`
    SELECT COUNT(*) as total FROM ${Prisma.raw(table)}
    ${filterQuery}
  `,
  );

  const [data, total] = await Promise.all([dataQuery, totalQuery]);

  return {
    data,
    total: Number(total[0].total),
  };
}

/**
 *
 * @param data
 * @returns string
 * @example
 * const updateFields = buildSetQuery({
 *  total: 100,
 * payable: 50,
 * balance: undefined,
 * });
 * // total = 100, payable = 50
 */
export function buildSetQuery(
  data: Record<string, number | string | undefined>,
) {
  const updateFields = Object.entries(data)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => Prisma.sql`${Prisma.raw(key)} = ${value}`);

  return Prisma.join(updateFields, ", ");
}
