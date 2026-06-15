import { clerkClient } from '@clerk/express';
import type { DatabaseError } from 'pg';
import { query } from '../../db/pool.js';

type DbUser = {
  id: string;
  name: string;
  email: string;
};

export async function ensureDbUser(clerkId: string): Promise<DbUser> {
  const byClerk = await query<DbUser>(
    'SELECT id, name, email FROM users WHERE clerk_id = $1',
    [clerkId]
  );
  if (byClerk.rows[0]) return byClerk.rows[0];

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const email =
    clerkUser.emailAddresses.find((entry) => entry.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    '';
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    email.split('@')[0] ||
    'SmartExpense User';

  if (email) {
    const byEmail = await query<DbUser>(
      'SELECT id, name, email FROM users WHERE email = LOWER($1)',
      [email]
    );
    if (byEmail.rows[0]) {
      const linked = await query<DbUser>(
        `UPDATE users
         SET clerk_id = $1,
             name = $2,
             email = LOWER($3),
             email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, name, email`,
        [clerkId, name, email, byEmail.rows[0].id]
      );
      return linked.rows[0];
    }
  }

  try {
    const created = await query<DbUser>(
      `INSERT INTO users (name, email, password_hash, email_verified, clerk_id)
       VALUES ($1, LOWER($2), NULL, TRUE, $3)
       RETURNING id, name, email`,
      [name, email, clerkId]
    );
    return created.rows[0];
  } catch (error) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505' && email) {
      const linked = await query<DbUser>(
        `UPDATE users
         SET clerk_id = $1,
             name = $2,
             email_verified = TRUE,
             updated_at = NOW()
         WHERE email = LOWER($3)
         RETURNING id, name, email`,
        [clerkId, name, email]
      );
      if (linked.rows[0]) return linked.rows[0];
    }
    throw error;
  }
}
