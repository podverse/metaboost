-- 0002 migration: refresh_token for HTTP-only refresh cookie rotation/revocation

CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash varchar_token_hash NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_refresh_token_hash ON refresh_token(token_hash);
CREATE INDEX idx_refresh_token_expires_at ON refresh_token(expires_at);
CREATE INDEX idx_refresh_token_user_id ON refresh_token(user_id);
