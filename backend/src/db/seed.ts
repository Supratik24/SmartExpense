import { query } from './pool.js';

export async function runClerkMigration() {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT');
  await query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_clerk_id_key'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
      END IF;
    END $$;
  `);
}

const CLERK_USER_ID = 'user_3FANHe1l3Zc17xF6YtcLPQ7onmJ';
const CLERK_USER_EMAIL = 'supratiksangram9@gmail.com';
const CLERK_USER_NAME = 'Supratik';

export async function seedClerkUser() {
  await runClerkMigration();

  // Prefer the real Gmail account and attach Clerk id to it.
  await query(
    `UPDATE users
     SET clerk_id = $1,
         name = $2,
         email_verified = TRUE,
         updated_at = NOW()
     WHERE email IN (LOWER($3), 'supratiksangram9@gamail.com')`,
    [CLERK_USER_ID, CLERK_USER_NAME, CLERK_USER_EMAIL]
  );

  await query(
    `INSERT INTO users (name, email, password_hash, email_verified, clerk_id)
     VALUES ($1, LOWER($2), NULL, TRUE, $3)
     ON CONFLICT (clerk_id) DO UPDATE
       SET name = EXCLUDED.name,
           email = LOWER(EXCLUDED.email),
           email_verified = TRUE,
           updated_at = NOW()`,
    [CLERK_USER_NAME, CLERK_USER_EMAIL, CLERK_USER_ID]
  );

  // Remove stale typo-email row if it duplicates the Clerk account.
  await query(
    `DELETE FROM users
     WHERE email = 'supratiksangram9@gamail.com'
       AND clerk_id = $1
       AND EXISTS (
         SELECT 1 FROM users WHERE email = LOWER($2) AND clerk_id = $1
       )`,
    [CLERK_USER_ID, CLERK_USER_EMAIL]
  );
}
