# 03 — Align publish workflows and Dependabot

## Scope

Port Podverse resilience patterns into MetaBoost publish workflows; align Dependabot config.

## Publish workflows

| File | Changes from Podverse triage |
| --- | --- |
| `publish-staging.yml` | Add npm ci retry loop; port reserve-version logging/error handling improvements where compatible with MB semver line |
| `publish-main.yml` | Same retry/resilience patterns |
| `publish-metaboost-signing.yml` | MB-only — verify no changelog hooks; align npm ci retry if present |

Confirmed: **no** `CHANGELOG` or `llm-exports` references in publish workflows (Plan 01/02).

## Dependabot

- Align comment structure and `@types/node` ignore policy with Podverse where MB claims “aligned with Podverse”.
- **Keep** MB docker path `infra/docker/local/*` (Podverse may use different docker layout).

## Verification

```bash
rg -n "CHANGELOG|llm-exports" .github/workflows .github/dependabot.yml || echo clean
```
