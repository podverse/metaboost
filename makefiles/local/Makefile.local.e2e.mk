# --- E2E page testing (web and management-web). API gate is configurable via E2E_API_GATE_MODE. ---
# See docs/testing/E2E-PAGE-TESTING.md
#
# Default: no API tests. E2E report/verification commands skip API integration tests unless
# E2E_API_GATE_MODE is set. Pass E2E_API_GATE_MODE=on to run API tests before E2E;
# E2E_API_GATE_MODE=auto to run API tests only when changed files look API-impacting.

.PHONY: e2e_deps e2e_seed e2e_seed_web e2e_seed_management_web e2e_mailpit_up e2e_mailpit_down e2e_mailpit_clean e2e_test_api e2e_test e2e_test_web e2e_test_web_signup_enabled e2e_test_web_admin_only_email e2e_test_web_admin_only_email_report_spec e2e_test_management_web e2e_test_web_report_spec e2e_test_management_web_report_spec e2e_test_report_scoped e2e_test_report e2e_teardown

# Default off: skip API integration tests. Set E2E_API_GATE_MODE=on to run them; =auto for conditional.
E2E_API_GATE_MODE ?= off
E2E_API_GATE_REQUIRED_PATHS_REGEX := ^(apps/api/|apps/management-api/|infra/database/|infra/management-database/|packages/helpers/|packages/helpers-requests/|packages/helpers-validation/|packages/orm/|packages/management-orm/|tools/web/seed-e2e\.mjs|tools/management-web/seed-e2e\.mjs|scripts/e2e-html-steps-reporter\.ts|apps/web/playwright\.config\.ts|apps/web/playwright\.signup-enabled\.config\.ts|apps/web/playwright\.admin-only-email\.config\.ts|apps/management-web/playwright\.config\.ts|makefiles/local/Makefile\.local\.e2e\.mk|makefiles/local/e2e-spec-order-web-admin-only-email\.txt)
SIGNUP_ENABLED_WEB_SPECS := e2e/login-unauthenticated-signup-enabled.spec.ts,e2e/signup-unauthenticated-signup-enabled.spec.ts,e2e/forgot-password-unauthenticated-signup-enabled.spec.ts,e2e/reset-password-unauthenticated-signup-enabled.spec.ts,e2e/set-password-unauthenticated-signup-enabled.spec.ts
SIGNUP_ENABLED_WEB_SPEC_ARGS := $(shell printf "%s" "$(SIGNUP_ENABLED_WEB_SPECS)" | tr ',' ' ')
SIGNUP_ENABLED_WEB_SPEC_ORDER_SEMICOLON := $(shell printf "%s" "$(SIGNUP_ENABLED_WEB_SPECS)" | tr ',' ';')
ADMIN_ONLY_EMAIL_WEB_SPEC_ORDERED := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-web-admin-only-email.txt | tr '\n' ' ')
ADMIN_ONLY_EMAIL_WEB_SPEC_ORDER_SEMICOLON := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-web-admin-only-email.txt | tr '\n' ';')
ADMIN_ONLY_EMAIL_WEB_SPECS := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-web-admin-only-email.txt | tr '\n' ',' | sed 's/,$$//')
# Conceptual order for full report (make e2e_test_report). Do not sort; order is from these files.
WEB_SPEC_ORDERED := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-web.txt | tr '\n' ' ')
MGMT_SPEC_ORDERED := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-management-web.txt | tr '\n' ' ')
# Semicolon-separated for E2E_SPEC_ORDER so the HTML reporter can reorder runs for display.
WEB_SPEC_ORDER_SEMICOLON := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-web.txt | tr '\n' ';')
MGMT_SPEC_ORDER_SEMICOLON := $(shell sed '/^\#/d;/^$$/d' makefiles/local/e2e-spec-order-management-web.txt | tr '\n' ';')

define e2e_run_api_gate
MODE="$(E2E_API_GATE_MODE)"; \
if [ "$$MODE" = "on" ]; then \
	echo "E2E API gate: mode=on -> running API integration tests."; \
	$(MAKE) e2e_test_api; \
elif [ "$$MODE" = "off" ]; then \
	echo "E2E API gate: mode=off -> skipping API integration tests."; \
elif [ "$$MODE" = "auto" ]; then \
	if ! command -v git >/dev/null 2>&1; then \
		echo "E2E API gate: mode=auto -> git unavailable, skipping API integration tests (aggressive default)."; \
		echo "To force gate: make E2E_API_GATE_MODE=on <target>"; \
	else \
		CHANGED_FILES=$$((git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard) 2>/dev/null | sed '/^$$/d' | sort -u); \
		if [ -z "$$CHANGED_FILES" ]; then \
			echo "E2E API gate: mode=auto -> no changed files, skipping API integration tests."; \
		elif printf "%s\n" "$$CHANGED_FILES" | rg -q '$(E2E_API_GATE_REQUIRED_PATHS_REGEX)'; then \
			echo "E2E API gate: mode=auto -> API-impacting changes detected, running API integration tests."; \
			$(MAKE) e2e_test_api; \
		else \
			echo "E2E API gate: mode=auto -> no API-impacting changes detected, skipping API integration tests."; \
		fi; \
	fi; \
else \
	echo "Invalid E2E_API_GATE_MODE='$$MODE'. Expected one of: auto, on, off."; \
	exit 2; \
fi
endef

# Reuse test DBs and schema. Same as test_deps.
e2e_deps: test_deps
	@echo "E2E deps ready (test DBs and schema)."

# Run deterministic seed for web only (main DB). Requires e2e_deps.
e2e_seed_web: e2e_deps
	@node tools/web/seed-e2e.mjs

# Run deterministic seed for management-web only. Requires e2e_deps.
e2e_seed_management_web: e2e_deps
	@node tools/management-web/seed-e2e.mjs

# Run deterministic seed for both web and management-web.
e2e_seed: e2e_seed_web e2e_seed_management_web
	@echo "E2E seed complete (web + management-web)."

# Mailpit for signup-enabled E2E (SMTP 1025, web UI 8025). Defined in infra/docker/e2e/docker-compose.yml.
# Idempotent: docker compose up -d is no-op when already running. Stopped by e2e_mailpit_down or make test_clean.
E2E_COMPOSE_FILE := infra/docker/e2e/docker-compose.yml
e2e_mailpit_up:
	@docker compose -f $(E2E_COMPOSE_FILE) --project-directory . up -d
	@echo "E2E Mailpit ready (SMTP 1025, web UI 8025)."

e2e_mailpit_down:
	@docker compose -f $(E2E_COMPOSE_FILE) --project-directory . down
	@echo "E2E Mailpit stopped."

e2e_mailpit_clean: e2e_mailpit_down

# Run API integration tests only (api + management-api). Fail fast; used as gate before Playwright.
e2e_test_api: e2e_deps
	@npm run test

# Run API gate decision first; if gate runs and succeeds, re-seed (API globalSetup truncates), then run Playwright for web: default then signup-enabled (Mailpit up).
# Playwright auto-starts API/sidecar/web on dedicated E2E ports (4010/4011/4012)
# using production-like build/start commands.
e2e_test_web:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed_web
	@npm run test:e2e -w apps/web -- $(WEB_SPEC_ORDERED) && $(MAKE) e2e_mailpit_up && npm run test:e2e -w apps/web -- --config=playwright.signup-enabled.config.ts $(SIGNUP_ENABLED_WEB_SPEC_ARGS)

# Run API gate decision first; if gate runs and succeeds, re-seed both E2E datasets, then run Playwright for management-web only.
# Playwright auto-starts management-api, management-web sidecar, and management-web on E2E ports (4110/4111/4112)
# using production-like build/start commands.
e2e_test_management_web:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed
	@npm run test:e2e -w @boilerplate/management-web

# Run API gate decision first; if gate runs and succeeds, re-seed both, then run Playwright:
# default web, signup-enabled web (Mailpit up), admin-only-email web, management-web.
e2e_test:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed
	@npm run test:e2e -w apps/web -- $(WEB_SPEC_ORDERED) && $(MAKE) e2e_mailpit_up && npm run test:e2e -w apps/web -- --config=playwright.signup-enabled.config.ts $(SIGNUP_ENABLED_WEB_SPEC_ARGS) && npm run test:e2e -w apps/web -- --config=playwright.admin-only-email.config.ts $(ADMIN_ONLY_EMAIL_WEB_SPEC_ORDERED) && npm run test:e2e -w @boilerplate/management-web

# Full E2E suite in report mode: run all web auth modes (default, signup-enabled, admin-only-email)
# and management-web; four report dirs (web, web-signup-enabled, web-admin-only-email, management-web);
# step screenshots and auto-open all four. Report opens even when tests fail.
# Spec order is conceptual (home, buckets, etc.) from e2e-spec-order-*.txt.
e2e_test_report:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web"; \
	WEB_SIGNUP_REPORT_DIR="$$RUN_DIR/web-signup-enabled"; \
	WEB_ADMIN_ONLY_EMAIL_REPORT_DIR="$$RUN_DIR/web-admin-only-email"; \
	MGMT_REPORT_DIR="$$RUN_DIR/management-web"; \
	mkdir -p "$$WEB_REPORT_DIR" "$$WEB_SIGNUP_REPORT_DIR" "$$WEB_ADMIN_ONLY_EMAIL_REPORT_DIR" "$$MGMT_REPORT_DIR"; \
	WEB_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_SPEC_ORDER="$(WEB_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $(WEB_SPEC_ORDERED) || WEB_EXIT=$$?; \
	$(MAKE) e2e_mailpit_up; \
	WEB_SIGNUP_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(SIGNUP_ENABLED_WEB_SPECS)" E2E_SPEC_ORDER="$(SIGNUP_ENABLED_WEB_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_SIGNUP_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --config=playwright.signup-enabled.config.ts --reporter=../../scripts/e2e-html-steps-reporter.ts $(SIGNUP_ENABLED_WEB_SPEC_ARGS) || WEB_SIGNUP_EXIT=$$?; \
	WEB_ADMIN_ONLY_EMAIL_EXIT=0; E2E_EMAIL_VERIFICATION_ENABLED=1 E2E_STEP_SCREENSHOTS=true E2E_SPEC_ORDER="$(ADMIN_ONLY_EMAIL_WEB_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_ADMIN_ONLY_EMAIL_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --config=playwright.admin-only-email.config.ts --reporter=../../scripts/e2e-html-steps-reporter.ts $(ADMIN_ONLY_EMAIL_WEB_SPEC_ORDERED) || WEB_ADMIN_ONLY_EMAIL_EXIT=$$?; \
	MGMT_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_SPEC_ORDER="$(MGMT_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$MGMT_REPORT_DIR" npm run test:e2e -w @boilerplate/management-web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $(MGMT_SPEC_ORDERED) || MGMT_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	WEB_SIGNUP_INDEX="$$WEB_SIGNUP_REPORT_DIR/index.html"; \
	WEB_ADMIN_ONLY_EMAIL_INDEX="$$WEB_ADMIN_ONLY_EMAIL_REPORT_DIR/index.html"; \
	MGMT_INDEX="$$MGMT_REPORT_DIR/index.html"; \
	echo "E2E reports:"; \
	echo "  $$WEB_INDEX"; \
	echo "  $$WEB_SIGNUP_INDEX"; \
	echo "  $$WEB_ADMIN_ONLY_EMAIL_INDEX"; \
	echo "  $$MGMT_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
		[ -f "$$WEB_SIGNUP_INDEX" ] && open "$$WEB_SIGNUP_INDEX" || echo "Could not auto-open $$WEB_SIGNUP_INDEX"; \
		[ -f "$$WEB_ADMIN_ONLY_EMAIL_INDEX" ] && open "$$WEB_ADMIN_ONLY_EMAIL_INDEX" || echo "Could not auto-open $$WEB_ADMIN_ONLY_EMAIL_INDEX"; \
		[ -f "$$MGMT_INDEX" ] && open "$$MGMT_INDEX" || echo "Could not auto-open $$MGMT_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
		[ -f "$$WEB_SIGNUP_INDEX" ] && xdg-open "$$WEB_SIGNUP_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_SIGNUP_INDEX"; \
		[ -f "$$WEB_ADMIN_ONLY_EMAIL_INDEX" ] && xdg-open "$$WEB_ADMIN_ONLY_EMAIL_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_ADMIN_ONLY_EMAIL_INDEX"; \
		[ -f "$$MGMT_INDEX" ] && xdg-open "$$MGMT_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$MGMT_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the files manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ] || [ "$$WEB_SIGNUP_EXIT" -ne 0 ] || [ "$$WEB_ADMIN_ONLY_EMAIL_EXIT" -ne 0 ] || [ "$$MGMT_EXIT" -ne 0 ]; then exit 1; fi

# Scoped report mode for one or more web E2E specs. Requires SPEC.
# SPEC supports a single path or comma-separated paths; tests run and appear in report in parameter order (do not reorder).
# (example: SPEC=e2e/buckets-unauthenticated.spec.ts,e2e/invite-unauthenticated.spec.ts).
# Runs API gate decision first, re-seeds web, captures step screenshots, writes timestamped report, rotates to 10 runs.
e2e_test_web_report_spec:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed_web
	@if [ -z "$(SPEC)" ]; then \
		echo "Missing SPEC. Usage: make e2e_test_web_report_spec SPEC=e2e/<spec>.spec.ts[,e2e/<spec>.spec.ts]"; \
		exit 2; \
	fi
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web"; \
	mkdir -p "$$WEB_REPORT_DIR"; \
	WEB_SPEC_ARGS=$$(printf "%s" "$(SPEC)" | tr ',' ' '); \
	WEB_SPEC_ORDER_SEMICOLON=$$(printf "%s" "$(SPEC)" | tr ',' ';'); \
	WEB_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(SPEC)" E2E_SPEC_ORDER="$$WEB_SPEC_ORDER_SEMICOLON" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $$WEB_SPEC_ARGS || WEB_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	echo "Scoped web E2E report:"; \
	echo "  $$WEB_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the file manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ]; then exit 1; fi

# Signup-enabled E2E: Mailpit up, API with AUTH_MODE=user_signup_email,
# signup-enabled web auth specs. Report to RUN_DIR/web-signup-enabled.
e2e_test_web_signup_enabled:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed_web
	@$(MAKE) e2e_mailpit_up
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web-signup-enabled"; \
	mkdir -p "$$WEB_REPORT_DIR"; \
	WEB_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(SIGNUP_ENABLED_WEB_SPECS)" E2E_SPEC_ORDER="$(SIGNUP_ENABLED_WEB_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --config=playwright.signup-enabled.config.ts --reporter=../../scripts/e2e-html-steps-reporter.ts $(SIGNUP_ENABLED_WEB_SPEC_ARGS) || WEB_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	echo "Signup-enabled web E2E report:"; \
	echo "  $$WEB_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the file manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ]; then exit 1; fi

# Admin-only-email E2E: API with AUTH_MODE=admin_only_email and deterministic mode-specific web auth specs.
# Report to RUN_DIR/web-admin-only-email. Mailpit required for forgot-password flow (API sends to SMTP).
e2e_test_web_admin_only_email:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed_web
	@$(MAKE) e2e_mailpit_up
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web-admin-only-email"; \
	mkdir -p "$$WEB_REPORT_DIR"; \
	WEB_EXIT=0; E2E_EMAIL_VERIFICATION_ENABLED=1 E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(ADMIN_ONLY_EMAIL_WEB_SPECS)" E2E_SPEC_ORDER="$(ADMIN_ONLY_EMAIL_WEB_SPEC_ORDER_SEMICOLON)" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --config=playwright.admin-only-email.config.ts --reporter=../../scripts/e2e-html-steps-reporter.ts $(ADMIN_ONLY_EMAIL_WEB_SPEC_ORDERED) || WEB_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	echo "Admin-only-email web E2E report:"; \
	echo "  $$WEB_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the file manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ]; then exit 1; fi

# Scoped report mode for one or more web E2E specs under admin-only-email config. Requires SPEC.
# Same as e2e_test_web_report_spec but uses playwright.admin-only-email.config.ts and E2E_EMAIL_VERIFICATION_ENABLED=1; starts Mailpit.
# Usage: make e2e_test_web_admin_only_email_report_spec SPEC=e2e/settings-bucket-owner-admin-only-email.spec.ts
e2e_test_web_admin_only_email_report_spec:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed_web
	@$(MAKE) e2e_mailpit_up
	@if [ -z "$(SPEC)" ]; then \
		echo "Missing SPEC. Usage: make e2e_test_web_admin_only_email_report_spec SPEC=e2e/<spec>.spec.ts[,e2e/<spec>.spec.ts]"; \
		exit 2; \
	fi
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web-admin-only-email"; \
	mkdir -p "$$WEB_REPORT_DIR"; \
	WEB_SPEC_ARGS=$$(printf "%s" "$(SPEC)" | tr ',' ' '); \
	WEB_SPEC_ORDER_SEMICOLON=$$(printf "%s" "$(SPEC)" | tr ',' ';'); \
	WEB_EXIT=0; E2E_EMAIL_VERIFICATION_ENABLED=1 E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(SPEC)" E2E_SPEC_ORDER="$$WEB_SPEC_ORDER_SEMICOLON" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --config=playwright.admin-only-email.config.ts --reporter=../../scripts/e2e-html-steps-reporter.ts $$WEB_SPEC_ARGS || WEB_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	echo "Admin-only-email web E2E report (scoped):"; \
	echo "  $$WEB_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the file manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ]; then exit 1; fi

# Scoped report mode for one or more management-web E2E specs. Requires SPEC.
# SPEC supports a single path or comma-separated paths; tests run and appear in report in parameter order (do not reorder).
# (example: SPEC=e2e/buckets-unauthenticated.spec.ts,e2e/events-unauthenticated.spec.ts).
# Runs API gate decision first, re-seeds both E2E datasets, captures step screenshots, writes timestamped report, rotates to 10 runs.
e2e_test_management_web_report_spec:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed
	@if [ -z "$(SPEC)" ]; then \
		echo "Missing SPEC. Usage: make e2e_test_management_web_report_spec SPEC=e2e/<spec>.spec.ts[,e2e/<spec>.spec.ts]"; \
		exit 2; \
	fi
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	MGMT_REPORT_DIR="$$RUN_DIR/management-web"; \
	mkdir -p "$$MGMT_REPORT_DIR"; \
	MGMT_SPEC_ARGS=$$(printf "%s" "$(SPEC)" | tr ',' ' '); \
	MGMT_SPEC_ORDER_SEMICOLON=$$(printf "%s" "$(SPEC)" | tr ',' ';'); \
	MGMT_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(SPEC)" E2E_SPEC_ORDER="$$MGMT_SPEC_ORDER_SEMICOLON" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$MGMT_REPORT_DIR" npm run test:e2e -w @boilerplate/management-web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $$MGMT_SPEC_ARGS || MGMT_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	MGMT_INDEX="$$MGMT_REPORT_DIR/index.html"; \
	echo "Scoped management-web E2E report:"; \
	echo "  $$MGMT_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$MGMT_INDEX" ] && open "$$MGMT_INDEX" || echo "Could not auto-open $$MGMT_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$MGMT_INDEX" ] && xdg-open "$$MGMT_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$MGMT_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the file manually."; \
	fi; \
	if [ "$$MGMT_EXIT" -ne 0 ]; then exit 1; fi

# Scoped report mode for both apps in one run. Requires WEB_SPEC and MGMT_SPEC.
# WEB_SPEC and MGMT_SPEC each support a single path or comma-separated paths; order is preserved (do not reorder).
# Runs API gate decision first, re-seeds both apps, captures step screenshots, writes timestamped reports, rotates to 10 runs.
e2e_test_report_scoped:
	@$(call e2e_run_api_gate)
	@$(MAKE) e2e_seed
	@if [ -z "$(WEB_SPEC)" ] || [ -z "$(MGMT_SPEC)" ]; then \
		echo "Missing WEB_SPEC or MGMT_SPEC."; \
		echo "Usage: make e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts[,e2e/<web-spec>.spec.ts] MGMT_SPEC=e2e/<management-spec>.spec.ts[,e2e/<management-spec>.spec.ts]"; \
		exit 2; \
	fi
	@TS=$$(date +"%Y%m%d-%H%M%S"); \
	ROOT_DIR="$$(pwd)"; \
	BASE_DIR="$$ROOT_DIR/.artifacts/e2e-reports"; \
	RUN_DIR="$$BASE_DIR/$$TS"; \
	WEB_REPORT_DIR="$$RUN_DIR/web"; \
	MGMT_REPORT_DIR="$$RUN_DIR/management-web"; \
	mkdir -p "$$WEB_REPORT_DIR" "$$MGMT_REPORT_DIR"; \
	WEB_SPEC_ARGS=$$(printf "%s" "$(WEB_SPEC)" | tr ',' ' '); \
	MGMT_SPEC_ARGS=$$(printf "%s" "$(MGMT_SPEC)" | tr ',' ' '); \
	WEB_SPEC_ORDER_SEMICOLON=$$(printf "%s" "$(WEB_SPEC)" | tr ',' ';'); \
	MGMT_SPEC_ORDER_SEMICOLON=$$(printf "%s" "$(MGMT_SPEC)" | tr ',' ';'); \
	WEB_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(WEB_SPEC)" E2E_SPEC_ORDER="$$WEB_SPEC_ORDER_SEMICOLON" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$WEB_REPORT_DIR" npm run test:e2e -w @boilerplate/web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $$WEB_SPEC_ARGS || WEB_EXIT=$$?; \
	MGMT_EXIT=0; E2E_STEP_SCREENSHOTS=true E2E_REPORT_SPEC="$(MGMT_SPEC)" E2E_SPEC_ORDER="$$MGMT_SPEC_ORDER_SEMICOLON" PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR="$$MGMT_REPORT_DIR" npm run test:e2e -w @boilerplate/management-web -- --reporter=../../scripts/e2e-html-steps-reporter.ts $$MGMT_SPEC_ARGS || MGMT_EXIT=$$?; \
	ln -sfn "$$TS" "$$BASE_DIR/latest"; \
	RUN_DIRS=$$((ls -1d "$$BASE_DIR"/20??????-?????? 2>/dev/null || true) | sort); \
	RUN_COUNT=$$(printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | wc -l | tr -d ' '); \
	if [ "$$RUN_COUNT" -gt 10 ]; then \
		REMOVE_COUNT=$$((RUN_COUNT - 10)); \
		printf "%s\n" "$$RUN_DIRS" | sed '/^$$/d' | head -n "$$REMOVE_COUNT" | while IFS= read -r OLD_DIR; do \
			if [ -n "$$OLD_DIR" ]; then \
				rm -rf "$$OLD_DIR"; \
			fi; \
		done; \
		echo "Rotated old E2E reports: kept newest 10 timestamped directories."; \
	fi; \
	WEB_INDEX="$$WEB_REPORT_DIR/index.html"; \
	MGMT_INDEX="$$MGMT_REPORT_DIR/index.html"; \
	echo "Scoped E2E reports:"; \
	echo "  $$WEB_INDEX"; \
	echo "  $$MGMT_INDEX"; \
	echo "Latest symlink: $$BASE_DIR/latest"; \
	if command -v open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && open "$$WEB_INDEX" || echo "Could not auto-open $$WEB_INDEX"; \
		[ -f "$$MGMT_INDEX" ] && open "$$MGMT_INDEX" || echo "Could not auto-open $$MGMT_INDEX"; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		[ -f "$$WEB_INDEX" ] && xdg-open "$$WEB_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$WEB_INDEX"; \
		[ -f "$$MGMT_INDEX" ] && xdg-open "$$MGMT_INDEX" >/dev/null 2>&1 || echo "Could not auto-open $$MGMT_INDEX"; \
	else \
		echo "Could not auto-open browser (no open/xdg-open). Open the files manually."; \
	fi; \
	if [ "$$WEB_EXIT" -ne 0 ] || [ "$$MGMT_EXIT" -ne 0 ]; then exit 1; fi

# Stop processes started for E2E. Playwright-managed webServer processes stop automatically.
# Does not drop DBs; run make test_clean for full teardown of test containers.
e2e_teardown:
	@echo "E2E teardown: stop API, sidecar, web, and management-web processes if you started them (e.g. Ctrl+C). For full cleanup: make test_clean"
