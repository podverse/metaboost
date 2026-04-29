## Plan: 01c Env Docs and Verification

Finalize docs and enforce verification gates for the env cutover.

## Steps
1. Update env docs and quick-start docs to describe only template-driven env flow.
2. Remove stale template contract-centric wording from docs and contributor guidance.
3. Add explicit verification commands for maintainers.
4. Align related Cursor files with Podverse only when they encode env documentation/process rules.

## Relevant files
- docs/QUICK-START.md
- docs/development/env/LOCAL-ENV-OVERRIDES.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- AGENTS.md

## Verification
1. `./scripts/nix/with-env npm run build` passes.
2. `./scripts/nix/with-env npm run lint` passes.
3. `./scripts/nix/with-env npm run test:e2e:api` passes if API env wiring changed.
4. Doc search confirms no stale references to removed env source-of-truth model.
