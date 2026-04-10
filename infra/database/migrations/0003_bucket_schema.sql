-- 0003 migration: bucket (and child buckets), bucket_admin, bucket_role, bucket_message, bucket_admin_invitation

-- Bucket: top-level have parent_bucket_id NULL; child buckets are rows with parent_bucket_id set.
-- short_id: URL-safe public id (app sets on insert via nanoid).
CREATE TABLE bucket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name varchar_short NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    parent_bucket_id UUID NULL REFERENCES bucket(id) ON DELETE CASCADE,
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
CREATE UNIQUE INDEX idx_bucket_short_id ON bucket(short_id);

-- Bucket settings (e.g. message body max length per bucket).
CREATE TABLE bucket_settings (
    bucket_id UUID PRIMARY KEY REFERENCES bucket(id) ON DELETE CASCADE,
    message_body_max_length INTEGER NULL
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

-- Messages in a bucket; is_public controls visibility on public bucket page.
CREATE TABLE bucket_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES bucket(id) ON DELETE CASCADE,
    sender_name varchar_short NOT NULL,
    body TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at server_time_with_default NOT NULL
);

CREATE INDEX idx_bucket_message_bucket_id ON bucket_message(bucket_id);
CREATE INDEX idx_bucket_message_created_at ON bucket_message(created_at);
CREATE INDEX idx_bucket_message_bucket_id_is_public ON bucket_message(bucket_id, is_public);

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
