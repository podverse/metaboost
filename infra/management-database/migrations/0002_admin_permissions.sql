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
