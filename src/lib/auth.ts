import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'qtrly-jwt-secret-change-in-production-2025';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

import { prisma } from './prisma';

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  let payload = token ? verifyToken(token) : null;

  if (payload) {
    const dbUser = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (dbUser) {
      return { userId: dbUser.id, email: dbUser.email, name: dbUser.name };
    }
  }

  return null;
}
