---
name: nested-resource-prefix-naming
description: Use parent-prefix naming for nested resources so the schema and API make hierarchy explicit (e.g. bucket_messages_crud). Use when adding or naming DB columns, tables, permission fields, API/ORM types, or request/response fields for resources that are children of another resource.
---


# Nested resource prefix naming

## Rule

When a resource is **nested under** another (e.g. messages under buckets), **prefix names with the parent** so it's clear in the schema and API that the child belongs to the parent. Do not use a bare child name that could be mistaken for a top-level resource.

## Where this applies

- **DB columns / tables**: e.g. `bucket_messages_crud`; table/column names that represent a child resource should include the parent (e.g. `bucket_message`, `bucket_messages_crud`).
- **Permission / CRUD bitmasks**: e.g. `bucketMessagesCrud` (camelCase in TS/API), `bucket_messages_crud` (snake_case in DB).
- **API request/response fields and types**: same prefix in DTOs, schemas, and OpenAPI.
- **ORM entities and services**: property and type names should reflect the hierarchy (e.g. `bucketMessagesCrud` on `AdminPermissions`).

## Examples

| Context        | Prefer                 | Avoid                                               |
| -------------- | ---------------------- | --------------------------------------------------- |
| Permission col | `bucket_messages_crud` | unprefixed child CRUD field                         |
| TS/API field   | `bucketMessagesCrud`   | unprefixed child CRUD field                         |
| Label in UI    | "Bucket Messages CRUD" | "Messages CRUD" (when listing permissions globally) |

On **pages that are already under the parent** (e.g. bucket messages list/edit), the breadcrumb provides context so a short label like "Messages" is fine; the **schema and permission names** should still use the prefix everywhere.

## Why

Bare unprefixed names suggest a top-level "messages" resource. Prefixing with `bucket_` makes it obvious that these are bucket-scoped messages and keeps the schema self-documenting and consistent as more nested resources are added.
