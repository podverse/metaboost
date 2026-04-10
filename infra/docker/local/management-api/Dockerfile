# Metaboost Management API – local Docker (build from repo root)
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY scripts/management-api/create-super-admin.mjs ./scripts/management-api/create-super-admin.mjs

RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @metaboost/helpers-i18n && \
  npm run build -w @metaboost/helpers && \
  npm run build -w @metaboost/helpers-i18n && \
  npm run build -w @metaboost/helpers-requests && \
  npm run build -w @metaboost/helpers-backend-api && \
  npm run build -w @metaboost/orm && \
  npm run build -w @metaboost/management-orm && \
  npm run build -w @metaboost/management-api

EXPOSE 4100

CMD ["node", "apps/management-api/dist/index.js"]
