---
name: typeorm-orderby-property-names
description: In TypeORM query builder use entity property names (camelCase) for orderBy, not database column names (snake_case). Use when writing or editing createQueryBuilder().orderBy() in packages/orm or apps that use TypeORM.
---

# TypeORM orderBy: use property names

## Rule

When calling `.orderBy()` on a TypeORM `SelectQueryBuilder`, pass the **entity property name** (camelCase), not the database column name (snake_case). TypeORM resolves the string to column metadata by property name; if you pass the DB column name, resolution fails and you get `TypeError: Cannot read properties of undefined (reading 'databaseName')`.

## Do

- `.orderBy('bucket.createdAt', 'DESC')` — property name; TypeORM maps to `created_at` in SQL.
- `.orderBy('user.displayName', 'ASC')` — property name.

## Don't

- `.orderBy('bucket.created_at', 'DESC')` — column name; no matching property, column is undefined.
- `.orderBy('user.display_name', 'ASC')` — same issue.

## When it applies

- Any `createQueryBuilder('alias').orderBy('alias.someField', ...)` in `packages/orm` (or other TypeORM usage in the repo).
- Expressions like `.orderBy('LOWER(alias.name)', 'ASC')` are fine; the problem is only when the second token is meant to be a single column reference that TypeORM looks up on the entity.
