---
description: "Environment file formatting - non-empty values in double quotes, empty unset"
applyTo:
  - "**/.env"
  - "**/.env.*"
  - "**/.env.example"
  - "infra/config/local/*.env"
  - "dev/env-overrides/local/*.env"
  - "dev/env-overrides/alpha/*.env"
---

# Environment File Formatting

- **Non-empty values**: Use double quotes (e.g. `API_PORT="3000"`).
- **Empty/unset values**: No value after `=` (e.g. `OPTIONAL_VAR=`).
- **Alignment**: When creating or editing generated env files, follow variable order and grouping from [`infra/env/classification/base.yaml`](../../infra/env/classification/base.yaml) and any authoritative app env template documented for that app. Only values may differ.

Correct: `DATABASE_HOST="localhost"`, `EMPTY_VALUE=`. Incorrect: `DATABASE_HOST=localhost`, `EMPTY_VALUE=""`.
