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
