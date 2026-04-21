# Phase 4: Management global-ban UI/API

- Added management-api `/apps` endpoints:
  - list registry apps with global block state,
  - add global blocked app override,
  - remove global blocked app override.
- Added management-web blocked-apps tab in bucket settings.
- Added global blocked toggle UX for management admins.
- Registry-suspended/revoked apps are shown as blocked-everywhere and not editable.
