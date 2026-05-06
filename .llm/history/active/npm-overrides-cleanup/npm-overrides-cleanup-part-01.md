# npm-overrides-cleanup

**Started:** 2026-05-06  
**Author:** Agent  
**Context:** Implement Metaboost package.json overrides assessment plan.

### Session 1 - 2026-05-06

#### Prompt (Developer)

Metaboost `package.json` overrides assessment

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed redundant **`punycode`** override; `uri-js` range `^2.1.0` still resolves to **2.3.1** (confirmed via `npm ls punycode` and lockfile).
- Removed **`glob`** override; lockfile keeps single **glob@11.1.0** (patched for GHSA-5j98-mcp5-4vw2); `npm audit` shows no glob-related findings (only pre-existing **ip-address** / **express-rate-limit** moderates).
- Kept **`postcss`** `^8.5.10` and **`uuid`** `^14.0.0` overrides per plan (Next PostCSS pin + GHSA-w5hq-g745-h8pq).
- **`test:e2e:api`** failed after **`billing_domain_event`** migration because **`TRUNCATE ... RESTART IDENTITY`** requires sequence ownership; migrator-owned sequences blocked **`metaboost_app_read_write`**. Added **`REASSIGN OWNED BY`** migrator → read_write after app linear migrations in **[makefiles/local/Makefile.local.test.mk](/Users/mitcheldowney/repos/pv/metaboost/makefiles/local/Makefile.local.test.mk)** (test DB init only).

#### Files Created/Modified

- [package.json](/Users/mitcheldowney/repos/pv/metaboost/package.json)
- [package-lock.json](/Users/mitcheldowney/repos/pv/metaboost/package-lock.json)
- [makefiles/local/Makefile.local.test.mk](/Users/mitcheldowney/repos/pv/metaboost/makefiles/local/Makefile.local.test.mk)
- [.llm/history/active/npm-overrides-cleanup/npm-overrides-cleanup-part-01.md](/Users/mitcheldowney/repos/pv/metaboost/.llm/history/active/npm-overrides-cleanup/npm-overrides-cleanup-part-01.md)
