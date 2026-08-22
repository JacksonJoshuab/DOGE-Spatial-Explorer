// DOGE Spatial Explorer — Device Management Routes

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyJetsonRegistration, verifyJetsonTelemetry, type JetsonTelemetryEnvelope } from '../providers/nvidiaEdge.js';

export const devicesRouter: Router = Router();
const devices = new Map<string, any>();
const supportedPlatforms = ['apple_visionos', 'apple_ipados', 'apple_tvos', 'meta_quest', 'nvidia_jetson', 'web', 'blender'];
const TELEMETRY_HISTORY_LIMIT = 100;

function getRouteParam(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

function deviceForOwner(id: string | undefined, userId: string): any | undefined {
  const device = id ? devices.get(id) : undefined;
  return device?.ownerId === userId ? device : undefined;
}

function normalizedCapabilities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 64))).slice(0, 32);
}

function normalizedAttestation(value: unknown): Record<string, string | number | boolean> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowed = ['sessionId', 'issuedAt', 'runtimeVersion', 'verification'];
  const result: Record<string, string | number | boolean> = {};
  for (const key of allowed) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === 'string' && candidate.length <= 256) result[key] = candidate;
    if (typeof candidate === 'number' && Number.isSafeInteger(candidate)) result[key] = candidate;
    if (typeof candidate === 'boolean') result[key] = candidate;
  }
  return Object.keys(result).length > 0 ? result : null;
}

devicesRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  return res.json(Array.from(devices.values()).filter((device) => device.ownerId === userId));
});

// Capability and attestation metadata is accepted only for authenticated, provider-matched sessions.
devicesRouter.post('/register', async (req: Request, res: Response) => {
  const { name, platform, deviceModel, deviceId, timestamp, signature, capabilities, sessionAttestation } = req.body as {
    name?: string; platform?: string; deviceModel?: string; deviceId?: string; timestamp?: number; signature?: string;
    capabilities?: unknown; sessionAttestation?: unknown;
  };
  const userId = (req as any).userId;
  if (!name || !platform || !supportedPlatforms.includes(platform)) return res.status(400).json({ error: 'A device name and supported platform are required' });
  if (platform === 'meta_quest' && (req as any).provider !== 'meta') return res.status(403).json({ error: 'Meta Quest devices require a verified Meta session' });
  if (platform === 'nvidia_jetson') {
    if (!deviceId || typeof timestamp !== 'number' || !signature) return res.status(400).json({ error: 'Jetson registration requires deviceId, timestamp, and signature' });
    try {
      if (!verifyJetsonRegistration({ deviceId, timestamp, signature })) return res.status(401).json({ error: 'Jetson device signature is invalid or expired' });
    } catch (error) {
      console.warn(`[Devices] Jetson registration unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
      return res.status(503).json({ error: 'Jetson registration is not configured' });
    }
  }

  const device = {
    id: uuidv4(), name, platform, deviceModel: deviceModel ?? null, hardwareId: deviceId ?? null, ownerId: userId,
    capabilities: normalizedCapabilities(capabilities), sessionAttestation: platform === 'meta_quest' ? normalizedAttestation(sessionAttestation) : null,
    telemetry: [], status: 'online', lastSeen: new Date().toISOString(), registeredAt: new Date().toISOString(),
  };
  devices.set(device.id, device);
  return res.status(201).json(device);
});

devicesRouter.post('/:id/telemetry/jetson', async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const userId = (req as any).userId;
  const device = deviceForOwner(id, userId);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.platform !== 'nvidia_jetson') return res.status(400).json({ error: 'Telemetry endpoint is limited to NVIDIA Jetson devices' });
  const envelope = req.body as JetsonTelemetryEnvelope;
  if (!envelope?.payload || typeof envelope.payload !== 'object' || Array.isArray(envelope.payload) || envelope.deviceId !== device.hardwareId) {
    return res.status(400).json({ error: 'Valid signed telemetry for the registered hardware ID is required' });
  }
  try {
    if (!verifyJetsonTelemetry(envelope)) return res.status(401).json({ error: 'Jetson telemetry signature is invalid, expired, or replayed' });
  } catch (error) {
    console.warn(`[Devices] Jetson telemetry unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
    return res.status(503).json({ error: 'Jetson telemetry is not configured' });
  }
  const event = { id: uuidv4(), timestamp: envelope.timestamp, receivedAt: new Date().toISOString(), payload: envelope.payload };
  device.telemetry = [event, ...(device.telemetry ?? [])].slice(0, TELEMETRY_HISTORY_LIMIT);
  device.lastSeen = event.receivedAt;
  devices.set(device.id, device);
  return res.status(202).json({ accepted: true, eventId: event.id, retainedEvents: device.telemetry.length });
});

devicesRouter.get('/:id/telemetry', async (req: Request, res: Response) => {
  const device = deviceForOwner(getRouteParam(req.params.id), (req as any).userId);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 25, TELEMETRY_HISTORY_LIMIT));
  return res.json({ deviceId: device.id, events: (device.telemetry ?? []).slice(0, limit) });
});

devicesRouter.post('/:id/command', async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const device = deviceForOwner(id, (req as any).userId);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  return res.json({ success: true, command: req.body.command, deviceId: id });
});

devicesRouter.put('/:id/status', async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const device = deviceForOwner(id, (req as any).userId);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  device.status = req.body.status || device.status;
  device.lastSeen = new Date().toISOString();
  devices.set(id!, device);
  return res.json(device);
});
