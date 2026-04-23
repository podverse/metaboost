# Metaboost Web – local Docker (build from repo root). Node 24.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY scripts/ ./scripts/

# Match root `build:packages` (e.g. helpers-currency) before Next build. Web `prebuild` runs
# per-app i18n compile.
RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @metaboost/helpers-i18n && \
  npm run build:packages && \
  npm run build -w @metaboost/web

EXPOSE 4002

ENV NODE_ENV=production
ENV PORT=4002

CMD ["npm", "run", "start", "-w", "@metaboost/web"]
