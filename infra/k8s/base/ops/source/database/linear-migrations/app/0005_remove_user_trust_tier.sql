-- Forward-only: hard break trust-tier semantics from user_trust_settings.
-- Runtime eligibility is membership-tier + expiry driven; advanced overrides remain separate.

ALTER TABLE user_trust_settings
DROP CONSTRAINT IF EXISTS chk_user_trust_settings_trust_tier_id;

ALTER TABLE user_trust_settings
DROP COLUMN IF EXISTS trust_tier_id;
