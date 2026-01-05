FROM oven/bun:1-alpine AS package

WORKDIR /app

COPY package.json bun.lock prisma.config.ts ./
COPY src/lib/prisma/schema.prisma ./src/lib/prisma/

RUN bun install
RUN bun prisma generate

FROM node:lts-alpine AS build

WORKDIR /app

COPY . .

COPY --from=package /app/node_modules /app/node_modules
COPY --from=package /app/src/lib/prisma/generated /app/src/lib/prisma/generated

ENV APP_ENV=development

RUN npm run build

FROM node:lts-alpine AS runtime

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone .
COPY --from=build --chown=nextjs:nodejs /app/public /app/public
COPY --from=build --chown=nextjs:nodejs /app/.next/static /app/.next/static

USER nextjs

EXPOSE 3000

CMD [ "node", "server.js" ]
