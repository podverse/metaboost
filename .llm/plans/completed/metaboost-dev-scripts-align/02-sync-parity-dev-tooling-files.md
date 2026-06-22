# 02 — Sync parity dev tooling files

## Scope

Both repos have `scripts/development/normalize-markdown-links.mjs` and
`eslint-rules/require-relative-js-extension.mjs`. MetaBoost copies are untracked/new in the
working tree; content is nearly identical to Podverse (trivial diff only).

## Steps

1. Commit `scripts/development/normalize-markdown-links.mjs` — align trivial diff with Podverse
   (`_filePath` unused param, verify message punctuation).
2. Commit `eslint-rules/require-relative-js-extension.mjs` if not already tracked.
3. Ensure Plan 08 wires the rule in `eslint.config.mjs` (not this plan's scope if already done).
4. Add npm script or doc pointer if Podverse documents link normalizer usage (grep Podverse docs).

## Verification

```bash
node scripts/development/normalize-markdown-links.mjs --verify
diff -q scripts/development/normalize-markdown-links.mjs /path/to/podverse/scripts/development/normalize-markdown-links.mjs || true
```
