import jwt from 'jsonwebtoken';
import { HttpRequest } from '@azure/functions';

const JWT_SECRET = process.env.JWT_SECRET || 'pitchbox-dev-secret';
const JWT_EXPIRY = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  plan: 'free' | 'pro';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractToken(request: HttpRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticateRequest(request: HttpRequest): TokenPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}
