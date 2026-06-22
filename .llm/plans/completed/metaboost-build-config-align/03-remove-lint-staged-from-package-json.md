# 03 — Remove lint-staged from package.json

## Scope

Podverse has no `lint-staged` in root `package.json`. Plan 07 aligns git hooks to pre-push only.
Remove lint-staged config and devDependency when pre-commit hook is dropped.

## Steps

1. Complete `metaboost-dev-scripts-align/01-align-git-hooks-with-podverse.md` first (or in same PR).
2. Remove `lint-staged` from `devDependencies` and delete the `lint-staged` key in root `package.json`.
3. Run `npm install` and commit lockfile (run `update-lockfile-linux.sh` if on macOS).

## Verification

```bash
rg -n "lint-staged" package.json || echo "lint-staged removed"
./scripts/nix/with-env npm run lint
```
