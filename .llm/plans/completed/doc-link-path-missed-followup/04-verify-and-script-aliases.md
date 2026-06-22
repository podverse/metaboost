# 04 — Verify and optional script aliases

## Verify both repos

```bash
# Podverse
cd /path/to/podverse
node scripts/development/normalize-markdown-links.mjs --verify
rg '\]\(\.\./' --glob '*.{md,mdc}' --glob '!.llm/history/**'

# Metaboost
cd /path/to/metaboost
node scripts/development/normalize-markdown-links.mjs --verify
rg '\]\(\.\./' --glob '*.{md,mdc}' --glob '!.llm/history/**'
```

Expected: **0** matches outside `.llm/history/`.

## Optional: extend normalize-markdown-links.mjs

Add alias candidates in both repos:

- `docs/development/ENV-REFERENCE.md` → `docs/development/env/ENV-REFERENCE.md`
- `docs/QUICKSTART.md` → `docs/QUICK-START.md`
- `docs/development/QUICK-START.md` → `docs/QUICK-START.md`
- `docs/development/CURSOR-NIX-WITH-ENV.md` → `docs/CURSOR-NIX-WITH-ENV.md`
- `.github/workflows/publish-alpha.yml` → `.github/workflows/publish-staging.yml` (only when documenting renames in plans)

Re-run after Phases 01–03:

```bash
node scripts/development/normalize-markdown-links.mjs --write
```
