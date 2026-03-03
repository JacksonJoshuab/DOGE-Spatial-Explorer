// documents.ts
// DOGE Spatial Explorer — Document Management Routes
//
// REST API for creating, reading, updating, and deleting
// spatial documents. Supports privacy levels and versioning.

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const documentsRouter = Router();

// In-memory store (replace with database in production)
const documents = new Map<string, any>();

// List all documents for the authenticated user
documentsRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userDocs = Array.from(documents.values())
    .filter(doc => doc.ownerId === userId || doc.privacyLevel !== 'private')
    .map(doc => ({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      modifiedAt: doc.modifiedAt,
      collaboratorCount: doc.collaborators?.length || 0,
      privacyLevel: doc.privacyLevel,
    }));

  res.json(userDocs);
});

// Get a specific document
documentsRouter.get('/:id', async (req: Request, res: Response) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(doc);
});

// Create a new document
documentsRouter.post('/', async (req: Request, res: Response) => {
  const { name, description, privacyLevel } = req.body;
  const userId = (req as any).userId;

  const doc = {
    id: uuidv4(),
    name: name || 'Untitled',
    description: description || '',
    ownerId: userId,
    privacyLevel: privacyLevel || 'private',
    version: 1,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    rootNode: {
      id: uuidv4(),
      name: 'Root',
      type: 'group',
      transform: {
        positionX: 0, positionY: 0, positionZ: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scaleX: 1, scaleY: 1, scaleZ: 1,
      },
      children: [],
      isVisible: true,
      isLocked: false,
    },
    collaborators: [userId],
  };

  documents.set(doc.id, doc);
  res.status(201).json(doc);
});

// Update a document
documentsRouter.put('/:id', async (req: Request, res: Response) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  Object.assign(doc, req.body, {
    modifiedAt: new Date().toISOString(),
    version: doc.version + 1,
  });

  documents.set(req.params.id, doc);
  res.json(doc);
});

// Delete a document
documentsRouter.delete('/:id', async (req: Request, res: Response) => {
  if (!documents.has(req.params.id)) {
    return res.status(404).json({ error: 'Document not found' });
  }
  documents.delete(req.params.id);
  res.status(204).send();
});

// Push scene data from Blender or other clients
documentsRouter.post('/:id/push', async (req: Request, res: Response) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Merge incoming scene graph with existing document
  if (req.body.graph) {
    doc.rootNode = req.body.graph;
  }
  doc.modifiedAt = new Date().toISOString();
  doc.version += 1;

  documents.set(req.params.id, doc);
  res.json({ success: true, version: doc.version });
});

// Pull scene data for Blender or other clients
documentsRouter.get('/:id/pull', async (req: Request, res: Response) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(doc);
});
