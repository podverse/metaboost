-- Forward-only: billing product/price catalog, membership trial settings, renewal metadata on trust settings.

CREATE TABLE billing_product (
    id SERIAL PRIMARY KEY,
    product_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at server_time_with_default NOT NULL,
    updated_at server_time_with_default NOT NULL
);

CREATE TRIGGER set_updated_at_billing_product
    BEFORE UPDATE ON billing_product
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_field();

CREATE TABLE billing_price (
    id SERIAL PRIMARY KEY,
    billing_product_id INTEGER NOT NULL REFERENCES billing_product(id) ON DELETE CASCADE,
    currency_code CHAR(3) NOT NULL,
    billing_cadence TEXT NOT NULL CHECK (billing_cadence IN ('monthly', 'annual')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at server_time_with_default NOT NULL,
    updated_at server_time_with_default NOT NULL,
    CONSTRAINT billing_price_effective_window_check CHECK (
      effective_to IS NULL OR effective_to > effective_from
    ),
    CONSTRAINT billing_price_unique_window_start UNIQUE (
      billing_product_id,
      currency_code,
      billing_cadence,
      effective_from
    )
);

CREATE TRIGGER set_updated_at_billing_price
    BEFORE UPDATE ON billing_price
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_field();

CREATE UNIQUE INDEX uq_billing_price_open_window
  ON billing_price (billing_product_id, currency_code, billing_cadence)
  WHERE effective_to IS NULL;

CREATE INDEX idx_billing_price_effective_lookup
  ON billing_price (billing_product_id, billing_cadence, currency_code, effective_from DESC);

CREATE TABLE billing_price_change_audit (
    id SERIAL PRIMARY KEY,
    billing_price_id INTEGER REFERENCES billing_price(id) ON DELETE SET NULL,
    changed_by_management_user_id UUID,
    change_reason TEXT,
    previous_amount_cents INTEGER CHECK (previous_amount_cents IS NULL OR previous_amount_cents >= 0),
    new_amount_cents INTEGER CHECK (new_amount_cents IS NULL OR new_amount_cents >= 0),
    previous_effective_from TIMESTAMP,
    previous_effective_to TIMESTAMP,
    new_effective_from TIMESTAMP,
    new_effective_to TIMESTAMP,
    created_at server_time_with_default NOT NULL
);

INSERT INTO billing_product (product_code, name, is_active)
VALUES ('membership_premium', 'Premium Membership', TRUE);

INSERT INTO billing_price (
  billing_product_id,
  currency_code,
  billing_cadence,
  amount_cents,
  effective_from,
  effective_to,
  source
)
SELECT bp.id, 'USD', 'monthly', 300, TIMESTAMP '2000-01-01 00:00:00', NULL, 'seed'
FROM billing_product bp
WHERE bp.product_code = 'membership_premium';

INSERT INTO billing_price (
  billing_product_id,
  currency_code,
  billing_cadence,
  amount_cents,
  effective_from,
  effective_to,
  source
)
SELECT bp.id, 'USD', 'annual', 3000, TIMESTAMP '2000-01-01 00:00:00', NULL, 'seed'
FROM billing_product bp
WHERE bp.product_code = 'membership_premium';

CREATE TABLE product_membership_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    free_trial_expiration_seconds INTEGER NOT NULL CHECK (free_trial_expiration_seconds > 0),
    created_at server_time_with_default NOT NULL,
    updated_at server_time_with_default NOT NULL
);

CREATE TRIGGER set_updated_at_product_membership_settings
    BEFORE UPDATE ON product_membership_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_field();

INSERT INTO product_membership_settings (
  id,
  free_trial_expiration_seconds,
  created_at,
  updated_at
)
VALUES (1, 2678400, TIMESTAMP '2000-01-01 00:00:00', TIMESTAMP '2000-01-01 00:00:00');

ALTER TABLE user_trust_settings
  ADD COLUMN billing_cadence TEXT CHECK (
    billing_cadence IS NULL OR billing_cadence IN ('monthly', 'annual')
  ),
  ADD COLUMN auto_renew_mode TEXT NOT NULL DEFAULT 'off' CHECK (auto_renew_mode IN ('off', 'on')),
  ADD COLUMN next_renewal_attempt_at TIMESTAMP,
  ADD COLUMN last_renewal_attempt_at TIMESTAMP,
  ADD COLUMN last_renewal_status TEXT NOT NULL DEFAULT 'none' CHECK (
    last_renewal_status IN ('none', 'succeeded', 'failed')
  ),
  ADD COLUMN last_extension_idempotency_key VARCHAR(128),
  ADD COLUMN last_renewal_idempotency_key VARCHAR(128),
  ADD COLUMN renewal_retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN renewal_retry_backoff_until TIMESTAMP;

UPDATE user_trust_settings
SET auto_renew_mode = CASE WHEN auto_renew THEN 'on' ELSE 'off' END;

CREATE INDEX idx_user_trust_settings_next_renewal_attempt_at
  ON user_trust_settings(next_renewal_attempt_at)
  WHERE next_renewal_attempt_at IS NOT NULL;

CREATE INDEX idx_user_trust_settings_renewal_retry_backoff_until
  ON user_trust_settings(renewal_retry_backoff_until)
  WHERE renewal_retry_backoff_until IS NOT NULL;
