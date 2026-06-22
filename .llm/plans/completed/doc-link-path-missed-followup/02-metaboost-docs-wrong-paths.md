# 02 — Metaboost docs wrong-path fixes

Script skipped these because resolved paths did not exist. Replace manually:

| File | Current | Replace with |
| --- | --- | --- |
| `docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md` (×2) | `../development/ENV-REFERENCE.md` | `/docs/development/env/ENV-REFERENCE.md` |
| `docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md` (×2) | same | same |
| `docs/testing/E2E-PAGE-TESTING.md` | `../development/ENV-REFERENCE.md` | `/docs/development/env/ENV-REFERENCE.md` |
| `docs/development/env/LOCAL-ENV-OVERRIDES.md` | `../QUICK-START.md` | `/docs/QUICK-START.md` |
| `docs/development/tooling/LOCKFILE-LINUX.md` | `../QUICK-START.md` | `/docs/QUICK-START.md` |
| `docs/development/security/SECURITY-REVIEW-CHECKLIST.md` | `../CURSOR-NIX-WITH-ENV.md` | `/docs/CURSOR-NIX-WITH-ENV.md` |
| `infra/k8s/INFRA-K8S.md` | `../../docs/QUICKSTART.md` | `/docs/QUICK-START.md` |

## Verify

```bash
rg '\]\(\.\./' docs/ infra/k8s/INFRA-K8S.md --glob '*.{md,mdc}'
```

Expected: no matches in these paths.
