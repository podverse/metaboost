#!/usr/bin/env bash
# Create management DB roles and/or apply GRANTs for local Docker Postgres.
# Uses env inside the container (infra/config/local/db.env, db-user.env, db-app.env, db-management.env via compose env_file).
# Mirrors canonical infra/k8s/base/db/source/bootstrap/0002_setup_management_database.sh
# (role creation + grants).
set -euo pipefail

container="${1:?container name required}"
subcmd="${2:?subcommand required: create-roles | grants}"

case "$subcmd" in
create-roles)
	docker exec -i "$container" bash -s <<'EOS'
set -euo pipefail
: "${DB_MANAGEMENT_READ_USER:?Missing DB_MANAGEMENT_READ_USER}"
: "${DB_MANAGEMENT_READ_PASSWORD:?Missing DB_MANAGEMENT_READ_PASSWORD}"
: "${DB_MANAGEMENT_READ_WRITE_USER:?Missing DB_MANAGEMENT_READ_WRITE_USER}"
: "${DB_MANAGEMENT_READ_WRITE_PASSWORD:?Missing DB_MANAGEMENT_READ_WRITE_PASSWORD}"
psql -v ON_ERROR_STOP=1 -U "${DB_APP_ADMIN_USER:-metaboost_app_admin}" -d postgres <<SQL
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
EOS

	;;
grants)
	dbname="${3:?database name required for grants}"
	docker exec -i "$container" env "MGMT_DB_GRANT=$dbname" bash -s <<'EOS'
set -euo pipefail
: "${DB_MANAGEMENT_READ_USER:?Missing DB_MANAGEMENT_READ_USER}"
: "${DB_MANAGEMENT_READ_WRITE_USER:?Missing DB_MANAGEMENT_READ_WRITE_USER}"
: "${MGMT_DB_GRANT:?Missing MGMT_DB_GRANT}"
psql -v ON_ERROR_STOP=1 -U "${DB_APP_ADMIN_USER:-metaboost_app_admin}" -d "${MGMT_DB_GRANT}" <<SQL
GRANT CONNECT ON DATABASE ${MGMT_DB_GRANT} TO ${DB_MANAGEMENT_READ_USER}, ${DB_MANAGEMENT_READ_WRITE_USER};
GRANT USAGE ON SCHEMA public TO ${DB_MANAGEMENT_READ_USER}, ${DB_MANAGEMENT_READ_WRITE_USER};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${DB_MANAGEMENT_READ_USER};
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_MANAGEMENT_READ_USER};
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO ${DB_MANAGEMENT_READ_WRITE_USER};
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${DB_MANAGEMENT_READ_WRITE_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${DB_MANAGEMENT_READ_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO ${DB_MANAGEMENT_READ_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO ${DB_MANAGEMENT_READ_WRITE_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO ${DB_MANAGEMENT_READ_WRITE_USER};
SQL
EOS

	;;
*)
	echo "Usage: $0 <container> create-roles | $0 <container> grants <database_name>" >&2
	exit 1
	;;
esac
