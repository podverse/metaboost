## Plan: 05c Linear CI Validation and Docs

Finalize CI checks and documentation for forward-only migrations.

## Steps
1. Align CI migration verification to baseline/linear workflow expectations.
2. Ensure CI status messaging clearly distinguishes baseline mismatch from runner failure.
3. Update migration docs and contributor docs to reflect only forward-only linear workflow.
4. Align related Cursor guidance files with Podverse only where they enforce migration CI/process rules.

## Relevant files
- .github/workflows/ci.yml
- docs/development/DB-MIGRATIONS.md
- docs/development/CONTRIBUTING.md
- AGENTS.md

## Verification
1. CI checks pass with linear migration verification enabled.
2. Failure output is actionable for baseline regen and verification.
3. Podverse reference-alignment checklist for migration CI/doc behavior is complete.
