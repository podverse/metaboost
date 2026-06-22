---
name: e2e-seed-nano-id-limits
description: E2E seed and fixture id_text values must fit nano_id_v2 (9–15 chars). Use when adding or renaming IDs in seed scripts, E2E helpers, or fixtures that insert into id_text columns.
---

# E2E seed `id_text` limits (`nano_id_v2`)

When adding deterministic E2E fixtures (`tools/**/seed-e2e.mjs`, E2E specs, or helpers), every
**`id_text`** must satisfy the Postgres **`nano_id_v2`** domain.

## Limits

| Source     | Rule                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| DB domain  | `VARCHAR(15)` with `char_length` **9–15** (`0001_app_schema.sql`)                     |
| TypeScript | `NANO_ID_V2_MIN_LENGTH` / `NANO_ID_V2_MAX_LENGTH` in `@metaboost/helpers` `nanoid.ts` |

**Do not** assume descriptive strings are valid just because they look like other E2E IDs.
Count characters before committing — a name one character too long fails at seed time with
`value too long for type character varying(15)`.

## Tables that use `nano_id_v2` for public IDs

Common E2E fixture targets:

- `user.id_text`
- `bucket.id_text`
- Management identities with public `id_text` where seeded

## Naming pattern for E2E fixtures

Follow existing short prefixes in `tools/web/seed-e2e.mjs`:

- Good: `e2eusr000001` (12), `e2ebkt000001` (12), `e2ebkt000003` (12)
- Bad: `e2eBucketOwner01` (16), `e2e-user-admin-01` (invalid length / characters)

Prefer fixed-width numeric suffixes (`000001`, `000002`) so series stay ≤ 15.

## Sync checklist

When introducing or renaming a fixture `id_text`, update **all** references together:

1. `tools/web/seed-e2e.mjs` and `tools/management-web/seed-e2e.mjs`
2. E2E specs and helpers that hardcode the same `id_text` or route segments
3. Any demo URLs or docs that list example IDs

Prefer a single shared constant in the seed script; grep for stale literals after renames.

## Verification

After changing seed IDs, run:

```bash
make e2e_seed_web
```

Seed failure on insert is almost always an `id_text` length or sync mismatch — fix length first,
then grep for stale string literals.
