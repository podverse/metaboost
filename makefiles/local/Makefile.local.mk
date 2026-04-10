# Metaboost Makefile (local targets)
# Included from root Makefile. Run the same checks CI will run. See README or plan 05 for usage.
#
# Main targets:
#   validate, validate_docker  - Pre-push checks and optional Docker image build
#   audit, audit-fix           - Dependency audit (script from plan 06)
#   local_network_create       - Create metaboost_local_network (idempotent)
#   local_postgres_up, local_valkey_up  - Start Postgres and Valkey
#   local_sidecar_up, local_api_up, local_web_up, local_management_api_up, local_management_web_sidecar_up, local_management_web_up  - Start sidecars, API, web, management-api, management-web
#   local_apps_up, local_apps_up_build, local_start_all_apps, local_apps_down  - App containers only; local_apps_up_build rebuilds images; infra unchanged
#   local_prune_metaboost_images - Remove locally built metaboost-* images + build cache (base images kept)
#   local_down                 - Stop all local Docker services (keeps volumes); works if infra/config/local/*.env were removed (creates empty stubs for compose parse)
#   local_down_volumes         - Stop services and remove volumes (clean DB/Valkey data)
#   local_clean               - Run local_down, local_down_volumes, local_k3d_down, and test_clean (full teardown: Docker + k3d + test/E2E; also removes orphan metaboost_local_* containers)
#   local_env_prepare          - Ensure ~/.config/metaboost/local-env-overrides/ exists (optional overrides; defaults in infra/env/classification)
#   local_env_link             - Symlink dev/env-overrides/local/*.env to home for each override file that exists there (share overrides across work trees)
#   local_env_setup            - Generate infra + app env from classification + overrides (see docs/development/LOCAL-ENV-OVERRIDES.md)
#   local_env_clean            - Remove generated env files and dev/env-overrides/local/*.env (symlinks); home overrides unchanged; requires no Docker Compose and no k3d cluster
#   local_setup                - local_env_setup + local_infra_up
#   local_clean_env_setup_infra_up - local_clean, local_env_clean, local_env_prepare, local_env_link, local_env_setup, local_infra_up (full env reset from home overrides)
#   local_k3d_up, local_k3d_down - Local k3d cluster and ArgoCD deployment lifecycle
#   local_k3d_postgres_reset   - Delete Postgres PVC and pod so init re-runs with current secrets (fix auth failure after env/secrets change)
#   local_argocd_port_forward  - Expose ArgoCD UI on https://localhost:8080
#   local_k3d_status           - Show local k3d workload status
#   env_setup                  - Alias for local_env_setup (backward compatible)
#   local_env_remove           - Run local_clean, then remove .env files (prompts for Y); prefer prepare/link/setup flow
#   local_reset_env_infra      - Run local_env_remove, env_setup, then local_infra_up. Use testSuperAdmin=1 for superadmin / Test!1Aa
#   local_nuke_rebuild_run     - Full Docker nuke (Podverse-aligned): clean, env_clean, env_prepare, env_link, prune app images, env_setup, infra+DB+super admin, build+start all app containers (testSuperAdmin=1 for preset admin)
#   local_db_init_management  - Create metaboost_management DB in local Postgres (also run by local_infra_up)
#   local_create_super_admin - Interactive: prompt for super admin username, create user, print password once (run by local_infra_up)
#   local_infra_up            - Start Postgres, Valkey, and management DB, then create super admin (for API + Management API on host)
#   local_all_up              - Start full stack in Docker (API, web, sidecar, Postgres, Valkey)
#   test_deps, test_postgres_up, test_valkey_up, test_db_init, test_db_init_management, test_db_list, help_test, test_clean, validate_ci - Test requirements (ports 5532, 6479); validate_ci runs same steps as CI validate job
#   e2e_deps, e2e_seed, e2e_seed_web, e2e_seed_management_web, e2e_test_api, e2e_test, e2e_test_web, e2e_test_management_web, e2e_teardown - E2E page testing (see docs/testing/E2E-PAGE-TESTING.md)
#   alpha_env_prepare, alpha_env_link, alpha_env_clean, alpha_env_prepare_link, alpha_env_render, alpha_env_render_dry_run, alpha_env_validate - GitOps K8s env (see docs/development/K8S-ENV-RENDER.md; makefiles/gitops/Makefile.gitops-env.mk); METABOOST_K8S_OUTPUT_REPO required for render/validate; k8s_env_* + K8S_ENV for beta/prod (k8s_env_clean removes dev/env-overrides/$(K8S_ENV) symlinks)
#
SHELL := /bin/bash

COMPOSE_LOCAL := infra/docker/local/docker-compose.yml
LOCAL_NETWORK := metaboost_local_network
include makefiles/local/Makefile.local.validate.mk
include makefiles/local/Makefile.local.audit.mk
include makefiles/local/Makefile.local.env.mk
include makefiles/gitops/Makefile.gitops-env.mk
include makefiles/local/Makefile.local.docker.mk
include makefiles/local/Makefile.local.k3d.mk
include makefiles/local/Makefile.local.test.mk
include makefiles/local/Makefile.local.e2e.mk
