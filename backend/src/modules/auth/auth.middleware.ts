// File: backend/src/modules/auth/auth.middleware.ts
// JWT authentication and role-based authorization middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from './auth.service';
import { Role, normalizeRole } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });
    const normalizedRole = normalizeRole(user.role) || user.role;
    (req as any).user = { id: user.id, role: normalizedRole, email: user.email };
    // authentication successful
    next();
  } catch (err) {
    console.error('authenticateJWT error', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// middleware factory to authorize by allowed roles
export function authorizeRoles(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowed.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}
