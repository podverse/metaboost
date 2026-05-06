-- Forward-only: add membership lifecycle and trust foundation.
-- Schema-only phase; no runtime gating behavior is enabled by this migration.
-- Greenfield: omit legacy trust_tier_id (removed in earlier chains as a follow-up migration).

CREATE TABLE user_trust_settings (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  membership_tier VARCHAR(32) NOT NULL DEFAULT 'trial',
  membership_expires_at TIMESTAMP NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at server_time_with_default NOT NULL,
  updated_at server_time_with_default NOT NULL,
  CONSTRAINT chk_user_trust_settings_membership_tier
    CHECK (membership_tier IN ('trial', 'premium')),
  CONSTRAINT chk_user_trust_settings_membership_expires_after_epoch
    CHECK (membership_expires_at IS NULL OR membership_expires_at > TIMESTAMP '1970-01-01 00:00:00')
);

CREATE TRIGGER set_updated_at_user_trust_settings
  BEFORE UPDATE ON user_trust_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_field();

INSERT INTO user_trust_settings (user_id, membership_tier, auto_renew)
SELECT u.id, 'trial', false
FROM "user" AS u;
