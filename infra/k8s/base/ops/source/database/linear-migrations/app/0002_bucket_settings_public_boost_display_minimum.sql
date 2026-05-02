-- Renames bucket_settings column: former ingest minimum is now an optional public message list
-- display floor only (semantics changed). Safe when 0001 already created public_boost_display_minimum_minor.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bucket_settings'
      AND column_name = 'minimum_message_amount_minor'
  ) THEN
    ALTER TABLE bucket_settings
      RENAME COLUMN minimum_message_amount_minor TO public_boost_display_minimum_minor;
  END IF;
END $$;
