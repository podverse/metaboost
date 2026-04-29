### Session 1 - 2026-04-22

#### Prompt (Developer)

Fix Metaboost E2E Port Drift

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added an explicit API dotenv guard (`API_SKIP_DOTENV`) so Playwright-started E2E API processes do not load `apps/api/.env` and drift to dev DB port `5532`.
- Kept E2E DB/Valkey host ports explicit in web Playwright env generation (`5632` / `6579`) and added the skip-dotenv flag there.
- Added regression unit coverage in `apps/web` to assert E2E API env prefix includes `API_SKIP_DOTENV=1`, `DB_PORT=5632`, and `KEYVALDB_PORT=6579`.
- Documented cross-repo Podverse/Metaboost port separation and a targeted troubleshooting section for `ECONNREFUSED ... :5532`.

#### Files Modified

- .llm/history/active/fix-metaboost-e2e-db-port-drift/fix-metaboost-e2e-db-port-drift-part-01.md
- apps/api/src/index.ts
- apps/web/playwright.e2e-server-env.ts
- apps/web/src/test/playwright.e2e-server-env.test.ts
- docs/testing/E2E-PAGE-TESTING.md
