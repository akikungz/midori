FROM node:lts-alpine AS based

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM based AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM based AS build

WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules /app/node_modules

ENV APP_ENV=development

RUN pnpm build

FROM node:lts-alpine AS runtime

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone .
COPY --from=build --chown=nextjs:nodejs /app/public /app/public
COPY --from=build --chown=nextjs:nodejs /app/.next/static /app/.next/static

RUN apk add --no-cache openssl ca-certificates \
  && update-ca-certificates

USER nextjs

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--use-system-ca", "server.js"]
