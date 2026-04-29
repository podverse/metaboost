# npm-audit-postcss-override

**Started:** 2026-04-29  
**Author:** Agent  
**Context:** GHSA-qx2v-qp2m-jg93 — Next 16.2.4 pins `postcss@8.4.31`; patched minimum is 8.5.10.

### Session 1 - 2026-04-29

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/15.txt:13-34 fix the vulnerabilities

#### Key Decisions

- Added root `package.json` override `"postcss": "^8.5.10"` so all consumers (including `next`) resolve patched PostCSS (≥ 8.5.10). Incremental `npm install` did not replace Next’s pinned `8.4.31` in the lockfile; deleting `package-lock.json` and reinstalling applied the override cleanly.
- Regenerated `package-lock.json` with a clean install; `npm audit` and `npm audit --omit=dev` report 0 findings.
- Verified `npm run build` for `@metaboost/web` and `@metaboost/management-web`.
- Note: `npm ls postcss` may report `invalid` / exit non-zero because `next`’s published metadata still lists `8.4.31` while the override installs `8.5.10`; runtime and audit are consistent.

#### Files Created/Modified

- `package.json`
- `package-lock.json`
- `.llm/history/active/npm-audit-postcss-override/npm-audit-postcss-override-part-01.md`
