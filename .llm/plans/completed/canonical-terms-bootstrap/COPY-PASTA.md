# COPY-PASTA — canonical terms bootstrap

Use when you want the agent to implement the plan set.

---

## Single prompt (full set)

Implement the Metaboost plan **canonical-terms-bootstrap** end-to-end:

1. Read and follow every step in [.llm/plans/active/canonical-terms-bootstrap/01-infra-canonical-bootstrap.md](./01-infra-canonical-bootstrap.md).
2. Obey [00-EXECUTION-ORDER.md](./00-EXECUTION-ORDER.md) (single sequential phase).
3. Do not edit [00-SUMMARY.md](./00-SUMMARY.md) unless correcting typos the user requests.

Deliverables: canonical `0007_default_terms_version.sql`, K8s ConfigMap wiring, Docker Compose updates, rename `0007_seed_local_user` → `0008_seed_local_user`, remove obsolete `0008_seed_local_terms_version.sql`, docs and verification updates.

---

When done, move this plan directory from `.llm/plans/active/canonical-terms-bootstrap/` to `.llm/plans/completed/` per repo convention.
