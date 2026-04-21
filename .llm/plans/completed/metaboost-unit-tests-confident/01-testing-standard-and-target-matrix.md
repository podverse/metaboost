# Phase 1 - Testing Standard and Target Matrix

## Scope

Define what qualifies as "confident" unit coverage and produce a ranked target matrix for this rollout.

## Confident Coverage Standard

- Validate every branch that can materially change security, authorization, data safety, or public contract behavior.
- Include at least one representative negative case per guard path (invalid input, invalid claims, unauthorized actor, malformed state).
- Include boundary/time-window assertions for auth and token logic where off-by-one errors can regress security.
- Prefer deterministic fixtures and direct function-level assertions.
- Skip broad Cartesian permutations unless a branch cannot be confidently covered with representative rows.

## Anti-Overengineering Guardrails

- Do not add tests for trivial re-exports or direct pass-through wrappers.
- Do not chase line-level 100% coverage when behavioral confidence is already high.
- Do not snapshot large component trees for logic better validated in utility modules.
- Do not duplicate integration-level assertions in unit tests unless the unit test closes a specific risk gap.
- Keep each suite focused on a single module contract and its invariants.

## Steps

1. Define inclusion criteria:
   - Security/authentication logic.
   - Authorization/permission decisions.
   - Data-safety and serialization guarantees.
   - Shared helper transforms used by multiple apps.
2. Define exclusion criteria:
   - Snapshot-heavy component testing with low signal.
   - Overlapping cases already covered reliably by existing integration tests.
   - Low-risk glue code with trivial pass-through behavior.
3. Define required per-module case groups:
   - Happy path.
   - Guard/validation rejection.
   - Edge/boundary condition.
   - Regression-prone historical bug shape (if known).
4. Build a target matrix that ranks modules by risk and expected confidence gain.
5. Publish confidence guardrails for future contributors.

## Required Case Template (Per Module)

Every high-priority module in this plan should include:

1. Happy path case(s) for expected valid behavior.
2. Guard rejection case(s) for invalid/missing/malformed input.
3. Edge boundary case(s) for limits, empty values, or time windows.
4. Safe-failure case(s) confirming no privileged fallback behavior.
5. Regression-shape case(s) when a known bug class exists in module history.

## Target Matrix (Ranked)

| Rank | Module | Risk Area | Confidence Goal |
| --- | --- | --- | --- |
| 1 | `apps/api/src/lib/appAssertion/verifyAppAssertion.ts` | Request-level app auth | Reject invalid assertion and bind claims to request details safely |
| 2 | `apps/api/src/lib/bucket-policy.ts` | Authorization decisions | Representative allow/deny coverage across critical CRUD branches |
| 3 | `apps/api/src/lib/bucket-effective.ts` | Effective bucket resolution | Correct root/descendant behavior and safe invalid-id rejection |
| 4 | `apps/management-api/src/lib/bucket-effective.ts` | Admin-side bucket resolution | Match expected resolution behavior and invalid input guards |
| 5 | `apps/api/src/lib/auth/jwt.ts` | Token issue/verify | Correct claim handling and reject malformed/invalid tokens |
| 6 | `apps/management-api/src/lib/auth/jwt.ts` | Management token issue/verify | Enforce management claim boundaries and validation |
| 7 | `apps/api/src/lib/auth/cookies.ts` | Session cookie security | Correct secure/samesite/domain/path behavior by environment |
| 8 | `packages/helpers/src/credentials/password.ts` | Credential quality rules | Ensure policy thresholds and validation messaging are stable |
| 9 | `packages/helpers/src/crud/crud-bitmask.ts` | Permission flag transforms | Bitmask/flag round-trip correctness and boundary behavior |
| 10 | `apps/web/src/lib/bucket-authz.ts` | Frontend policy gating | Preserve allow/deny parity for user-visible actions |

## Out of Scope for This Rollout

- Broad component unit test matrix for all web and management-web pages.
- Exhaustive all-actor x all-permission x all-resource permutations.
- Unit tests for modules that are pure pass-through wrappers with no decision logic.

## Verification

- All later phases reference this matrix for test selection.
- No phase introduces broad exhaustive permutations without a risk-based reason.
- Each completed phase demonstrates confidence gains in at least one top-10 matrix module.
