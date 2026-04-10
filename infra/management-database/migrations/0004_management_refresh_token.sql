-- 0004 migration: management_refresh_token for HTTP-only refresh cookie rotation/revocation (aligned with main API)

CREATE DOMAIN varchar_token_hash AS VARCHAR(64);

CREATE TABLE management_refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    management_user_id UUID NOT NULL REFERENCES management_user(id) ON DELETE CASCADE,
    token_hash varchar_token_hash NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_management_refresh_token_hash ON management_refresh_token(token_hash);
CREATE INDEX idx_management_refresh_token_expires_at ON management_refresh_token(expires_at);
CREATE INDEX idx_management_refresh_token_user_id ON management_refresh_token(management_user_id);
