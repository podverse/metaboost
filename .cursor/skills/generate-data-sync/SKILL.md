---
name: generate-data-sync
description: Keeps tools/generate-data seeders and docs in sync when main or management DB schema or ORM entities change. Use when adding or changing tables/entities in packages/orm, packages/management-orm, or infra database migrations.
---

# Generate-data sync

When the main or management database schema or ORM entities change, update the generate-data tool so
seeded test data stays aligned.

## When to use

- Adding or changing tables in `infra/database/` or `infra/management-database/` (migrations, combined init).
- Adding or changing entities in `packages/orm` or `packages/management-orm`.

## Steps

1. **Decide what to seed**  
   New or changed core domain tables (e.g. user-related, admin-related) should usually get seed
   logic. Skip internal/auth-only tables (e.g. refresh_token, verification_token) unless tests need
   them.

2. **Update seeders**
   - Main: `tools/generate-data/src/main/seed.ts` – add or update entities in dependency order;
     respect FKs; use `@faker-js/faker` for appropriate fields; use bcrypt for password hashes where
     applicable.
   - Management: `tools/generate-data/src/management/seed.ts` – same; never set `is_super_admin:
true` for seeded rows.

3. **Update docs**  
   Edit `tools/generate-data/TOOLS-GENERATE-DATA.md` so the “What gets seeded” section lists the
   new or changed tables/entities.

4. **Schema naming**  
   Follow **database-schema-naming**: snake_case columns, singular table names; entity `name`
   mapping where property is camelCase.

## References

- Main schema: `infra/k8s/base/stack/postgres-init/0003_app_schema.sql`
- Management schema: `infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag`
- Seeders: `tools/generate-data/src/main/seed.ts`, `tools/generate-data/src/management/seed.ts`
