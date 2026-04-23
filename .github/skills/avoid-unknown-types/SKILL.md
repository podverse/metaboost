---
name: avoid-unknown-types
description: Do not use `unknown` for API response fields or known data shapes. Use precise types so the type system enforces correctness. Use when typing API responses, context state, or DTOs.
version: 1.0.0
---

# Avoid `unknown` for Known Shapes

Using `unknown` for a field that has a known structure (e.g. `permissions`, API response bodies) is a code smell: it opts out of type checking and forces call sites to assert or narrow without a single source of truth.

## Do

- **Define a precise type** that matches the API contract or domain shape (e.g. `ManagementUserPermissions`, `ManagementUser`). Put it in a shared types file (e.g. `src/types/management-api.ts`) or a package (e.g. `@podverse/helpers` DTOs).
- **Use that type** in context state, component props, and API response handling. Re-export or alias if needed (e.g. `export type AuthUser = ManagementUser`).
- **Keep types in sync** with the API (OpenAPI schema, backend entities, or API docs). When the API gains a new field, add it to the type.

## Don't

- **Don't type known shapes as `unknown`** (e.g. `permissions?: unknown`, `metadata?: unknown`) when you know the structure. If the backend returns `{ adminsCrud, usersCrud, ... }`, type it as an object with those properties.
- **Don't leave placeholder `unknown`** “for later.” Define the minimal shape now and extend it when the API evolves.

## When `unknown` is acceptable

- **Truly opaque data** (e.g. a pass-through payload you never inspect).
- **Type guards**: the guard narrows `unknown` to a concrete type in one place; call sites then use the narrowed type.
- **Generic or external input** that must be validated at runtime before use.

## Example

- **Bad:** `type Admin = { id: string; email: string; permissions?: unknown };`
- **Good:** Define `ManagementUserPermissions` with `adminsCrud`, `usersCrud`, `canChangePasswords`, `canAssignPermissions`, `eventVisibility`, then `type ManagementUser = { id: string; email: string; permissions?: ManagementUserPermissions | null };` and use `ManagementUser` (or `AuthUser = ManagementUser`) everywhere.
