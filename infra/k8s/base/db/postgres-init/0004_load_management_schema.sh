#!/bin/bash
# Loads combined management migrations into DB_MANAGEMENT_NAME.
# Raw *.sql in docker-entrypoint-initdb.d is executed against POSTGRES_DB only (official image);
# this wrapper targets the management database. Companion file: 0005_management_schema.sql.frag
set -e

: "${DB_MANAGEMENT_NAME:?Missing DB_MANAGEMENT_NAME}"

MANAGEMENT_DB_NAME="${DB_MANAGEMENT_NAME}"
PG_SUPERUSER="${DB_USER:-${POSTGRES_USER:-user}}"
HERE="$(cd "$(dirname "$0")" && pwd)"

psql -v ON_ERROR_STOP=1 --username "$PG_SUPERUSER" -d "$MANAGEMENT_DB_NAME" -f "${HERE}/0005_management_schema.sql.frag"
