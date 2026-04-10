# --- Dependency audit (plan 06 script). ---

.PHONY: audit audit-fix

audit:
	bash scripts/audit/audit.sh

audit-fix:
	bash scripts/audit/audit.sh --fix
