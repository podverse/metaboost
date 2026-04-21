# Phase 3: Web bucket blocked-apps UI

- Added blocked-app list + checkbox controls in bucket settings.
- Each registry app renders with:
  - app display name,
  - registry status,
  - allowed checkbox (default-allow semantics).
- Checkbox behavior:
  - uncheck -> creates `bucket_blocked_app` row,
  - check -> deletes `bucket_blocked_app` row.
- Global/registry blocked apps render disabled with tooltip messaging.
- Top-level-only gating remains aligned with existing blocked-sender tab rules.
