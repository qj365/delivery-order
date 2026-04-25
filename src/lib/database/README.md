# Database module

Database module use [Prisma](https://www.prisma.io/) to connect to your database. Read more about Prisma [here](https://www.prisma.io/docs/).

## Usage

- Add your database schema in `prisma/schema.prisma` file.

  ```prisma
  model Book {
    id        Int      @id @default(autoincrement())

    title     String
    author    String
    price     Int

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```

  Read more about Prisma schema [here](https://www.prisma.io/docs/concepts/components/prisma-schema).

- Run `yarn prisma generate` to generate Prisma client.
- Run `yarn prisma migrate dev` to create database tables.
- Just import this module and use your database in your code.

  ```ts
  import database from "~/lib/database";

  const book = await database.book.findUnique({
    where: { id: id },
  });
  ```
