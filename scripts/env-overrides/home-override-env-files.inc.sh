# Shared list of home override .env basenames used by local link flow.
# info, auth, locale, mailer, user_agent -> user-agent.env, db_management_superuser -> db-management-superuser.env
# When adding a new override file, add the matching .env basename here and update
# scripts/env-overrides/write-home-override-stubs.rb mappings.
# Sourced by link-local-env-overrides.sh (prepare uses write-home-override-stubs.rb for the list).

METABOOST_HOME_OVERRIDE_ENV_FILES=(
  info.env
  auth.env
  locale.env
  mailer.env
  user-agent.env
  db-management-superuser.env
)
