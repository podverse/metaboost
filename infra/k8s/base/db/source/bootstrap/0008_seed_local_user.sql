-- Seed a predefined dev user for LOCAL Docker only (mounted after bootstrap scripts).
-- Default terms_version rows are not inserted here; api/management-api create them on first startup when the table is empty.
-- Email: localdev@example.com  Username: localdev  Password: Test!1Aa
-- email_verified_at set to NOW() so the user can log in immediately without verifying email.
-- Terms acceptance for the bootstrap current version so local dev login reaches the dashboard.
-- Premium membership (long expiry) so /auth/me passes membership gate.
-- Hash generated with bcrypt 10 rounds; safe to commit.

WITH u AS (
  INSERT INTO "user" (id_text, email_verified_at)
  VALUES ('localdev01', NOW())
  RETURNING id
)
INSERT INTO user_credentials (user_id, email, username, password_hash)
SELECT id, 'localdev@example.com', 'localdev', '$2b$10$rPcezdnOXY9EIR8PRsK6tO4Aw/0TE32ADDwwPcmyGzz7xI5Myah5K'
FROM u;

WITH u AS (SELECT user_id AS id FROM user_credentials WHERE email = 'localdev@example.com')
INSERT INTO user_bio (user_id, display_name)
SELECT id, NULL FROM u;

WITH u AS (SELECT user_id AS id FROM user_credentials WHERE email = 'localdev@example.com')
INSERT INTO user_membership (user_id, membership_tier, membership_expires_at, auto_renew)
SELECT id, 'premium', NOW() + INTERVAL '100 years', false FROM u
ON CONFLICT (user_id) DO NOTHING;

WITH u AS (SELECT user_id AS id FROM user_credentials WHERE email = 'localdev@example.com')
INSERT INTO user_terms_acceptance (user_id, terms_version_id, accepted_at, acceptance_source)
SELECT id, 'a0000000-0000-4000-8000-000000000001'::uuid, NOW(), 'local-dev-seed'
FROM u
ON CONFLICT (user_id, terms_version_id) DO NOTHING;
