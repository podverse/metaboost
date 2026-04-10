# Management-Web E2E CRUD/State/Auth Matrix

## Purpose

This matrix is the execution checklist for `apps/management-web/e2e` under the **Confident** E2E bar. Cells marked Gap are backlog; fix when touching that feature.

**Last synced with implementation:** 2025-03-10 (delete lifecycle users/admins/buckets, admins self-protection, events empty + URL state).

## Legend

- `Covered`: existing deterministic assertion in current specs.
- `Gap`: missing or permissive coverage that should be implemented.
- `Target`: spec file to extend.

## Matrix

| Surface                                  | Create                          | Read                | Update                                        | Delete                                                                     | Show/Hide + Enable/Disable                                        | Validation + Error/Empty/Loading                      | URL/Auth Edge                                                  | Status | Target                                                                                                |
| ---------------------------------------- | ------------------------------- | ------------------- | --------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Users list (`/users`)                    | Covered (`users-new`)           | Covered (`users`)   | Gap (edit persistence from list)              | Covered (confirm + cancel: users-super-admin-full-crud)                    | Gap (action visibility by CRUD flags)                             | Gap (deterministic empty/error/loading)               | Covered (auth redirect)                                        | Gap    | `apps/management-web/e2e/users-super-admin-full-crud.spec.ts`, `user-edit.spec.ts`                    |
| Admins list (`/admins`)                  | Covered (`admins-new`)          | Covered (`admins`)  | Gap (edit persistence)                        | Covered (confirm + cancel + self-protection: admins-super-admin-full-crud) | Covered (super-admin row no-delete: admins-super-admin-full-crud) | Gap (error branch checks)                             | Covered (auth redirect)                                        | Gap    | `apps/management-web/e2e/admins-super-admin-full-crud.spec.ts`                                        |
| Buckets list (`/buckets`)                | Covered (`buckets-new`)         | Covered (`buckets`) | Covered (`bucket-edit`)                       | Covered (confirm + cancel: buckets-super-admin-full-crud)                  | Gap (CRUD-flag action visibility)                                 | Gap (empty/error/loading deterministic checks)        | Covered (auth redirect)                                        | Gap    | `apps/management-web/e2e/buckets-super-admin-full-crud.spec.ts`, `bucket-edit.spec.ts`                |
| Bucket settings (`/bucket/:id/settings`) | Covered (route + form controls) | Covered             | Gap (save persistence assertions across tabs) | Gap (admin/role/message delete paths)                                      | Gap (permission-driven hide/disable assertions)                   | Gap (API failure branch checks)                       | Covered (`tab`)                                                | Gap    | `apps/management-web/e2e/bucket-settings.spec.ts`, `apps/management-web/e2e/bucket-role-edit.spec.ts` |
| Events list (`/events`)                  | N/A                             | Covered             | N/A                                           | N/A                                                                        | Gap (table control state assertions)                              | Covered (empty state: events-list-url-state-contract) | Covered (query params + empty: events-list-url-state-contract) | Gap    | `apps/management-web/e2e/events-list-url-state-contract.spec.ts`                                      |
| Auth screens (`/login`)                  | N/A                             | Covered             | Covered (invalid creds)                       | N/A                                                                        | Gap (limited-role authZ route denial checks)                      | Gap (429/rate-limit branches)                         | Covered (unauth redirects)                                     | Gap    | `apps/management-web/e2e/login.spec.ts` + resource specs                                              |

## Backlog (fix when touching that feature)

Items below are not required for the Confident bar; address when working on the relevant surface.

1. Strengthen edit specs to verify persistence after save + reload (users, admins, buckets).
2. Expand users/admins URL-state and deterministic table-state assertions where not yet covered.
3. Add at least one authZ-oriented management assertion path where UI permissions are surfaced.
4. Events table control state assertions and error/loading branches (if applicable).
