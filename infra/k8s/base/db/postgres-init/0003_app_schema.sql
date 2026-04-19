-- Combined migrations generated Mon Apr  6 23:11:17 CDT 2026
-- DO NOT EDIT - regenerate with scripts/database/combine-migrations.sh

-- Including: 0000_init_helpers.sql
-- 0000 migration

-- Minimal helper domains (only what user and related tables need).
-- Lengths (255, 60, 50, 32, 64) align with @metaboost/helpers field-lengths.

CREATE DOMAIN varchar_email AS VARCHAR(255) CHECK (VALUE ~ '^.+@.+\..+$');
CREATE DOMAIN varchar_password AS VARCHAR(60);
CREATE DOMAIN varchar_short AS VARCHAR(50);
CREATE DOMAIN varchar_medium AS VARCHAR(255);
CREATE DOMAIN varchar_url AS VARCHAR(2048);
-- Verification tokens: kind (e.g. email_verify) and SHA-256 hex hash; lengths align with @metaboost/helpers
CREATE DOMAIN varchar_token_kind AS VARCHAR(32);
CREATE DOMAIN varchar_token_hash AS VARCHAR(64);
CREATE DOMAIN server_time_with_default AS TIMESTAMPTZ DEFAULT NOW();

-- Function to set updated_at (used by user and future tables)

CREATE OR REPLACE FUNCTION set_updated_at_field()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Including: 0001_user_schema.sql
-- 0001 migration: user (singular) with join tables user_credentials, user_bio; verification_token

-- Core user row (one per account)
-- short_id: URL-safe public id (app sets on insert via nanoid).
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_verified_at TIMESTAMP NULL,
    short_id VARCHAR(12) NOT NULL,
    created_at server_time_with_default NOT NULL,
    updated_at server_time_with_default NOT NULL
);

CREATE TRIGGER set_updated_at_user
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_field();

CREATE UNIQUE INDEX idx_user_short_id ON "user"(short_id);

-- Credentials: email, username (at least one required), and password hash (1:1 with user)
CREATE TABLE user_credentials (
    user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    email varchar_email UNIQUE NULL,
    username VARCHAR(50) UNIQUE NULL,
    password_hash varchar_password NOT NULL,
    CONSTRAINT chk_user_credentials_email_or_username CHECK (email IS NOT NULL OR username IS NOT NULL)
);

-- Bio: display name (1:1 with user)
CREATE TABLE user_bio (
    user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    display_name varchar_short NULL,
    preferred_currency varchar_short NULL
);

-- One-time verification tokens (email verify, password reset, email change)
CREATE TABLE verification_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    kind varchar_token_kind NOT NULL,
    token_hash varchar_token_hash NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    payload JSONB NULL
);

CREATE UNIQUE INDEX idx_verification_token_hash ON verification_token(token_hash);
CREATE INDEX idx_verification_token_expires_at ON verification_token(expires_at);


-- Including: 0002_refresh_token.sql
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


-- Including: 0003_bucket_schema.sql
-- 0003 migration: bucket (and child buckets), bucket_admin, bucket_role, bucket_message, bucket_admin_invitation

-- Bucket: top-level have parent_bucket_id NULL; child buckets are rows with parent_bucket_id set.
-- short_id: URL-safe public id (app sets on insert via nanoid).
-- Types: RSS hierarchy (rss-network, rss-channel, rss-item) and Custom mb-v1 hierarchy (mb-root, mb-mid, mb-leaf).
CREATE TABLE bucket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name varchar_short NOT NULL,
    type varchar_short NOT NULL DEFAULT 'rss-network',
    is_public BOOLEAN NOT NULL DEFAULT false,
    parent_bucket_id UUID NULL REFERENCES bucket(id) ON DELETE CASCADE,
    CONSTRAINT bucket_type_check CHECK (type IN (
        'rss-network',
        'rss-channel',
        'rss-item',
        'mb-root',
        'mb-mid',
        'mb-leaf'
    )),
    CONSTRAINT chk_bucket_mb_root_top_level CHECK (
        type <> 'mb-root' OR parent_bucket_id IS NULL
    ),
    CONSTRAINT chk_bucket_mb_mid_leaf_requires_parent CHECK (
        type NOT IN ('mb-mid', 'mb-leaf') OR parent_bucket_id IS NOT NULL
    ),
    CONSTRAINT chk_bucket_rss_item_requires_parent CHECK (type <> 'rss-item' OR parent_bucket_id IS NOT NULL),
    short_id VARCHAR(12) NOT NULL,
    created_at server_time_with_default NOT NULL,
    updated_at server_time_with_default NOT NULL
);

CREATE TRIGGER set_updated_at_bucket
    BEFORE UPDATE ON bucket
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_field();

CREATE INDEX idx_bucket_owner_id ON bucket(owner_id);
CREATE INDEX idx_bucket_parent_bucket_id ON bucket(parent_bucket_id);
CREATE INDEX idx_bucket_type ON bucket(type);
CREATE INDEX idx_bucket_parent_bucket_id_type ON bucket(parent_bucket_id, type);
CREATE UNIQUE INDEX idx_bucket_short_id ON bucket(short_id);

-- Bucket settings (e.g. message body max length per bucket).
CREATE TABLE bucket_settings (
    bucket_id UUID PRIMARY KEY REFERENCES bucket(id) ON DELETE CASCADE,
    message_body_max_length INTEGER NOT NULL DEFAULT 500
        CHECK (message_body_max_length >= 140 AND message_body_max_length <= 2500),
    preferred_currency varchar_short NOT NULL DEFAULT 'USD',
    minimum_message_amount_minor INTEGER NOT NULL DEFAULT 0
        CHECK (minimum_message_amount_minor >= 0 AND minimum_message_amount_minor <= 2147483647)
);

-- Bucket admins: CRUD bitmasks for bucket, bucket messages, and other admins (create=1, read=2, update=4, delete=8). Read on admins is always required (enforced in app).
CREATE TABLE bucket_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    bucket_crud INTEGER NOT NULL DEFAULT 0,
    bucket_messages_crud INTEGER NOT NULL DEFAULT 0,
    bucket_admins_crud INTEGER NOT NULL DEFAULT 2,
    created_at server_time_with_default NOT NULL,
    UNIQUE (bucket_id, user_id)
);

CREATE INDEX idx_bucket_admin_bucket_id ON bucket_admin(bucket_id);
CREATE INDEX idx_bucket_admin_user_id ON bucket_admin(user_id);

-- Bucket-scoped custom roles (name + CRUD bitmasks). Predefined roles exist only in code.
CREATE TABLE bucket_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    name varchar_short NOT NULL,
    bucket_crud INTEGER NOT NULL,
    bucket_messages_crud INTEGER NOT NULL,
    bucket_admins_crud INTEGER NOT NULL,
    created_at server_time_with_default NOT NULL,
    UNIQUE (bucket_id, name)
);

CREATE INDEX idx_bucket_role_bucket_id ON bucket_role(bucket_id);

-- RSS channel metadata for mbrss-v1-compatible channel buckets.
CREATE TABLE bucket_rss_channel_info (
    bucket_id UUID PRIMARY KEY REFERENCES bucket(id) ON DELETE CASCADE,
    rss_feed_url varchar_url NOT NULL,
    rss_podcast_guid varchar_medium NOT NULL UNIQUE,
    rss_channel_title varchar_medium NOT NULL,
    rss_last_parse_attempt TIMESTAMP NULL,
    rss_last_successful_parse TIMESTAMP NULL,
    rss_verified TIMESTAMP NULL,
    rss_verification_failed_at TIMESTAMP NULL,
    rss_last_parsed_feed_hash varchar_medium NULL
);

-- RSS item metadata for mbrss-v1-compatible item buckets.
CREATE TABLE bucket_rss_item_info (
    bucket_id UUID PRIMARY KEY REFERENCES bucket(id) ON DELETE CASCADE,
    parent_rss_channel_bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    rss_item_guid varchar_url NOT NULL,
    rss_item_pub_date TIMESTAMP NOT NULL,
    orphaned BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (parent_rss_channel_bucket_id, rss_item_guid)
);

CREATE INDEX idx_bucket_rss_item_info_parent_channel ON bucket_rss_item_info(parent_rss_channel_bucket_id);
CREATE INDEX idx_bucket_rss_item_info_guid ON bucket_rss_item_info(rss_item_guid);

-- Messages in a bucket.
-- Core envelope only; app metadata and payment verification are normalized into companion tables.
CREATE TABLE bucket_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_guid UUID NOT NULL DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    sender_name varchar_short NULL,
    body TEXT NULL,
    action varchar_short NOT NULL DEFAULT 'boost' CHECK (action IN ('boost', 'stream')),
    CONSTRAINT chk_bucket_message_action_body
      CHECK (
        (action = 'stream' AND body IS NULL) OR
        (action = 'boost' AND (body IS NULL OR length(btrim(body)) > 0))
      ),
    created_at server_time_with_default NOT NULL
);

CREATE UNIQUE INDEX idx_bucket_message_message_guid ON bucket_message(message_guid);
CREATE INDEX idx_bucket_message_bucket_id ON bucket_message(bucket_id);
CREATE INDEX idx_bucket_message_created_at ON bucket_message(created_at);

CREATE TABLE bucket_message_value (
    bucket_message_id UUID PRIMARY KEY REFERENCES bucket_message(id) ON DELETE CASCADE,
    currency varchar_short NOT NULL,
    amount NUMERIC NOT NULL,
    amount_unit varchar_short NULL,
    threshold_currency_at_create varchar_short NULL,
    threshold_amount_minor_at_create INTEGER NULL
);

CREATE INDEX idx_bucket_message_value_currency ON bucket_message_value(currency);
CREATE INDEX idx_bucket_message_value_amount_unit ON bucket_message_value(amount_unit);
CREATE INDEX idx_bucket_message_value_threshold_currency ON bucket_message_value(threshold_currency_at_create);
CREATE INDEX idx_bucket_message_value_threshold_amount_minor ON bucket_message_value(threshold_amount_minor_at_create);

CREATE TABLE bucket_message_app_meta (
    bucket_message_id UUID PRIMARY KEY REFERENCES bucket_message(id) ON DELETE CASCADE,
    app_name varchar_short NOT NULL,
    app_version varchar_short NULL,
    sender_id varchar_medium NULL,
    podcast_index_feed_id INTEGER NULL,
    time_position NUMERIC NULL
);

-- Blocked senders (moderation): scoped to hierarchy root bucket; applies to all sub-buckets.
CREATE TABLE bucket_blocked_sender (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    sender_guid varchar_medium NOT NULL,
    label_snapshot varchar_short NULL,
    created_at server_time_with_default NOT NULL,
    UNIQUE (root_bucket_id, sender_guid)
);

CREATE INDEX idx_bucket_blocked_sender_root_bucket_id ON bucket_blocked_sender(root_bucket_id);

-- Blocked apps (moderation): scoped to hierarchy root bucket; applies to all sub-buckets.
CREATE TABLE bucket_blocked_app (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    app_id varchar_medium NOT NULL,
    app_name_snapshot varchar_short NULL,
    created_at server_time_with_default NOT NULL,
    UNIQUE (root_bucket_id, app_id)
);

CREATE INDEX idx_bucket_blocked_app_root_bucket_id ON bucket_blocked_app(root_bucket_id);
CREATE INDEX idx_bucket_blocked_app_app_id ON bucket_blocked_app(app_id);

-- Site-wide app blocks (management override).
CREATE TABLE global_blocked_app (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id varchar_medium NOT NULL UNIQUE,
    note varchar_short NULL,
    created_at server_time_with_default NOT NULL
);

CREATE INDEX idx_global_blocked_app_app_id ON global_blocked_app(app_id);

-- Invitation token: URL-safe, unique. status: pending | accepted | rejected. bucket_admins_crud: read=2 always required (enforced in app).
CREATE TABLE bucket_admin_invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL,
    bucket_crud INTEGER NOT NULL DEFAULT 0,
    bucket_messages_crud INTEGER NOT NULL DEFAULT 0,
    bucket_admins_crud INTEGER NOT NULL DEFAULT 2,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at server_time_with_default NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + interval '7 days'),
    UNIQUE (token)
);

CREATE INDEX idx_bucket_admin_invitation_bucket_id ON bucket_admin_invitation(bucket_id);
CREATE INDEX idx_bucket_admin_invitation_token ON bucket_admin_invitation(token);
CREATE INDEX idx_bucket_admin_invitation_status ON bucket_admin_invitation(status);


