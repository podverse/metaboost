## Plan: CI Process Parity

Align Metaboost CI process to Podverse reference alignment including trigger model, check ordering, migration verification gates, and status reporting behavior.

## Steps
1. Align CI trigger and /test gating semantics.
2. Align validation stage ordering and naming.
3. Align migration verification coverage with baseline verification expectations.
4. Align success and failure reporting comments and commit status behavior.
5. Align publish pipeline conventions where parity is required.
6. Align related Cursor guidance files with Podverse when they define CI workflow expectations or process guardrails.
7. Align contributing and release docs with final CI process.
8. Remove template contract validation and generation dependencies from CI/make validation flow (including `validate-parity`, `validate-template contract`, and `scripts/env-template contract/*` usage in CI-facing paths).
9. Record a Podverse CI reference-alignment checklist with explicit decisions for any intentional divergence.

## Relevant files
- .github/workflows/ci.yml
- .github/workflows/publish-staging.yml
- .github/workflows/publish-main.yml
- docs/development/CONTRIBUTING.md
- docs/PUBLISH.md
- AGENTS.md

## Verification
1. CI workflow run shows expected gate behavior and check list.
2. Failure messaging includes actionable baseline and migration guidance.
3. Publish workflows complete with expected tag and promotion behavior.
4. CI and local validation paths no longer depend on template contract scripts/checks.
5. Parity checklist is complete with no unresolved unknowns.

## Decisions
- Near-identical process parity is target, not minimal parity.
- Cursor alignment is in-scope only for CI-related `.cursor` files touched by this phase.
