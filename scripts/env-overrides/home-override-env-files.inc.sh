# Shared list of home override .env basenames (keys with non-empty override_file in infra/env/classification/base.yaml).
# info, auth, locale, mailer, user_agent -> user-agent.env, db_management_superuser -> db-management-superuser.env
# When adding a new override_file in base.yaml, add the matching .env basename here and in
# MetaboostEnvMerge::HOME_OVERRIDE_LOGICAL_TO_BASENAME (scripts/env-classification/lib/metaboost_env_merge.rb).
# Sourced by link-local-env-overrides.sh, link-k8s-env-overrides.sh (prepare uses write-home-override-stubs.rb for the list).

METABOOST_HOME_OVERRIDE_ENV_FILES=(
  info.env
  auth.env
  locale.env
  mailer.env
  user-agent.env
  db-management-superuser.env
)
