# Boilerplate Management Web – local Docker (build from repo root). Node 24.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY scripts/ ./scripts/

RUN npm ci --ignore-scripts && \
  npm run i18n:compile -w @boilerplate/helpers-i18n && \
  npm run build -w @boilerplate/helpers && \
  npm run build -w @boilerplate/helpers-i18n && \
  npm run build -w @boilerplate/helpers-requests && \
  npm run build -w @boilerplate/management-web

EXPOSE 4102

ENV NODE_ENV=production
ENV PORT=4102

CMD ["npm", "run", "start", "-w", "@boilerplate/management-web"]
