---
name: unit-test-new-code-gate
description: Require tests for new or changed critical business logic, with explicit exceptions. Use during implementation planning and code edits.
version: 1.0.0
---

# Unit Test New Code Gate

## Gate

When changing critical business logic, add or update unit tests in the same change.

## Critical Logic Includes

- Auth, identity, token, session, and membership checks
- Management-api permission and invitation flows
- Rate limiting and abuse protection behavior
- ORM decision logic that affects persisted state (billing, bucket, user)
- Standard-endpoint signing and registry validation
- RSS parse policy and currency conversion edge cases

## Acceptable Exceptions

An exception is acceptable only when one of these is true:

1. Change is strictly non-behavioral (comment, rename, formatting)
2. Logic is fully exercised by existing tests and no branch behavior changed
3. Testability requires substantial refactor outside request scope

## Required Exception Note

If skipping tests for changed critical logic, document:

- Why tests were skipped
- What risk remains
- What follow-up test should be added later

## Verification

- Run workspace tests for changed areas first (`npm run test -w <workspace>` or root `npm run test:unit`).
- Run `npm run test:e2e:api` when API integration behavior changed.
- Run targeted E2E make targets when web/management-web behavior changed (see **response-ending-make-verify**).
