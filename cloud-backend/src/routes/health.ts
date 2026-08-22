// health.ts
// DOGE Spatial Explorer — Health Check Route

import { Router, Request, Response } from 'express';
import { getAiProviderStatuses } from '../providers/ai.js';

export const healthRouter: Router = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'doge-spatial-cloud-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Configuration-only posture endpoint for operations dashboards. No credentials are exposed.
healthRouter.get('/providers', (_req: Request, res: Response) => {
  res.json({
    authentication: {
      apple: Boolean(process.env.APPLE_CLIENT_ID),
      microsoft: Boolean(process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID),
      metaQuest: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    },
    ai: getAiProviderStatuses(),
    edge: {
      nvidiaJetson: Boolean(process.env.NVIDIA_JETSON_SHARED_SECRET),
    },
  });
});
