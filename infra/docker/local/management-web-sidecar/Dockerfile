# Metaboost Management Web sidecar – runtime-config server (build from repo root)
FROM node:26-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN npm ci --ignore-scripts && \
  npm run build -w @metaboost/helpers && \
  npm run build -w @metaboost/management-web-sidecar

EXPOSE 4101

ENV PORT=4101

CMD ["node", "apps/management-web/sidecar/dist/server.js"]
