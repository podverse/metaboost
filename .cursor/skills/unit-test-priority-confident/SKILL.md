---
name: unit-test-priority-confident
description: Prioritize unit-test investments for confident (not bulletproof) coverage. Use when planning or implementing tests in Metaboost.
version: 1.0.0
---

# Unit Test Priority - Confident Coverage

Podverse-aligned skill. Metaboost also documents risk ordering in **unit-tests-risk-first** — use both;
this skill adds domain-specific priority targets.

## Goal

Direct test effort to the highest-risk behavior first so coverage gains are meaningful and maintainable.

## Priority Order

1. Auth/security logic (`apps/api/src/lib`, `apps/management-api/src/lib`, JWT/session helpers)
2. ORM business rules (`packages/orm`, `packages/management-orm` — membership, billing, bucket policy)
3. Signing and registry helpers (`metaboost-signing`, standard-endpoint registry wiring)
4. Currency/RSS helpers (`@metaboost/helpers-currency`, `@metaboost/rss-parser`)
5. High-impact web utilities/hooks (`apps/web/src`, `apps/management-web/src` — non-trivial business hooks)

## Selection Rules

- Prefer pure/near-pure modules first.
- Prioritize modules with branchy business behavior over simple pass-through code.
- Cover invariants and boundary behavior before broad expansion.
- Add tests near changed code when touching critical logic.

## Confidence Target

"Confident" means:

- Happy path covered
- Key failure path covered
- Risky edge/boundary cases covered

It does not require full branch-permutation exhaustion. See **unit-tests-confident-granularity** and
**unit-test-design-no-overgranularity** for depth limits.
