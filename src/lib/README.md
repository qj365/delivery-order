# NodeJS Server template

This is backend template for Taring NodeJS server.

## How to use

### Environment variables

We create `.env.example` file to show all environment variables that we use in project. You have to copy `.env.example` file to `.env` file and fill all variables with your values.

### Database

We use [Prisma ORM](https://www.prisma.io/) for database.
The schema of database is in `prisma/schema.prisma` file. You can find more information about schema [here](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema).

We already defined some models in `prisma/schema.prisma` file. You can add more models there or modify existing ones.

Read more about database module [here](./database/README.md).

### Configuration

We write a config module in `config` folder with a default config file (`config/default.json`).

To add new config, you have to add on `config/default.json` file. You can change initial value of config in `config/index.ts` file. We already write some code to override default config value with environment variables, so you can read `config/index.ts` file to understand how to use it.

To use config in your code, you can import `config` module and use it like this:

```ts
import config from "~/config";

const { port } = config.http;
```

You can change the config value in production by providing `config.json` file in `config` folder. Every config value in `config.json` file will override the default value. File `config.json` is ignored by git, so you can safely add it to your repository.

### Pino

We use [Pino](https://getpino.io/) to log. We already write a logger module in `src/lib/logger` folder. You can use it like this:

```ts
import logger from "~/lib/logger";

logger.info("Hello world");
```

**Notes**:

- Please use `logger` module to log instead of using `console.log` or `console.error` directly.

### HTTP routes

We use `tsoa` library (with a little bit of custom code) to generate routes from controllers. You can find more information about `tsoa` [here](https://tsoa-community.github.io/docs/).

We already created 2 routes `/auth` and `/user`, you can find them in `src/domains` folder. This is just an example, provide a very simple authentication and user management. You can remove them or modify to fit your needs.

**Notes**:

- Some notes about using `tsoa` library: [here](./http/README.md).
- Learn how to add new domain [here](#add-new-domain).

### Authentication

### HTTP Error System

### Text response with multi-language support

## Add new domain

## Other dev tools

### Prettier

We use [Prettier](https://prettier.io/) to format code. To make code by all contributors have the same format, we add `.prettierrc.json` file to config Prettier.

You can find more information about Prettier config [here](https://prettier.io/docs/en/configuration.html).

To format code, you can run `yarn lint:fix` command.

### Husky

[Husky](https://typicode.github.io/husky/#/) is a tool to run scripts when git hooks are triggered. We use it to run `yarn lint:fix` command before every commit, so we can make sure that code is formatted before commit.

You can find more information about Husky [here](https://typicode.github.io/husky/#/).

### Nodemon

We use [Nodemon](https://nodemon.io/) to run server in development mode. Nodemon will watch for any changes in your source and automatically restart your server.

Run `yarn start` to start server in development mode.

### Docker

We use [Docker](https://www.docker.com/) to run server in production mode and we already write a `Dockerfile` to build image. If you add file which is not covered by this template, you have to add it to `Dockerfile` to make sure that it will be included in image.
