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
