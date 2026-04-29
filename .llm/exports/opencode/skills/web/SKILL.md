---
name: web
description: Common patterns for the Metaboost Next.js app
version: 1.0.0
---


# Metaboost Web Patterns

- **Location**: `apps/web/`
- **Stack**: Next.js, React, TypeScript

## Runtime config (sidecar)

- The Next.js app can load runtime config from a sidecar server when `RUNTIME_CONFIG_URL` is set.
- Sidecar runs on a separate port (e.g. 3001) and serves GET `/runtime-config` with env-derived JSON.
- `instrumentation.ts` runs once at server start and fetches config; it is stored in a global/store and used in layout and components.

## Structure

- `src/app/` – App Router pages and layout
- `src/config/` – Runtime config types, store, server fetch
- `apps/web/sidecar/` – Standalone Node server that validates env and serves config

## Scripts

- `npm run dev` – Next.js dev server
- `npm run dev:sidecar` – Run sidecar (after building it)
- From root: `npm run dev:web-sidecar` – Build sidecar then run web with sidecar
