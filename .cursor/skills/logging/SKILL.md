---
name: logging
description: Log directory (LOG_DIR) behavior across the monorepo. Use when adding or changing log directory behavior, LOG_DIR env, or file logging in any app or package.
version: 1.0.0
---

# Log directory (LOG_DIR) — monorepo rules

## When to use

- Adding or changing log directory behavior, LOG_DIR env, or file logging in any app or package.

## Rules

1. **No default value for log directory** in any monorepo app. Config must use
   `process.env.LOG_DIR ?? ''` (or equivalent) so that when unset, the value is empty.

2. **When LOG_DIR is empty or unset**, logs are console-only (no file transport). This avoids
   bulky log files inside containers when no external volume is mounted.

3. **When LOG_DIR is set** (e.g. in Docker with a volume), use the path that matches the
   external volume mount.

4. **Do not default to `./logs` or `/app/logs`** in app code; that causes file logging inside
   containers without a volume and can become bulky.

## Current state

Apps today use lightweight console loggers (e.g. `apps/api/src/lib/logger.ts`). When introducing
structured file logging, wire transports only when `LOG_DIR` is non-empty.

## References

- [AGENTS.md](/AGENTS.md) — env and config conventions
- **config-type-safety** rule — no silent defaults in `config/index.ts`
- [infra/docker/local/](/infra/docker/local/) — compose volume mounts when file logs are added
