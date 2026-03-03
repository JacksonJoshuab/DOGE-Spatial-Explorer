// server.ts
// DOGE Spatial Explorer — Cloud Backend Server
//
// Express + WebSocket server providing:
// - REST API for document and asset management
// - WebSocket for real-time collaboration
// - Authentication and authorization
// - AI service proxy (text-to-3D, text-to-texture, etc.)
// - Rate limiting and security middleware

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { WebSocketServer } from 'ws';

import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { assetsRouter } from './routes/assets.js';
import { aiRouter } from './routes/ai.js';
import { devicesRouter } from './routes/devices.js';
import { healthRouter } from './routes/health.js';
import { CollaborationWSServer } from './websocket/collaboration.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimit.js';

// ── Logger ──────────────────────────────────────────────────────────────

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// ── Express App ─────────────────────────────────────────────────────────

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Request');
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────

// Public routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/documents', authMiddleware, documentsRouter);
app.use('/api/assets', authMiddleware, assetsRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/devices', authMiddleware, devicesRouter);

// ── WebSocket Server ────────────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: '/ws' });
const collaborationServer = new CollaborationWSServer(wss, logger);

// ── Start Server ────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`DOGE Spatial Cloud Backend running on port ${PORT}`);
  logger.info(`WebSocket server ready on ws://0.0.0.0:${PORT}/ws`);
  logger.info(`REST API ready on http://0.0.0.0:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  collaborationServer.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server };
