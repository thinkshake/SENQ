# syntax=docker/dockerfile:1

FROM oven/bun:1.2 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Production
FROM base AS runner
ENV NODE_ENV=production

# Create data directory for SQLite
RUN mkdir -p /data && chown -R bun:bun /data

COPY . .
RUN rm -rf node_modules
COPY --from=deps /app/node_modules ./node_modules

USER bun
EXPOSE 3001

ENV PORT=3001
ENV DATABASE_PATH=/data/mitate.db

CMD ["bun", "run", "src/index.ts"]
