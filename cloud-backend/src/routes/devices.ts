// devices.ts
// DOGE Spatial Explorer — Device Management Routes

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyJetsonRegistration } from '../providers/nvidiaEdge.js';

export const devicesRouter: Router = Router();

const devices = new Map<string, any>();

function getRouteParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// List registered devices
devicesRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userDevices = Array.from(devices.values())
    .filter(d => d.ownerId === userId);
  res.json(userDevices);
});

// Register a device
devicesRouter.post('/register', async (req: Request, res: Response) => {
  const { name, platform, deviceModel, deviceId, timestamp, signature } = req.body as {
    name?: string;
    platform?: string;
    deviceModel?: string;
    deviceId?: string;
    timestamp?: number;
    signature?: string;
  };
  const userId = (req as any).userId;

  const supportedPlatforms = ['apple_visionos', 'apple_ipados', 'apple_tvos', 'meta_quest', 'nvidia_jetson', 'web', 'blender'];
  if (!name || !platform || !supportedPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'A device name and supported platform are required' });
  }
  if (platform === 'meta_quest' && (req as any).provider !== 'meta') {
    return res.status(403).json({ error: 'Meta Quest devices require a verified Meta session' });
  }
  if (platform === 'nvidia_jetson') {
    if (!deviceId || typeof timestamp !== 'number' || !signature) {
      return res.status(400).json({ error: 'Jetson registration requires deviceId, timestamp, and signature' });
    }
    try {
      if (!verifyJetsonRegistration({ deviceId, timestamp, signature })) {
        return res.status(401).json({ error: 'Jetson device signature is invalid or expired' });
      }
    } catch (error) {
      console.warn(`[Devices] Jetson registration unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
      return res.status(503).json({ error: 'Jetson registration is not configured' });
    }
  }

  const device = {
    id: uuidv4(),
    name,
    platform,
    deviceModel: deviceModel ?? null,
    hardwareId: deviceId ?? null,
    ownerId: userId,
    status: 'online',
    lastSeen: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
  };

  devices.set(device.id, device);
  res.status(201).json(device);
});

// Send a command to a device
devicesRouter.post('/:id/command', async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const device = id ? devices.get(id) : undefined;
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const { command } = req.body;
  // In production, forward command via WebSocket to the device
  res.json({ success: true, command, deviceId: id });
});

// Update device status
devicesRouter.put('/:id/status', async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const device = id ? devices.get(id) : undefined;
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  device.status = req.body.status || device.status;
  device.lastSeen = new Date().toISOString();
  devices.set(id!, device);

  res.json(device);
});
