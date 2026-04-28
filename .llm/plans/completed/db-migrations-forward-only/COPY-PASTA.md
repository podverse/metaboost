# Metaboost DB migrations - COPY-PASTA

Execution model: phases are sequential (`01 -> 02 -> 03 -> 04`).  
Complete each phase before starting the next one.

---

## Phase 1 - Canonical linear contract

Status: COMPLETED (moved to `.llm/plans/completed/db-migrations-forward-only/01-canonical-linear-migration-contract.md`).

---

## Phase 2 - Scripts, CI, and Makefile cutover

Status: COMPLETED (moved to `.llm/plans/completed/db-migrations-forward-only/02-linear-scripts-ci-and-make-cutover.md`).

---

## Phase 3 - metaboost-ops K8s jobs

Status: COMPLETED (moved to `.llm/plans/completed/db-migrations-forward-only/03-metaboost-ops-k8s-jobs-and-cache-safety.md`).

---

## Phase 4 - docs and legacy cleanup

Status: COMPLETED (moved to `.llm/plans/completed/db-migrations-forward-only/04-docs-runbooks-and-legacy-reference-removal.md`).

---

## Completion checklist

- [x] All four phase files completed.
- [x] Forward-only migration workflow replaces legacy naming in scripts/CI/docs.
- [x] metaboost-ops migration jobs exist and are safe to rerun.
- [x] No external GitOps repository edits were required by this plan set.
