// health.ts
// DOGE Spatial Explorer — Health Check Route

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'doge-spatial-cloud-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
