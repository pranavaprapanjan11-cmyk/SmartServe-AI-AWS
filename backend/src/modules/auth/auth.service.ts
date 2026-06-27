// File: backend/src/modules/auth/auth.service.ts
// Service layer for authentication: interacts with PostgreSQL and handles password hashing

import bcrypt from 'bcrypt';
import { pool } from '../../database';
import { NewUserPayload, UserRecord } from './auth.types';

// Configure PG pool using DATABASE_URL env var. Ensure this is set in production.


const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

export async function createUser(payload: NewUserPayload): Promise<UserRecord> {
  const { name, email, password, role, workspace_id } = payload;
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const sql = `
    INSERT INTO users (name, email, password_hash, role, workspace_id, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, name, email, role, workspace_id, created_at
  `;

  const { rows } = await pool.query(sql, [name, email.toLowerCase(), hashed, role, workspace_id || null]);
  return rows[0] as UserRecord;
}

export async function findUserByEmail(email: string): Promise<(UserRecord & { password_hash?: string }) | null> {
  const sql = `SELECT id, name, email, role, password_hash, workspace_id, created_at FROM users WHERE email = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [email.toLowerCase()]);
  if (!rows[0]) return null;
  return rows[0] as any;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const sql = `SELECT id, name, email, role, workspace_id, created_at FROM users WHERE id = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [id]);
  if (!rows[0]) return null;
  return rows[0] as UserRecord;
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
