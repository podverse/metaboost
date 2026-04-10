# Boilerplate Web sidecar – runtime-config server (build from repo root)
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN npm ci --ignore-scripts && \
  npm run build -w @boilerplate/helpers && \
  npm run build -w @boilerplate/web-sidecar

EXPOSE 4001

ENV WEB_SIDECAR_PORT=4001

CMD ["node", "apps/web/sidecar/dist/server.js"]
