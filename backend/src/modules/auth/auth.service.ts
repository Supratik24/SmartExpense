import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { DatabaseError } from 'pg';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { randomToken, sha256 } from '../../utils/hash.js';

type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
};

function signAccessToken(user: Pick<DbUser, 'id' | 'email'>) {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn']
  });
}

async function issueRefreshToken(userId: string) {
  const refreshToken = randomToken(48);
  const tokenHash = sha256(refreshToken);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [userId, tokenHash]
  );
  return refreshToken;
}

async function issueAuthToken(userId: string, purpose: 'email_verification' | 'password_reset') {
  const token = randomToken();
  await query(
    `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '1 day')`,
    [userId, sha256(token), purpose]
  );
  return token;
}

export async function signup(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  let result;
  try {
    result = await query<DbUser>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, name, email, password_hash, email_verified`,
      [name, email, passwordHash]
    );
  } catch (error) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      throw Object.assign(new Error('An account with this email already exists. Please log in instead.'), {
        status: 409
      });
    }
    throw error;
  }
  const user = result.rows[0];
  const verificationToken = await issueAuthToken(user.id, 'email_verification');
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user),
    refreshToken: await issueRefreshToken(user.id),
    verificationToken
  };
}

export async function login(email: string, password: string) {
  const result = await query<DbUser>(
    'SELECT id, name, email, password_hash, email_verified FROM users WHERE email = LOWER($1)',
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user),
    refreshToken: await issueRefreshToken(user.id)
  };
}

export async function refresh(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  const result = await query<DbUser>(
    `SELECT u.id, u.name, u.email, u.password_hash, u.email_verified
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  const user = result.rows[0];
  if (!user) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  return { accessToken: signAccessToken(user), refreshToken: await issueRefreshToken(user.id) };
}

export async function logout(refreshToken: string) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [
    sha256(refreshToken)
  ]);
}

export async function verifyEmail(token: string) {
  const tokenHash = sha256(token);
  const result = await query<{ user_id: string }>(
    `UPDATE auth_tokens SET used_at = NOW()
     WHERE token_hash = $1 AND purpose = 'email_verification' AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) throw Object.assign(new Error('Invalid verification token'), { status: 400 });
  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [row.user_id]);
}

export async function requestPasswordReset(email: string) {
  const result = await query<DbUser>('SELECT * FROM users WHERE email = LOWER($1)', [email]);
  const user = result.rows[0];
  if (!user) return null;
  return issueAuthToken(user.id, 'password_reset');
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = sha256(token);
  const result = await query<{ user_id: string }>(
    `UPDATE auth_tokens SET used_at = NOW()
     WHERE token_hash = $1 AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) throw Object.assign(new Error('Invalid reset token'), { status: 400 });
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    await bcrypt.hash(password, 12),
    row.user_id
  ]);
}

function sanitizeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.email_verified
  };
}
