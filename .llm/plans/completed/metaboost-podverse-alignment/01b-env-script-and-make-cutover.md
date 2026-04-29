## Plan: 01b Env Script and Make Cutover

Implement the script and Make target cutover to the new env contract.

## Steps
1. Rebuild `scripts/local-env/setup.sh` to generate/fill env from canonical templates/examples.
2. Update prepare/link flows so overrides are seeded from canonical examples, not template contract output.
3. Remove template contract merge commands from local env Make targets.
4. Update `make local_env_prepare`, `make local_env_link`, `make local_env_setup`, `make local_env_clean`, and `make local_setup` behavior descriptions and dependencies.
5. Align related Cursor files with Podverse only for env tooling workflow guidance where directly relevant.

## Relevant files
- scripts/local-env/setup.sh
- scripts/local-env/prepare-local-env-overrides.sh
- scripts/local-env/link-local-env-overrides.sh
- scripts/env-overrides/prepare-home-env-overrides.sh
- makefiles/local/Makefile.local.env.mk
- makefiles/local/Makefile.local.mk

## Verification
1. `make local_env_prepare && make local_env_link && make local_env_setup` succeeds from clean state.
2. `make local_env_clean` removes generated env outputs and leaves override home files intact.
3. `./scripts/nix/with-env npm run build` and `./scripts/nix/with-env npm run lint` pass.
