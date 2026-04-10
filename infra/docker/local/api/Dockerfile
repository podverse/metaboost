# Metaboost API – local Docker (build from repo root)
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @metaboost/helpers-i18n && \
  npm run build -w @metaboost/helpers && \
  npm run build -w @metaboost/helpers-i18n && \
  npm run build -w @metaboost/helpers-requests && \
  npm run build -w @metaboost/helpers-backend-api && \
  npm run build -w @metaboost/orm && \
  npm run build -w @metaboost/api

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
