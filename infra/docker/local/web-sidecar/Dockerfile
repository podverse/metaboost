# Metaboost Web sidecar – runtime-config server (build from repo root)
FROM node:25-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN npm ci --ignore-scripts && \
  npm run build -w @metaboost/helpers && \
  npm run build -w @metaboost/web-sidecar

EXPOSE 4001

ENV WEB_SIDECAR_PORT=4001

CMD ["node", "apps/web/sidecar/dist/server.js"]
