-- GENERATED FILE (do not edit) — see scripts/database/generate-linear-migration-history-seed.sh
-- Seeds linear_migration_history so forward-only ops jobs match baseline-materialized schema.

\connect metaboost_app

-- App database
INSERT INTO linear_migration_history (migration_filename, migration_checksum) VALUES
  ('0001_app_schema.sql', '53019b548b1542295899d61671281c1be7279f6c19d8771e8aa5544e2345b55e')
ON CONFLICT (migration_filename) DO NOTHING;

\connect metaboost_management

-- Management database
INSERT INTO linear_migration_history (migration_filename, migration_checksum) VALUES
  ('0001_management_schema.sql', 'db5e4b1eb9adb7023bf6f6c23d661164ef9d657cb74df3a150d63b407ae15744')
ON CONFLICT (migration_filename) DO NOTHING;

