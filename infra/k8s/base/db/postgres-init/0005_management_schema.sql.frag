-- Combined migrations generated Mon Apr  6 23:11:17 CDT 2026
-- DO NOT EDIT - regenerate with scripts/database/combine-migrations.sh

-- Including: 0000_management_helpers.sql
-- 0000 migration: domains for management_user_credentials and management_user_bio (lengths align with @metaboost/helpers)

CREATE DOMAIN varchar_password AS VARCHAR(60);
CREATE DOMAIN varchar_short AS VARCHAR(50);
CREATE DOMAIN server_time_with_default AS TIMESTAMP DEFAULT NOW();


-- Including: 0001_management_user.sql
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


-- Including: 0002_admin_permissions.sql
-- 0002 migration: admin_permissions – CRUD bitmasks and event_visibility

-- Per-admin permissions (one row per admin; super admin has implicit full access).
-- admins_crud, users_crud, buckets_crud, bucket_messages_crud, bucket_admins_crud: 0–15 bitmask (create=1, read=2, update=4, delete=8).
-- Default 0 so new admins have no bucket or message access until granted.
-- bucket_admins_crud: per-bucket admin/invitation management (list, create, update, delete).
-- Capabilities such as changing passwords or assigning permissions are implied by
-- the relevant CRUD bits (e.g. update on users implies password changes).
CREATE TABLE IF NOT EXISTS admin_permissions (
    admin_id UUID PRIMARY KEY REFERENCES management_user(id) ON DELETE CASCADE,
    admins_crud INTEGER NOT NULL DEFAULT 0 CHECK (admins_crud >= 0 AND admins_crud <= 15),
    users_crud INTEGER NOT NULL DEFAULT 0 CHECK (users_crud >= 0 AND users_crud <= 15),
    buckets_crud INTEGER NOT NULL DEFAULT 0 CHECK (buckets_crud >= 0 AND buckets_crud <= 15),
    bucket_messages_crud INTEGER NOT NULL DEFAULT 0 CHECK (bucket_messages_crud >= 0 AND bucket_messages_crud <= 15),
    bucket_admins_crud INTEGER NOT NULL DEFAULT 0 CHECK (bucket_admins_crud >= 0 AND bucket_admins_crud <= 15),
    event_visibility TEXT NOT NULL DEFAULT 'all_admins' CHECK(event_visibility IN ('own', 'all_admins', 'all'))
);


-- Including: 0003_management_event.sql
-- 0003 migration: management_event – audit log for super admin and admin actions

-- Audit log: every action by super admin or admin
-- actor_display_name is stored at event time so it survives admin deletion or display name changes.
CREATE TABLE IF NOT EXISTS management_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK(actor_type IN ('super_admin', 'admin')),
    actor_display_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    timestamp server_time_with_default NOT NULL,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_management_event_actor ON management_event(actor_id);
CREATE INDEX IF NOT EXISTS idx_management_event_timestamp ON management_event(timestamp);


-- Including: 0004_management_refresh_token.sql
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


-- Including: 0005_management_admin_role.sql
-- 0005 migration: management_admin_role - custom role templates for management admins

-- Custom management-admin roles. Predefined roles are in code; this stores user-defined roles.
CREATE TABLE management_admin_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar_short NOT NULL UNIQUE,
    admins_crud INTEGER NOT NULL CHECK (admins_crud >= 0 AND admins_crud <= 15),
    users_crud INTEGER NOT NULL CHECK (users_crud >= 0 AND users_crud <= 15),
    buckets_crud INTEGER NOT NULL CHECK (buckets_crud >= 0 AND buckets_crud <= 15),
    bucket_messages_crud INTEGER NOT NULL CHECK (bucket_messages_crud >= 0 AND bucket_messages_crud <= 15),
    bucket_admins_crud INTEGER NOT NULL CHECK (bucket_admins_crud >= 0 AND bucket_admins_crud <= 15),
    event_visibility TEXT NOT NULL CHECK(event_visibility IN ('own', 'all_admins', 'all')),
    created_at server_time_with_default NOT NULL
);


