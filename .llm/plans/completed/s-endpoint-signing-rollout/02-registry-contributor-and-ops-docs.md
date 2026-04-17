# 02 - Registry Contributor And Ops Docs

## Scope

Create simple contributor and operational guidance for app registration, public key lifecycle, and registry validation workflow.

## Outcomes

- Third-party developers can register an app and key without direct maintainer help.
- Registry maintainers have a clear review checklist.
- Key rotation and emergency revocation steps are explicit.

## Steps

1. Add contributor guide:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/CONTRIBUTING.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/CONTRIBUTING.md)
2. Add PR checklist template:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/.github/pull_request_template.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/.github/pull_request_template.md)
3. Add security disclosure and key-compromise process:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/SECURITY.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/SECURITY.md)
4. Add CI plan for registry JSON validation:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/.github/workflows/validate-registry.yml`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/.github/workflows/validate-registry.yml)
5. Add docs page linking registration to runtime usage:
   - [`/Users/mitcheldowney/repos/pv/metaboost-registry/docs/ONBOARDING.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/docs/ONBOARDING.md)
6. Require branch protection/status checks so PR merge is blocked unless `validate-registry` GitHub Action passes.

## Contributor Flow To Document

1. Generate Ed25519 keypair in backend infrastructure.
2. Keep private key secret and never commit it.
3. Encode public key fields into `signing_keys[]` record format.
4. Add `registry/apps/<app_id>.app.json`.
5. Open PR and complete checklist.
6. Wait for merge and registry poll window before production use.

## Ops Flow To Document

- Rotate key with controlled update (`updated_at` and optional `kid` changes).
- Suspend or revoke app by status update and communicate expected enforcement timing.
- Handle emergency compromise by setting `status` and publishing replacement guidance.
- Maintain CI enforcement for PR validation as a merge precondition.

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost-registry/CONTRIBUTING.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/CONTRIBUTING.md)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/SECURITY.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/SECURITY.md)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/docs/ONBOARDING.md`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/docs/ONBOARDING.md)
- [`/Users/mitcheldowney/repos/pv/metaboost-registry/.github/workflows/validate-registry.yml`](file:///Users/mitcheldowney/repos/pv/metaboost-registry/.github/workflows/validate-registry.yml)

## Verification

- Dry run: use docs only to create a valid sample app PR.
- CI simulation: invalid JSON/schema fails; valid app record passes.
- Security check: docs explicitly state private key handling and compromise path.
- Merge-gate check: repository settings require the validation workflow status check before merge.

## Implementation Notes

- Keep content concise and operationally practical.
- Link to canonical Metaboost signing protocol doc instead of duplicating protocol internals.

## Completion Status

- Completed on 2026-04-16.
- Added contributor guide, PR template, security policy, onboarding guide, and merge-gate guidance tied to `validate-registry`.
