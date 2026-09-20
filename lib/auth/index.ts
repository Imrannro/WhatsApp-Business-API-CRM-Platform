import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Role } from '../db/types';
import { dbStore } from '../db/store';

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-crm-secure-jwt-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (_err) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateRequest(
  authHeader?: string | null,
  cookieToken?: string | null
): Promise<Omit<User, 'passwordHash'> | null> {
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await dbStore.findUserById(payload.userId);
  if (!user || user.status === 'INACTIVE') return null;

  const { passwordHash: _p, ...safeUser } = user;
  return safeUser;
}
