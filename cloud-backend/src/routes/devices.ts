// devices.ts
// DOGE Spatial Explorer — Device Management Routes

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const devicesRouter = Router();

const devices = new Map<string, any>();

// List registered devices
devicesRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userDevices = Array.from(devices.values())
    .filter(d => d.ownerId === userId);
  res.json(userDevices);
});

// Register a device
devicesRouter.post('/register', async (req: Request, res: Response) => {
  const { name, platform, deviceModel } = req.body;
  const userId = (req as any).userId;

  const device = {
    id: uuidv4(),
    name,
    platform,
    deviceModel,
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
  const device = devices.get(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const { command } = req.body;
  // In production, forward command via WebSocket to the device
  res.json({ success: true, command, deviceId: req.params.id });
});

// Update device status
devicesRouter.put('/:id/status', async (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  device.status = req.body.status || device.status;
  device.lastSeen = new Date().toISOString();
  devices.set(req.params.id, device);

  res.json(device);
});
