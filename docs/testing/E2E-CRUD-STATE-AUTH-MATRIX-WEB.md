# Web E2E CRUD/State/Auth Matrix

## Purpose

This matrix is the execution checklist for `apps/web/e2e` under the **Confident** E2E bar. Cells marked Gap are backlog; fix when touching that feature.

**Last synced with implementation:** 2025-03-10 (role delete cancel/success, owner protection, buckets list empty + URL state, settings tab).

## Legend

- `Covered`: existing deterministic assertion in current specs.
- `Gap`: missing or permissive coverage that should be implemented.
- `Target`: spec file to extend.

## Matrix

| Surface                                    | Create                               | Read                             | Update                                           | Delete                                                      | Show/Hide + Enable/Disable                                 | Validation + Error/Empty/Loading            | URL/Auth Edge                                                   | Status | Target                                                                                                                                     |
| ------------------------------------------ | ------------------------------------ | -------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Buckets list (`/buckets`)                  | Covered (`buckets-new`)              | Covered (`buckets`)              | Gap (sort/filter/pagination interactions)        | Gap (delete lifecycle)                                      | Gap (action visibility by CRUD flags)                      | Covered (empty state: buckets-bucket-owner) | Covered (buckets-list-url-state-contract, buckets-bucket-owner) | Gap    | `apps/web/e2e/buckets-bucket-owner.spec.ts`, `buckets-list-url-state-contract.spec.ts`                                                     |
| Bucket detail (`/bucket/:id`)              | Covered (child/nested creates)       | Covered (`bucket-detail`)        | Covered (`bucket-settings`)                      | Deferred (no delete message UI)                             | Gap (action gating by permissions)                         | Gap (explicit loading/error branch checks)  | Covered (auth redirect)                                         | Gap    | `apps/web/e2e/bucket-detail-*.spec.ts`                                                                                                     |
| Bucket roles tab                           | Covered (`bucket-role-new`)          | Covered (`bucket-role-new/edit`) | Covered (`bucket-role-edit`)                     | Covered (cancel + success: bucket-role-edit-bucket-owner)   | Gap (dependent checkbox matrix assertions)                 | Gap (delete failure/error message)          | Covered (auth redirect + invalid id)                            | Gap    | `apps/web/e2e/bucket-role-edit-bucket-owner.spec.ts`, `bucket-role-new-bucket-owner.spec.ts`                                               |
| Bucket admins tab                          | Covered (invitation link generation) | Covered (`bucket-settings`)      | Covered (`bucket-admin-edit` route-level)        | Covered (owner row no-delete: bucket-settings-bucket-owner) | Gap (admin action visibility by ownership/permission)      | Gap (error branch from delete handlers)     | Covered (auth redirect)                                         | Gap    | `apps/web/e2e/bucket-settings-bucket-owner.spec.ts`, `bucket-admin-edit-*.spec.ts`                                                         |
| Invite flow (`/invite/:token`)             | Covered (invalid + login-required)   | Covered                          | Covered (accept/reject state visibility)         | N/A                                                         | Gap (branches for owner/admin already accepted)            | Gap (expired token deterministic check)     | Gap (post-action navigation states)                             | Gap    | `apps/web/e2e/invite.spec.ts`                                                                                                              |
| Settings (`/settings`)                     | N/A                                  | Covered                          | Covered (password mismatch + email tab controls) | N/A                                                         | Covered (tab=password, tab=profile: settings-bucket-owner) | Gap (request failure branches)              | Covered (`tab`, login returnUrl)                                | Gap    | `apps/web/e2e/settings-bucket-owner.spec.ts`                                                                                               |
| Auth screens (`login/signup/forgot/reset`) | Covered                              | Covered                          | Covered (login returnUrl, forgot flows)          | N/A                                                         | Covered (signup disabled state baseline)                   | Gap (429/rate-limit where feasible)         | Covered (safe/unsafe returnUrl)                                 | Gap    | `apps/web/e2e/login.spec.ts`, `apps/web/e2e/signup.spec.ts`, `apps/web/e2e/forgot-password.spec.ts`, `apps/web/e2e/reset-password.spec.ts` |

## Backlog (fix when touching that feature)

Items below are not required for the Confident bar; address when working on the relevant surface.

1. Bucket role dependency-grid assertions and delete failure/error message (if applicable).
2. Admin action visibility by ownership/permission (row-level assertions beyond owner no-delete).
3. Invite deterministic action/result branches (expired token deferred).
4. Request failure branches for settings and other forms (deferred until test infra).
