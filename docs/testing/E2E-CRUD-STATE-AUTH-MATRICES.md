# E2E CRUD/State/Auth Matrices

The project targets the **Confident** E2E bar: happy paths and auth boundaries covered; permission matrix on important surfaces; URL-state where it matters; deny tests use real seeded resources. Cells in the matrices are:

- **Covered**: existing deterministic assertion in current specs.
- **Gap**: missing or permissive coverage; treat as backlog—fix when touching that feature.
- **Backlog**: items listed in each matrix's "Backlog" section are not required for Confident; address when working on the relevant surface.

## Matrix files

- [E2E-CRUD-STATE-AUTH-MATRIX-WEB.md](E2E-CRUD-STATE-AUTH-MATRIX-WEB.md) – checklist for `apps/web/e2e`
- [E2E-CRUD-STATE-AUTH-MATRIX-MANAGEMENT-WEB.md](E2E-CRUD-STATE-AUTH-MATRIX-MANAGEMENT-WEB.md) – checklist for `apps/management-web/e2e`

Use these when adding or reviewing E2E specs so coverage stays aligned with the Confident bar.
