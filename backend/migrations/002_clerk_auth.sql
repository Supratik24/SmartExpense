ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_clerk_id_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
  END IF;
END $$;
