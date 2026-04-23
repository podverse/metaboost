# Metaboost Management API – local Docker (build from repo root)
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY scripts/management-api/create-super-admin.mjs ./scripts/management-api/create-super-admin.mjs

# Match root `build:packages` so every workspace in `package.json` (main/types in dist/) is
# built before the app. Hand-picked subsets omit deps (e.g. helpers-currency, helpers-valkey) and
# `tsc` for the app fails in CI.
RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @metaboost/helpers-i18n && \
  npm run build:packages && \
  npm run build -w @metaboost/management-api

EXPOSE 4100

CMD ["node", "apps/management-api/dist/index.js"]
