// collaboration.ts
// DOGE Spatial Explorer — WebSocket Collaboration Server
//
// Manages real-time collaboration sessions between visionOS,
// Meta Quest, Blender, and web clients. Handles:
// - Room-based document sessions
// - Operation broadcasting and conflict resolution
// - Participant presence tracking
// - Cursor position synchronization
// - Operation history for late joiners

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import type { Logger } from 'pino';

// ── Types ───────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  platform: string;
  deviceModel: string;
  ws: WebSocket;
  documentId: string;
  lastActivity: number;
  cursorPosition?: { x: number; y: number; z: number };
  selectedNodeIds: string[];
}

interface CollaborationRoom {
  documentId: string;
  participants: Map<string, Participant>;
  operationHistory: SyncOperation[];
  createdAt: number;
  lastActivity: number;
}

interface SyncOperation {
  id: string;
  type: string;
  documentId: string;
  senderId: string;
  timestamp: number;
  payload: string;
  metadata?: {
    platform: string;
    deviceModel: string;
    sdkVersion: string;
    coordinateSystem: string;
  };
}

interface WSMessage {
  type: string;
  payload: any;
}

// ── Collaboration WebSocket Server ──────────────────────────────────────

export class CollaborationWSServer {
  private rooms: Map<string, CollaborationRoom> = new Map();
  private participants: Map<string, Participant> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private logger: Logger;

  constructor(wss: WebSocketServer, logger: Logger) {
    this.logger = logger;

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000);

    this.logger.info('Collaboration WebSocket server initialized');
  }

  // ── Connection Handling ─────────────────────────────────────────────

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const documentId = url.searchParams.get('documentId') || '';
    const token = url.searchParams.get('token') ||
      req.headers.authorization?.replace('Bearer ', '') || '';

    // Authenticate
    let userId: string;
    let displayName: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      userId = decoded.userId;
      displayName = decoded.displayName || 'Anonymous';
    } catch {
      // Allow anonymous connections in development
      userId = `anon-${uuidv4().slice(0, 8)}`;
      displayName = 'Anonymous';
    }

    // Extract platform info from headers
    const platform = req.headers['x-platform'] as string || 'unknown';
    const deviceModel = req.headers['x-device-model'] as string || 'unknown';

    // Create participant
    const participant: Participant = {
      id: uuidv4(),
      userId,
      displayName,
      platform,
      deviceModel,
      ws,
      documentId,
      lastActivity: Date.now(),
      selectedNodeIds: [],
    };

    this.participants.set(participant.id, participant);

    // Join room
    this.joinRoom(participant, documentId);

    this.logger.info({
      participantId: participant.id,
      userId,
      platform,
      documentId,
    }, 'Participant connected');

    // Handle messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(participant, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(participant);
    });

    ws.on('error', (error) => {
      this.logger.error({ error, participantId: participant.id }, 'WebSocket error');
    });

    // Send welcome message with room state
    this.sendToParticipant(participant, {
      type: 'welcome',
      payload: {
        participantId: participant.id,
        roomParticipants: this.getRoomParticipantList(documentId),
        recentOperations: this.getRecentOperations(documentId, 100),
      },
    });
  }

  // ── Room Management ─────────────────────────────────────────────────

  private joinRoom(participant: Participant, documentId: string) {
    if (!this.rooms.has(documentId)) {
      this.rooms.set(documentId, {
        documentId,
        participants: new Map(),
        operationHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
    }

    const room = this.rooms.get(documentId)!;
    room.participants.set(participant.id, participant);
    room.lastActivity = Date.now();

    // Notify other participants
    this.broadcastToRoom(documentId, {
      type: 'participantJoined',
      payload: {
        action: 'joined',
        userId: participant.userId,
        displayName: participant.displayName,
        platform: participant.platform,
        avatarColor: this.getAvatarColor(participant.userId),
      },
    }, participant.id);
  }

  private leaveRoom(participant: Participant) {
    const room = this.rooms.get(participant.documentId);
    if (!room) return;

    room.participants.delete(participant.id);

    // Notify remaining participants
    this.broadcastToRoom(participant.documentId, {
      type: 'participantLeft',
      payload: {
        action: 'left',
        userId: participant.userId,
        displayName: participant.displayName,
        platform: participant.platform,
      },
    });

    // Clean up empty rooms
    if (room.participants.size === 0) {
      // Keep room for a while for reconnection
      setTimeout(() => {
        const currentRoom = this.rooms.get(participant.documentId);
        if (currentRoom && currentRoom.participants.size === 0) {
          this.rooms.delete(participant.documentId);
          this.logger.info({ documentId: participant.documentId }, 'Room cleaned up');
        }
      }, 300000); // 5 minutes
    }
  }

  // ── Message Handling ────────────────────────────────────────────────

  private handleMessage(participant: Participant, data: Buffer) {
    try {
      const message: SyncOperation = JSON.parse(data.toString());
      participant.lastActivity = Date.now();

      switch (message.type) {
        case 'heartbeat':
          // Just update lastActivity
          break;

        case 'cursorUpdate':
          // Broadcast cursor position to other participants
          this.broadcastToRoom(participant.documentId, {
            type: 'cursorUpdate',
            payload: message.payload,
          }, participant.id);
          break;

        case 'nodeAdded':
        case 'nodeRemoved':
        case 'nodeTransformed':
        case 'nodePropertyChanged':
          // Store in history and broadcast
          this.storeOperation(participant.documentId, {
            ...message,
            senderId: participant.userId,
            timestamp: Date.now(),
          });
          this.broadcastToRoom(participant.documentId, {
            type: message.type,
            payload: message,
          }, participant.id);
          break;

        case 'documentSaved':
          this.broadcastToRoom(participant.documentId, {
            type: 'documentSaved',
            payload: message,
          }, participant.id);
          break;

        case 'fullSync':
          // Send full operation history to the requesting participant
          this.sendToParticipant(participant, {
            type: 'fullSyncResponse',
            payload: {
              operations: this.getRecentOperations(participant.documentId, 1000),
            },
          });
          break;

        default:
          this.logger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to handle WebSocket message');
    }
  }

  // ── Broadcasting ────────────────────────────────────────────────────

  private broadcastToRoom(documentId: string, message: WSMessage, excludeId?: string) {
    const room = this.rooms.get(documentId);
    if (!room) return;

    const data = JSON.stringify(message);

    for (const [id, participant] of room.participants) {
      if (id === excludeId) continue;
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(data);
      }
    }
  }

  private sendToParticipant(participant: Participant, message: WSMessage) {
    if (participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(JSON.stringify(message));
    }
  }

  // ── Operation History ───────────────────────────────────────────────

  private storeOperation(documentId: string, operation: SyncOperation) {
    const room = this.rooms.get(documentId);
    if (!room) return;

    room.operationHistory.push(operation);
    room.lastActivity = Date.now();

    // Keep only the last 10,000 operations in memory
    if (room.operationHistory.length > 10000) {
      room.operationHistory = room.operationHistory.slice(-5000);
    }
  }

  private getRecentOperations(documentId: string, count: number): SyncOperation[] {
    const room = this.rooms.get(documentId);
    if (!room) return [];
    return room.operationHistory.slice(-count);
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private getRoomParticipantList(documentId: string) {
    const room = this.rooms.get(documentId);
    if (!room) return [];

    return Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      displayName: p.displayName,
      platform: p.platform,
      avatarColor: this.getAvatarColor(p.userId),
    }));
  }

  private getAvatarColor(userId: string): string {
    const colors = [
      '#4A90D9', '#E74C3C', '#2ECC71', '#F39C12',
      '#9B59B6', '#1ABC9C', '#E67E22', '#3498DB',
    ];
    let hash = 0;
    for (const char of userId) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private handleDisconnect(participant: Participant) {
    this.leaveRoom(participant);
    this.participants.delete(participant.id);
    this.logger.info({
      participantId: participant.id,
      userId: participant.userId,
    }, 'Participant disconnected');
  }

  private checkHeartbeats() {
    const timeout = 60000; // 60 seconds
    const now = Date.now();

    for (const [id, participant] of this.participants) {
      if (now - participant.lastActivity > timeout) {
        this.logger.warn({ participantId: id }, 'Participant timed out');
        participant.ws.terminate();
        this.handleDisconnect(participant);
      }
    }
  }

  // ── Public API ──────────────────────────────────────────────────────

  getStats() {
    return {
      rooms: this.rooms.size,
      participants: this.participants.size,
      totalOperations: Array.from(this.rooms.values())
        .reduce((sum, room) => sum + room.operationHistory.length, 0),
    };
  }

  shutdown() {
    clearInterval(this.heartbeatInterval);
    for (const [, participant] of this.participants) {
      participant.ws.close(1001, 'Server shutting down');
    }
    this.rooms.clear();
    this.participants.clear();
  }
}
