---
name: unit-tests-risk-first
description: Prioritizes unit tests by risk and regression impact in Metaboost. Use when adding or expanding unit tests so coverage is focused on auth, authorization, security boundaries, and high-reuse helpers before lower-risk code.
version: 1.0.0
---


# Unit Tests - Risk First

## Use This Skill When

- Creating a new unit-test backlog.
- Expanding coverage in a large area and deciding what to test first.
- Choosing between multiple candidate modules for limited time.

## Priority Order

1. **Auth and identity boundaries**
   - JWT claim handling, assertion verification, session/cookie safety.
2. **Authorization decisions**
   - Permission and role checks, allow/deny branching.
3. **Security-sensitive transforms**
   - Token hashing/expiry logic, request binding checks, serialization guards.
4. **High-reuse helper logic**
   - Shared helper functions used by multiple apps/packages.
5. **UI utility logic**
   - Frontend policy helpers that gate user actions.

## Selection Rule

When choosing the next test target, prefer modules with:

- Higher blast radius (many callers or privileged code path).
- Higher probability of silent failure (wrong allow/deny outcome).
- Higher user/security impact if behavior drifts.

Skip low-risk wrappers until higher-risk targets have coverage.

## Required Output Shape

When proposing or implementing tests, include:

- Why this target is high-priority.
- Which behavior branches are being covered.
- Which lower-priority targets are intentionally deferred.
