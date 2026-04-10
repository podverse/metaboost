-- 0001 migration: management_user – super admin singleton + admins (with credentials and bio 1:1)

-- Core management user row (no email/password here; see management_user_credentials)
CREATE TABLE IF NOT EXISTS management_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at server_time_with_default NOT NULL,
    created_by UUID REFERENCES management_user(id) ON DELETE SET NULL
);

-- At most one row with is_super_admin = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_super_admin ON management_user(is_super_admin) WHERE is_super_admin = true;

-- Credentials: username and password (1:1 with management_user); management-web auth is username-only
CREATE TABLE IF NOT EXISTS management_user_credentials (
    management_user_id UUID PRIMARY KEY REFERENCES management_user(id) ON DELETE CASCADE,
    username varchar_short UNIQUE NOT NULL,
    password_hash varchar_password NOT NULL
);

-- Bio: display name (1:1 with management_user); unique so admins are distinguishable without ID
CREATE TABLE IF NOT EXISTS management_user_bio (
    management_user_id UUID PRIMARY KEY REFERENCES management_user(id) ON DELETE CASCADE,
    display_name varchar_short NOT NULL UNIQUE
);
