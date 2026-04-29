#!/bin/bash
# Creates management database and read / read-write roles. Schema loads via
# 0004_load_management_schema.sh + 0005_management_schema.sql.frag (entrypoint order); grants run in 0006_management_grants.sh after tables exist.
set -e

: "${DB_MANAGEMENT_READ_USER:?Missing DB_MANAGEMENT_READ_USER}"
: "${DB_MANAGEMENT_READ_WRITE_USER:?Missing DB_MANAGEMENT_READ_WRITE_USER}"
: "${DB_MANAGEMENT_READ_PASSWORD:?Missing DB_MANAGEMENT_READ_PASSWORD}"
: "${DB_MANAGEMENT_READ_WRITE_PASSWORD:?Missing DB_MANAGEMENT_READ_WRITE_PASSWORD}"
: "${DB_MANAGEMENT_ADMIN_USER:?Missing DB_MANAGEMENT_ADMIN_USER}"
: "${DB_MANAGEMENT_ADMIN_PASSWORD:?Missing DB_MANAGEMENT_ADMIN_PASSWORD}"

MANAGEMENT_DB_NAME="${DB_MANAGEMENT_NAME:-metaboost_management}"
PG_SUPERUSER="${DB_APP_ADMIN_USER:-metaboost_app_admin}"

echo "Initializing management database: ${MANAGEMENT_DB_NAME}"

psql -v ON_ERROR_STOP=1 --username "$PG_SUPERUSER" -d postgres <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_MANAGEMENT_ADMIN_USER}') THEN
        EXECUTE format('CREATE USER %I WITH CREATEDB CREATEROLE', '${DB_MANAGEMENT_ADMIN_USER}');
    END IF;
END
\$\$;

DO \$\$
BEGIN
    EXECUTE format('ALTER USER %I WITH PASSWORD %L', '${DB_MANAGEMENT_ADMIN_USER}', '${DB_MANAGEMENT_ADMIN_PASSWORD}');
END
\$\$;

SELECT 'CREATE DATABASE ${MANAGEMENT_DB_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${MANAGEMENT_DB_NAME}')\gexec
ALTER DATABASE ${MANAGEMENT_DB_NAME} OWNER TO ${DB_MANAGEMENT_ADMIN_USER};
SQL

# Create management DB roles (per-DB users, not shared with app).
psql -v ON_ERROR_STOP=1 --username "$PG_SUPERUSER" -d postgres <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_MANAGEMENT_READ_USER}') THEN
        EXECUTE format('CREATE USER %I WITH PASSWORD %L', '${DB_MANAGEMENT_READ_USER}', '${DB_MANAGEMENT_READ_PASSWORD}');
    END IF;
END
\$\$;

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_MANAGEMENT_READ_WRITE_USER}') THEN
        EXECUTE format('CREATE USER %I WITH PASSWORD %L', '${DB_MANAGEMENT_READ_WRITE_USER}', '${DB_MANAGEMENT_READ_WRITE_PASSWORD}');
    END IF;
END
\$\$;
SQL
