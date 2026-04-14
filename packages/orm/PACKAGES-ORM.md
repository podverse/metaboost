# @metaboost/orm

TypeORM package for Metaboost: DataSource (read-write), User entity, UserService.

- **Schema** is canonical under `infra/k8s/base/db/postgres-init/`.
  Use `0003_app_schema.sql` for main-app schema and `0005_management_schema.sql.frag` for management schema.
- **Connection** uses read-write credentials (`DB_APP_READ_WRITE_USER`,
  `DB_APP_READ_WRITE_PASSWORD`). Apps must validate `DB_HOST`, `DB_PORT`, `DB_APP_NAME`,
  `DB_APP_READ_*`, and `DB_APP_READ_WRITE_*` at startup.

Build: `npm run build` (from repo root, build packages first).
