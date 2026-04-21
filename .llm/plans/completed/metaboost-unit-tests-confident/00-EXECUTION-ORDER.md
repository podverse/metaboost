# Execution Order

1. **Phase 1 - Testing Standard and Target Matrix** (`01-testing-standard-and-target-matrix.md`)
   - Must land first. This defines "confident" scope and prevents over-testing.
2. **Phase 2 - API Security/Auth Unit Coverage** (`02-api-security-auth-units.md`)
   - Depends on Phase 1 target matrix and case template.
3. **Phase 3 - Bucket Authz and Permissions Unit Coverage** (`03-bucket-authz-and-permissions-units.md`)
   - Depends on Phase 1 and can start after Phase 2 core helper conventions are established.
4. **Phase 4 - Shared Helpers Unit Expansion** (`04-shared-helpers-unit-expansion.md`)
   - Depends on Phases 1-3 priorities to avoid duplicated or low-value tests.
5. **Phase 5 - Selective Frontend Logic Unit Coverage** (`05-selective-frontend-logic-units.md`)
   - Depends on Phase 3 authz decisions to preserve policy parity.
6. **Phase 6 - Skills and Governance Updates** (`06-skills-and-governance-updates.md`)
   - Depends on completed implementation details from Phases 1-5.

## Parallelization Rules

- Run phases sequentially.
- Within Phase 4, helper package unit suites can be authored in parallel if they touch distinct packages.
- Within Phase 5, utility-level tests and targeted component tests may be authored in parallel if they use independent files.
