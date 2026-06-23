-- Forward-only: per-user membership lifecycle (tier, expiry, renewal automation).
-- Schema-only phase; runtime gating is enforced in API middleware and services.

CREATE TABLE user_membership (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  membership_tier VARCHAR(32) NOT NULL DEFAULT 'trial',
  membership_expires_at TIMESTAMP NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  billing_cadence TEXT CHECK (
    billing_cadence IS NULL OR billing_cadence IN ('monthly', 'annual')
  ),
  auto_renew_mode TEXT NOT NULL DEFAULT 'off' CHECK (auto_renew_mode IN ('off', 'on')),
  next_renewal_attempt_at TIMESTAMP,
  last_renewal_attempt_at TIMESTAMP,
  last_renewal_status TEXT NOT NULL DEFAULT 'none' CHECK (
    last_renewal_status IN ('none', 'succeeded', 'failed')
  ),
  last_extension_idempotency_key VARCHAR(128),
  last_renewal_idempotency_key VARCHAR(128),
  renewal_retry_count INTEGER NOT NULL DEFAULT 0,
  renewal_retry_backoff_until TIMESTAMP,
  created_at server_time_with_default NOT NULL,
  updated_at server_time_with_default NOT NULL,
  CONSTRAINT chk_user_membership_tier
    CHECK (membership_tier IN ('trial', 'premium')),
  CONSTRAINT chk_user_membership_expires_after_epoch
    CHECK (membership_expires_at IS NULL OR membership_expires_at > TIMESTAMP '1970-01-01 00:00:00')
);

CREATE TRIGGER set_updated_at_user_membership
  BEFORE UPDATE ON user_membership
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_field();

INSERT INTO user_membership (user_id, membership_tier, auto_renew, auto_renew_mode)
SELECT u.id, 'trial', false, 'off'
FROM "user" AS u;

CREATE INDEX idx_user_membership_next_renewal_attempt_at
  ON user_membership(next_renewal_attempt_at)
  WHERE next_renewal_attempt_at IS NOT NULL;

CREATE INDEX idx_user_membership_renewal_retry_backoff_until
  ON user_membership(renewal_retry_backoff_until)
  WHERE renewal_retry_backoff_until IS NOT NULL;
