import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { getDatabase } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
}

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Create a new session in the database
 */
export async function createSession(userId: string, token: string): Promise<string> {
  const db = getDatabase();
  const sessionId = crypto.randomUUID();
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await db.run(
    `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [sessionId, userId, tokenHash, new Date().toISOString(), expiresAt]
  );

  return sessionId;
}

/**
 * Validate session exists and is active
 */
export async function validateSession(sessionId: string, token: string): Promise<boolean> {
  const db = getDatabase();
  
  const session = await db.get(
    `SELECT * FROM sessions WHERE id = ? AND is_active = 1 AND expires_at > ?`,
    [sessionId, new Date().toISOString()]
  );

  if (!session) return false;

  // Verify token hash matches
  const isValid = await comparePassword(token, session.token_hash);
  return isValid;
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE sessions SET is_active = 0 WHERE id = ?`,
    [sessionId]
  );
}

/**
 * Invalidate all sessions for a user (logout from all devices)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE sessions SET is_active = 0 WHERE user_id = ?`,
    [userId]
  );
}
