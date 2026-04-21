# 01 - Registry Repo Foundation

## Scope

Create the foundational structure for `metaboost-registry` so it is immediately usable as the public source of app signing keys.

## Outcomes

- A minimal but complete repository layout exists.
- App records have a clear machine-validated schema.
- Maintainers and integrators can discover where records live and how they are consumed.
- Registry PR validation CI (`validate-registry`) exists as a required GitHub Actions status check.
- Podverse initial app registry record requirements are clearly defined for immediate submission.

## Steps

1. Add repository entry documentation in:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/README.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/README.md)
2. Add registry directory structure:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/)
3. Add a template/example app record:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/_example.app.json`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/_example.app.json)
4. Add JSON schema to validate app records:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/schema/app-record.schema.json`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/schema/app-record.schema.json)
5. Add concise schema usage notes:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/docs/SCHEMA.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/docs/SCHEMA.md)
6. Align field naming and required properties with current Standard Endpoint spec in:
   - [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md)
7. Add baseline GitHub Actions workflow scaffold and naming conventions to support required PR validation checks.
8. Define Podverse seed record submission checklist so the first real registry PR can be created immediately after Phase 1.

## Required Record Fields

- `app_id` (slug identifier)
- `display_name`
- `owner` block (organization/contact info)
- `status` (`active`, `suspended`, `revoked`)
- `signing_keys[]` (each key includes `kty`, `crv`, `x`, `alg`, optional `kid`, key status metadata)
- `created_at`, `updated_at` (ISO-8601 UTC)

## Design Rules

- One app record file per app under `registry/apps/`.
- File name equals app id (for example: `podverse.app.json`).
- Public data only; never include private keys or secrets.
- Keep schema strict (`additionalProperties: false`) to prevent drift.

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost-registry/README.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/README.md)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/_example.app.json`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/registry/apps/_example.app.json)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/schema/app-record.schema.json`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/schema/app-record.schema.json)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/docs/SCHEMA.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/docs/SCHEMA.md)

## Verification

- Manual check: a new contributor can answer "where do I add my app?" in less than 30 seconds.
- Schema check: example record validates successfully against schema.
- Consistency check: schema field names match the canonical signing doc.
- CI check: `validate-registry` runs on registry PRs and is configured as required before merge.
- Seed-gate check: Podverse seed record checklist exists and can be used to submit a valid first PR.

## Implementation Notes

- Keep documentation language simple and direct for external developers.
- Do not assume users know Metaboost internals.

## Completion Status

- Completed on 2026-04-16.
- Foundation files, schema, example record, and `validate-registry` workflow were created in `metaboost-registry`.
