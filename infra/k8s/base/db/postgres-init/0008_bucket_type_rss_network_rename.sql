-- 0008 migration: rename bucket type 'group' -> 'rss-network'
-- Applies to existing databases; safe on fresh init.

UPDATE bucket
SET type = 'rss-network'
WHERE type = 'group';

ALTER TABLE bucket
  ALTER COLUMN type SET DEFAULT 'rss-network';

ALTER TABLE bucket
  DROP CONSTRAINT IF EXISTS chk_bucket_rss_item_requires_parent;

ALTER TABLE bucket
  DROP CONSTRAINT IF EXISTS bucket_type_check;

ALTER TABLE bucket
  ADD CONSTRAINT bucket_type_check
  CHECK (type IN ('rss-network', 'rss-channel', 'rss-item'));

ALTER TABLE bucket
  ADD CONSTRAINT chk_bucket_rss_item_requires_parent
  CHECK (type <> 'rss-item' OR parent_bucket_id IS NOT NULL);
