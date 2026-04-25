FROM node:20-alpine3.19 AS dep
RUN apk add --no-cache git
RUN npm install -g pnpm

FROM dep AS builder

ENV SKIP_POSTINSTALL=1
ENV CI=1

COPY package.json pnpm-lock.yaml /service/
WORKDIR /service
RUN pnpm i

COPY tsconfig.json /service/

COPY prisma /service/prisma
COPY static /service/static
COPY scripts /service/scripts
COPY src /service/src
COPY tsoa.json /service/

RUN pnpm db:generate && pnpm doc:generate && pnpm api:generate
RUN pnpm build

FROM dep AS runner
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV SKIP_POSTINSTALL=1
ENV CI=1

COPY --from=builder /service/package.json /service/pnpm-lock.yaml /service/tsconfig.json /service/
COPY --from=builder /service/static/email-template /service/static/email-template
COPY --from=builder /service/prisma /service/prisma
WORKDIR /service
RUN pnpm i --frozen-lockfile --prod
RUN pnpm db:generate

COPY --from=builder /service/dist /service/
COPY --from=builder /service/docs /service/docs
COPY tsoa.json /service/

ENTRYPOINT [ "node", "-r", "tsconfig-paths/register", "src/index.js" ]