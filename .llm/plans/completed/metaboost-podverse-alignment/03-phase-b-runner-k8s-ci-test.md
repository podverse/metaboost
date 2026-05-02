# Phase B Plan: Runner, K8s, CI, and Local Test Convergence

Goal: unify migration execution paths across local, CI, and k8s so behavior matches podverse process contracts.

## Scope
1. Align runner path/env contract to podverse semantics.
2. Align ops migration cronjob mount/env wiring.
3. Switch CI DB init to migration runner model.
4. Switch local test DB init to migration runner model.

## Work items
1. Runner contract convergence
- Update metaboost runner and k8s wrapper scripts to support explicit base-dir/dir migration path contract.
- Remove brittle path inference where possible.

2. K8s job wiring convergence
- Update app and management migration cronjobs to pass explicit migration base-dir contract env.
- Keep configmap-hash based anti-staleness behavior.

3. CI process convergence
- Replace direct schema file imports in CI DB init with runner-based app and management migration application.
- Preserve role/user setup required for integration tests.

4. Local test process convergence
- Update `makefiles/local/Makefile.local.test.mk` to use runner-based app and management DB init.
- Preserve metaboost test ports and existing integration test expectations.

## Acceptance criteria
1. Runner scripts behave consistently in local and k8s contexts and follow the same env/path contract as podverse.
2. Ops cronjobs execute with explicit migration bundle path semantics.
3. CI DB init uses forward-only migration runner commands.
4. Local `make test_deps` path initializes DBs from forward-only migration runners, not direct schema snapshots.

## Suggested execution order
1. Update runner and k8s wrapper scripts.
2. Update cronjobs and ops kustomization references.
3. Update CI workflow.
4. Update local test makefile.
5. Run test and migration validation end-to-end.
