# Remove multi-LLM exports — COPY-PASTA prompts (Metaboost)

**Plan set:** `metaboost/.llm/plans/active/remove-multi-llm-exports/`

**Coordination:** Podverse master set at `podverse/.llm/plans/active/remove-multi-llm-exports/`

**Do not implement until ready.** After each step: mark ✅; move completed plans to `.llm/plans/completed/remove-multi-llm-exports/`.

---

## Phase 1 — Pipeline removal

### Step 1.1

```
Read and execute .llm/plans/active/remove-multi-llm-exports/01-remove-scripts-and-ci.md

Verify:
test ! -d scripts/llm
```

### Step 1.2

```
Read and execute .llm/plans/active/remove-multi-llm-exports/02-remove-exports-tree-and-gitignore.md

Verify:
test ! -d .llm/exports
```

---

## Phase 2 — Guidance and docs

### Step 2.1

```
Read and execute .llm/plans/active/remove-multi-llm-exports/03-rewrite-cursor-guidance.md

Verify:
./scripts/nix/with-env npm run lint
```

### Step 2.2

```
Read and execute .llm/plans/active/remove-multi-llm-exports/04-revise-llm-docs.md
```

---

## Phase 3 — Remote cleanup (after merge)

### Step 3.1

```
Read and execute .llm/plans/active/remove-multi-llm-exports/06-remote-and-operator-cleanup.md

Apply to both Podverse and Metaboost GitHub repos.
```

---

## Completion checklist

- [x] 01-remove-scripts-and-ci.md
- [x] 02-remove-exports-tree-and-gitignore.md
- [x] 03-rewrite-cursor-guidance.md
- [x] 04-revise-llm-docs.md
- [x] 06-remote-and-operator-cleanup.md (run after merge — see Podverse completed plan 06)

Move directory to `.llm/plans/completed/remove-multi-llm-exports/` when done.
