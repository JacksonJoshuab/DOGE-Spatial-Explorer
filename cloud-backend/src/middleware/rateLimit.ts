// rateLimit.ts
// DOGE Spatial Explorer — Rate Limiting Middleware

import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 200; // per window

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();

  let entry = requestCounts.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    requestCounts.set(key, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', entry.resetAt.toString());

  next();
}
