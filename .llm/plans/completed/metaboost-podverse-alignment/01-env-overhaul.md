## Plan: Replace Template contract Env System

Replace Metaboost template contract as env source-of-truth with Podverse-style template and override flow. Result: .env.example and env-template files become canonical, local setup scripts manage generation and secret fill directly, and Make targets mirror Podverse process semantics.

This phase is split into smaller executable plans to reduce risk and review size:

1. [01a-env-contract-source-of-truth.md](../../completed/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md) (completed)
2. [01b-env-script-and-make-cutover.md](../../completed/metaboost-podverse-alignment/01b-env-script-and-make-cutover.md) (completed)
3. [01c-env-docs-and-verification.md](../../completed/metaboost-podverse-alignment/01c-env-docs-and-verification.md) (completed)

## Steps
1. 01a, 01b, and 01c are complete.
2. Do not start expiration rename phase until 01c verification passes.
3. Keep Cursor alignment scoped to env-related files only when directly affected.

## Relevant files
- scripts/local-env/setup.sh
- scripts/local-env/prepare-local-env-overrides.sh
- scripts/local-env/link-local-env-overrides.sh
- scripts/env-overrides/prepare-home-env-overrides.sh
- makefiles/local/Makefile.local.env.mk
- makefiles/local/Makefile.local.mk
- docs/development/env/LOCAL-ENV-OVERRIDES.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- docs/QUICK-START.md

## Verification
1. All verification gates in 01a, 01b, and 01c pass.
2. Final env workflow works from a clean state with no template contract dependency.

## Decisions
- Template contract is removed as central truth.
- Template and example files are canonical.
- Documentation references only the new contract.
- Cursor alignment is in-scope only for env-related `.cursor` files touched by this phase.
