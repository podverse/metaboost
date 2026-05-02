# api-v2-alignment (Metaboost repo)

**Started:** 2026-04-30  
**Author:** LLM session  
**Context:** Cross-repo alignment with Podverse MetaBoost boost behavior; spec docs only.

### Session 1 - 2026-04-30

#### Prompt (Developer)

Boost: MetaBoost + BLIP + Threshold Alignment

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Corrected `minimum_message_amount_minor` documentation to match schema default `0` (removed outdated USD 0.10 default narrative).
- Documented ingest rejection via HTTP `403` and `below_minimum_boost_amount`; noted optional response fields in mbrss-v1 error contract.

#### Files Created/Modified

- `.llm/history/active/api-v2-alignment/api-v2-alignment-part-01.md`
- `docs/MB-V1-SPEC-CONTRACT.md`
- `docs/MBRSS-V1-SPEC-CONTRACT.md`

### Session 2 - 2026-04-30

#### Prompt (Developer)

fix it

#### Key Decisions

- Corrected `requestPathname` unit test expectation: input `v2/messages` must assert `/v2/messages` per `verifyAppAssertion.ts` behavior.

#### Files Created/Modified

- `apps/api/src/lib/appAssertion/verifyAppAssertion.test.ts`
- `.llm/history/active/api-v2-alignment/api-v2-alignment-part-01.md`

### Session 3 - 2026-04-30

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/20.txt:8-2406 debug

#### Key Decisions

- Root cause of `public_boost_display_minimum_minor` missing: stale `metaboost_app_test` and/or `make test_db_init` failing when host has no `psql` because `run-linear-migrations.sh` defaulted `METABOOST_LOCAL_PG_CONTAINER` to `metaboost_local_postgres` instead of the test container `metaboost_test_postgres`.
- `make test_db_init` / `test_db_init_management` now export `METABOOST_LOCAL_PG_CONTAINER=$(TEST_PG_CONTAINER)` so Docker exec migrations target the test Postgres container.
- `scripts/check-test-requirements.mjs` verifies the column exists after TCP checks so `npm run test` fails fast with `make test_deps` instructions.
- `buckets.test.ts` top-level create expectations updated from `10` to `0` to match `BucketService.DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR`.
- Comment in `apps/api/src/test/setup.ts` updated to reference `make test_deps` / linear migrations instead of obsolete `0003_app_schema.sql` path.

#### Files Created/Modified

- `makefiles/local/Makefile.local.test.mk`
- `scripts/check-test-requirements.mjs`
- `apps/api/src/test/setup.ts`
- `apps/api/src/test/buckets.test.ts`
- `.llm/history/active/api-v2-alignment/api-v2-alignment-part-01.md`

### Session 4 - 2026-04-30

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/20.txt:8-2821 debug

#### Key Decisions

- `management-buckets-messages.test.ts` still expected `publicBoostDisplayMinimumMinor === 10` on POST/GET bucket; aligned to `0` like main API tests (`BucketService.DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR`).
- First assertion failure prevented `bucketId` assignment, so later tests hit invalid URLs and returned 500 (cascade, not a controller bug).

#### Files Created/Modified

- `apps/management-api/src/test/management-buckets-messages.test.ts`
- `.llm/history/active/api-v2-alignment/api-v2-alignment-part-01.md`
