# Docs Reference Alignment Checklist (07)

> Historical completed-phase artifact. Kept for traceability only.
> Active process guidance lives in maintained docs such as `AGENTS.md`, `docs/development/k8s/REMOTE-K8S-GITOPS.md`, and env docs under `docs/development/env/`.

Date: 2026-04-28
Phase: 07-docs-alignment

## Scope

- Maintained docs and process guidance for env, k8s, release, and contributor workflows.
- Related Cursor guidance files that define docs/process contracts in this scope.
- Final env-process documentation sweep for active paths.

## Checklist

- [x] AGENTS env/process guidance updated to template-driven contract wording.
- [x] K8s remote GitOps runbooks aligned to dotenv overlay path (`remote-k8s.env`).
- [x] Env source-of-truth docs use template-driven source references only.
- [x] Cursor docs/process guidance files in scope updated for template-driven env/k8s contract wording.
- [x] Release/testing docs updated to remove stale env-process wording.
- [x] Maintained-source/docs zero-reference verification run for deprecated env-process path names.

## Verification Notes

Historical verification evidence (not current execution instructions):

- Zero-reference grep over maintained docs/source scope returned no matches for:
  - deprecated env-process directory names
  - deprecated env-process validation script names
  - `remote-k8s.yaml`
  - deprecated remote overlay env var aliases
- Lint verification command was executed and failed on an existing web type-check issue outside 07 docs scope (`apps/web/playwright.e2e-webservers.ts` import mismatch).

## Intentional Divergences

- None.
