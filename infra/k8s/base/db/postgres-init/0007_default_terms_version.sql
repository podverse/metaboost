-- Canonical bootstrap: one active `terms_version` row on first DB init (K8s, Docker, CI).
-- Required so TermsVersionService.assertConfiguredForStartup() passes before serving traffic.
-- Operators may supersede via migrations / terms lifecycle later.
--
-- Align effective_at / enforcement_starts_at with API_LATEST_TERMS_EFFECTIVE_AT expectations
-- (tests and env templates commonly use 2026-01-01T00:00:00.000Z).

INSERT INTO terms_version (
  version_key,
  title,
  content_hash,
  announcement_starts_at,
  effective_at,
  enforcement_starts_at,
  status
) VALUES (
  'default-bootstrap-2026-01-01',
  'Default terms (bootstrap)',
  'default-bootstrap-2026-01-01',
  NULL,
  TIMESTAMPTZ '2026-01-01 00:00:00+00',
  TIMESTAMPTZ '2026-01-01 00:00:00+00',
  'active'
);
