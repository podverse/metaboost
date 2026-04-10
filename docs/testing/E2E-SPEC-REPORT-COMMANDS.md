# E2E One-Spec Report Commands

Run each E2E spec in isolation with step-screenshot reports. Use these commands one at a time to verify a single spec and open its HTML report to identify changes or fixes.

**Prerequisites:** `make e2e_deps` (and optionally `make e2e_seed_web` / `make e2e_seed_management_web` if you haven’t run the full suite). The `bucket-admin-edit` spec includes affirmative tests (edit page load and update) and requires `make e2e_seed_web` so the seeded bucket admin exists. Nix users: run via `./scripts/nix/with-env make ...` from repo root.

**Reports:** Written under `.artifacts/e2e-reports/<timestamp>/web` or `.../management-web`; the Make target opens the report when the run finishes.

**User context (CRUD permissions) in the report:** Each test section in the HTML report shows a **User context** line (e.g. "User context: unauthenticated" or "User context: super-admin") when the test sets it. Set it at the start of each test via `setE2EUserContext(testInfo, '…')` from `./helpers/userContext` (management-web or web). Use consistent descriptions: management-web `unauthenticated` / `super-admin` / `admin (admins users events:own)` etc.; web `unauthenticated` / `basic-user` / `bucket-owner` / `bucket-admin`. See the **e2e-readability** skill ("User context in reports") for the full pattern. Test titles should name the actor (e.g. super-admin, unauthenticated) where it helps readability.

**API gate:** Commands below use `E2E_API_GATE_MODE=off` so only the chosen spec runs (no API integration tests). Use `E2E_API_GATE_MODE=on` or omit it if you want the API gate to run first.

**Home smoke:** Dedicated home targets (`e2e_test_home`, `e2e_test_home_report`, etc.) were removed; use `SPEC=e2e/home.spec.ts` (or `WEB_SPEC=e2e/home.spec.ts MGMT_SPEC=e2e/home.spec.ts` for both apps) with the report targets above.

---

## Web (apps/web)

One command per spec. Copy and run one at a time.

```bash
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-admin-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-child-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-detail.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-message-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-messages.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-nested-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-role-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-role-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/bucket-settings.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/buckets-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/buckets.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/dashboard.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/forgot-password.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/home.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/invite.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/login.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/profile.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/reset-password.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/send-message.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/settings.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/short-bucket.spec.ts
make E2E_API_GATE_MODE=off e2e_test_web_report_spec SPEC=e2e/signup.spec.ts
```

---

## Management-web (apps/management-web)

One command per spec. Copy and run one at a time.

```bash
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/admin-detail.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/admin-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/admin-role-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/admins-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/admins.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-admin-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-child-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-detail.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-message-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-messages.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-role-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-role-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/bucket-settings.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/buckets-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/buckets.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/dashboard.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/events.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/home.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/login.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/profile.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/settings.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/user-detail.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/user-edit.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/users-new.spec.ts
make E2E_API_GATE_MODE=off e2e_test_management_web_report_spec SPEC=e2e/users.spec.ts
```
