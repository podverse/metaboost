# GitOps K8s env render (alpha / beta / prod) — see docs/development/K8S-ENV-RENDER.md
# Included from makefiles/local/Makefile.local.mk. Targets write source/boilerplate-*-config.env + plain Secrets into the output repo.
#
#   alpha_env_prepare       Ensure ~/.config/boilerplate/alpha-env-overrides/ exists (optional overrides; defaults in infra/env/classification)
#   alpha_env_link          Symlink dev/env-overrides/alpha/*.env → home for each override file that exists there
#   alpha_env_clean         Remove dev/env-overrides/alpha/*.env (repo symlinks); home overrides unchanged; run link before render if using home
#   alpha_env_prepare_link  prepare + link (same idea as local_env_prepare + local_env_link)
#   alpha_env_render        Write source/boilerplate-*-config.env + plain Secrets (requires BOILERPLATE_K8S_OUTPUT_REPO)
#   alpha_env_render_dry_run  Print rendered dotenv + YAML without writing files (no output repo required)
#   alpha_env_validate      validate-classification.sh + validate-k8s-env-drift.sh + validate-gitops-kustomize-build.sh (requires BOILERPLATE_K8S_OUTPUT_REPO)
#   k8s_remote_ports_render / k8s_remote_ports_validate — port + ingress patches only (see K8S-ENV-RENDER.md)
#
# Generic: set K8S_ENV=beta|prod for k8s_env_* targets (also k8s_env_clean).
# Required for render/validate: export BOILERPLATE_K8S_OUTPUT_REPO=/path/to/gitops-repo
#
.PHONY: alpha_env_prepare alpha_env_link alpha_env_clean alpha_env_prepare_link
.PHONY: alpha_env_render alpha_env_render_dry_run alpha_env_validate alpha_env_kustomize_check
.PHONY: k8s_env_prepare k8s_env_link k8s_env_clean k8s_env_prepare_link
.PHONY: k8s_env_render k8s_env_render_dry_run k8s_env_validate k8s_env_kustomize_check
.PHONY: k8s_remote_ports_render k8s_remote_ports_validate
.PHONY: alpha_remote_ports_render alpha_remote_ports_validate

# Default environment for convenience targets
K8S_ENV ?= alpha

alpha_env_prepare:
	bash scripts/k8s-env/prepare-k8s-env-overrides.sh --env alpha

alpha_env_link:
	bash scripts/k8s-env/link-k8s-env-overrides.sh --env alpha

alpha_env_clean:
	@echo "Removing dev/env-overrides/alpha/*.env (repo symlinks to home overrides)..."
	@rm -f $(ROOT)dev/env-overrides/alpha/*.env
	@echo "Repo override links removed. If you use home overrides, run make alpha_env_link before alpha_env_render. ~/.config/boilerplate/alpha-env-overrides/ is unchanged."

alpha_env_prepare_link: alpha_env_prepare alpha_env_link

alpha_env_render:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required for alpha_env_render — set to the GitOps repo root))
	bash scripts/k8s-env/render-k8s-env.sh --env alpha --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"

alpha_env_render_dry_run:
	bash scripts/k8s-env/render-k8s-env.sh --env alpha --dry-run $(if $(BOILERPLATE_K8S_OUTPUT_REPO),--output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)",)

alpha_env_kustomize_check:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required — set to the GitOps repo root))
	bash scripts/k8s-env/validate-gitops-kustomize-build.sh --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)" --env alpha

alpha_env_validate:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required for alpha_env_validate — set to the GitOps repo root))
	bash scripts/k8s-env/validate-classification.sh
	bash scripts/k8s-env/validate-k8s-env-drift.sh --env alpha --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"
	$(MAKE) alpha_env_kustomize_check BOILERPLATE_K8S_OUTPUT_REPO="$(BOILERPLATE_K8S_OUTPUT_REPO)"

# Generic targets (set K8S_ENV=beta or K8S_ENV=prod)
k8s_env_prepare:
	bash scripts/k8s-env/prepare-k8s-env-overrides.sh --env $(K8S_ENV)

k8s_env_link:
	bash scripts/k8s-env/link-k8s-env-overrides.sh --env $(K8S_ENV)

k8s_env_clean:
	@echo "Removing dev/env-overrides/$(K8S_ENV)/*.env (repo symlinks to home overrides)..."
	@rm -f $(ROOT)dev/env-overrides/$(K8S_ENV)/*.env
	@echo "Repo override links removed. If you use home overrides, run make k8s_env_link K8S_ENV=$(K8S_ENV) before k8s_env_render. ~/.config/boilerplate/$(K8S_ENV)-env-overrides/ is unchanged."

k8s_env_prepare_link: k8s_env_prepare k8s_env_link

k8s_env_render:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required for k8s_env_render — set to the GitOps repo root))
	bash scripts/k8s-env/render-k8s-env.sh --env $(K8S_ENV) --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"

k8s_env_render_dry_run:
	bash scripts/k8s-env/render-k8s-env.sh --env $(K8S_ENV) --dry-run $(if $(BOILERPLATE_K8S_OUTPUT_REPO),--output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)",)

k8s_env_kustomize_check:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required))
	bash scripts/k8s-env/validate-gitops-kustomize-build.sh --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)" --env $(K8S_ENV)

k8s_env_validate:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required for k8s_env_validate — set to the GitOps repo root))
	bash scripts/k8s-env/validate-classification.sh
	bash scripts/k8s-env/validate-k8s-env-drift.sh --env $(K8S_ENV) --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"
	$(MAKE) k8s_env_kustomize_check BOILERPLATE_K8S_OUTPUT_REPO="$(BOILERPLATE_K8S_OUTPUT_REPO)" K8S_ENV=$(K8S_ENV)

# Port + ingress patches only (same BOILERPLATE_K8S_OUTPUT_REPO as env render).
k8s_remote_ports_render:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required))
	ruby scripts/k8s-env/render_remote_k8s_ports.rb --env $(K8S_ENV) --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"

k8s_remote_ports_validate:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required))
	bash scripts/k8s-env/validate-remote-k8s-ports-drift.sh --env $(K8S_ENV) --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"

alpha_remote_ports_render:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required))
	ruby scripts/k8s-env/render_remote_k8s_ports.rb --env alpha --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"

alpha_remote_ports_validate:
	$(if $(BOILERPLATE_K8S_OUTPUT_REPO),,$(error BOILERPLATE_K8S_OUTPUT_REPO is required))
	bash scripts/k8s-env/validate-remote-k8s-ports-drift.sh --env alpha --output-repo "$(BOILERPLATE_K8S_OUTPUT_REPO)"
