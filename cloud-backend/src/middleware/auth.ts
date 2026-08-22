// auth.ts
// DOGE Spatial Explorer — Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../providers/session.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifySession(token);
    (req as any).userId = decoded.userId;
    (req as any).email = decoded.email;
    (req as any).displayName = decoded.displayName;
    (req as any).provider = decoded.provider;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
