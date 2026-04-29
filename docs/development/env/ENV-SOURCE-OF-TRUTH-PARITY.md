# Env Source of Truth Contract

This document records the 01a env source-of-truth contract and file-level mapping.

## Canonical source-of-truth contract

For contributor-facing env contracts in Metaboost:

1. App templates/examples live in `apps/*/.env.example` and `apps/*/sidecar/.env.example`.
2. Infra workload templates/examples live in `infra/config/env-templates/*.env.example`.
3. Runtime merges and render scripts consume template-derived env outputs and optional override layers; contributor-facing source-of-truth remains the checked-in `.env.example` templates.

## Precedence model (authoritative order)

1. App and infra `.env.example` templates define canonical variable sets and default expectations.
2. Profile-specific env generation/merging uses template-derived defaults and override inputs.
3. Environment-specific override files (`dev/env-overrides/<env>/*.env` and linked home overrides) apply last.

## Template matrix

| Workload                              | Canonical file                                                  | Notes                                                      |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| API app env                           | `apps/api/.env.example`                                         | Added in 01a; generated from current merged env contract.  |
| Management API app env                | `apps/management-api/.env.example`                              | Added in 01a.                                              |
| Web app env                           | `apps/web/.env.example`                                         | Added in 01a.                                              |
| Web sidecar env                       | `apps/web/sidecar/.env.example`                                 | Added in 01a.                                              |
| Management web app env                | `apps/management-web/.env.example`                              | Added in 01a.                                              |
| Management web sidecar env            | `apps/management-web/sidecar/.env.example`                      | Added in 01a.                                              |
| Infra API template                    | `infra/config/env-templates/api.env.example`                    | Added in 01a.                                              |
| Infra management API template         | `infra/config/env-templates/management-api.env.example`         | Added in 01a.                                              |
| Infra web template                    | `infra/config/env-templates/web.env.example`                    | Added in 01a.                                              |
| Infra web sidecar template            | `infra/config/env-templates/web-sidecar.env.example`            | Added in 01a.                                              |
| Infra management web template         | `infra/config/env-templates/management-web.env.example`         | Added in 01a.                                              |
| Infra management web sidecar template | `infra/config/env-templates/management-web-sidecar.env.example` | Added in 01a.                                              |
| Infra DB template                     | `infra/config/env-templates/db.env.example`                     | Added in 01a.                                              |
| Infra keyval template                 | `infra/config/env-templates/keyvaldb.env.example`               | Added in 01a; generated from Metaboost `valkey` env group. |

## Implementation notes

1. Local defaults (ports, hostnames, app-specific values) are set per this repository’s runtime model.
2. Render/generation internals are script-driven, while the contributor-facing contract is the checked-in `.env.example` template layer.
