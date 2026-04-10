-- 0000 migration

-- Minimal helper domains (only what user and related tables need).
-- Lengths (255, 60, 50, 32, 64) align with @metaboost/helpers field-lengths.

CREATE DOMAIN varchar_email AS VARCHAR(255) CHECK (VALUE ~ '^.+@.+\..+$');
CREATE DOMAIN varchar_password AS VARCHAR(60);
CREATE DOMAIN varchar_short AS VARCHAR(50);
-- Verification tokens: kind (e.g. email_verify) and SHA-256 hex hash; lengths align with @metaboost/helpers
CREATE DOMAIN varchar_token_kind AS VARCHAR(32);
CREATE DOMAIN varchar_token_hash AS VARCHAR(64);
CREATE DOMAIN server_time_with_default AS TIMESTAMP DEFAULT NOW();

-- Function to set updated_at (used by user and future tables)

CREATE OR REPLACE FUNCTION set_updated_at_field()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
