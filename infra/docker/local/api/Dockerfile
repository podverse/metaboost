# Metaboost API – local Docker (build from repo root)
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Match root `build:packages` (includes orm, rss-parser, helpers-valkey, helpers-currency, etc.).
RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @metaboost/helpers-i18n && \
  npm run build:packages && \
  npm run build -w @metaboost/api

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
