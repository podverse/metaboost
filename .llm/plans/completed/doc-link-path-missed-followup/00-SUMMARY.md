# Missed doc links — follow-up (done)

See Podverse `doc-link-path-missed-followup/00-SUMMARY.md` for full context. Metaboost steps 02–03 completed in this repo.

## Verify

```bash
rg '\]\(\.\./' --glob '*.{md,mdc}' --glob '!.llm/history/**'
node scripts/development/normalize-markdown-links.mjs --verify
```
