// assets.ts
// DOGE Spatial Explorer — Asset Management Routes

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const assetsRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/doge-spatial-assets';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      '.usdz', '.usdc', '.usd', '.glb', '.gltf', '.fbx', '.obj',
      '.png', '.jpg', '.jpeg', '.hdr', '.exr',
      '.mp3', '.wav', '.aac',
      '.json', '.csv',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});

// Upload an asset
assetsRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const asset = {
    id: uuidv4(),
    url: `/assets/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    checksum: '', // In production, compute SHA-256
    uploadedAt: new Date().toISOString(),
    uploadedBy: (req as any).userId,
  };

  res.json(asset);
});

// List assets for a document
assetsRouter.get('/document/:documentId', async (req: Request, res: Response) => {
  // In production, query database for assets linked to the document
  res.json([]);
});

// Download an asset
assetsRouter.get('/:filename', async (req: Request, res: Response) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.sendFile(filePath);
});

// Delete an asset
assetsRouter.delete('/:id', async (req: Request, res: Response) => {
  // In production, delete from storage and database
  res.status(204).send();
});
