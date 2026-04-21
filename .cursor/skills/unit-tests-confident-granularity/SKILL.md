---
name: unit-tests-confident-granularity
description: Enforces Metaboost unit-test scope at a confident-not-bulletproof level. Use when writing unit tests to avoid both under-testing and excessive combinatorial test complexity.
version: 1.0.0
---

# Unit Tests - Confident Granularity

## Goal

Deliver strong confidence without turning test suites into unmaintainable exhaustive matrices.

## Confident Coverage Rule

For each critical module under test, include:

1. Happy path behavior.
2. Guard/rejection behavior for invalid input or state.
3. Boundary behavior (limits, edge values, time windows).
4. Safe-failure behavior (no privileged fallback).

## Stop Conditions (Avoid Over-Testing)

Do not keep adding unit tests once all are true:

- Every meaningful branch has at least one direct assertion.
- At least one representative negative case exists for each guard.
- Additional cases only duplicate already-proven behavior.

## What To Avoid

- Exhaustive Cartesian permutations that do not add new behavior confidence.
- Snapshot-heavy tests for business logic.
- Tests that lock internal implementation details instead of module contract.

## Permutation Sampling Guidance

When a matrix is large, use representative rows:

- One allow example per permission source (owner, admin, etc.).
- One deny example per missing permission path.
- One edge case for malformed/missing data.

Add more rows only when they validate a different branch.
