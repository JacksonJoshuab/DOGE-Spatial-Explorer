/**
 * DOGE Spatial Editor — CRDT (Conflict-Free Replicated Data Types)
 * 
 * Implements a hybrid CRDT system for real-time collaborative spatial editing.
 * Combines:
 * - LWW-Register (Last-Writer-Wins) for scalar properties (position, color, etc.)
 * - OR-Set (Observed-Remove Set) for collections (children, materials)
 * - Causal tree for operation ordering
 * 
 * Used across all platforms for conflict resolution.
 */

import type {
  Operation,
  OperationType,
  SceneNode,
  SceneDocument,
  Vector3,
  Quaternion,
  Transform,
  ConflictResolution,
} from "./spatial-protocol";

// ─── Vector Clock ────────────────────────────────────────────────────────────

export class VectorClock {
  private clock: Map<string, number>;

  constructor(initial?: Record<string, number>) {
    this.clock = new Map(Object.entries(initial || {}));
  }

  increment(nodeId: string): void {
    const current = this.clock.get(nodeId) || 0;
    this.clock.set(nodeId, current + 1);
  }

  get(nodeId: string): number {
    return this.clock.get(nodeId) || 0;
  }

  merge(other: VectorClock): VectorClock {
    const merged = new VectorClock();
    const allKeys = new Set([...this.clock.keys(), ...other.clock.keys()]);
    for (const key of allKeys) {
      merged.clock.set(key, Math.max(this.get(key), other.get(key)));
    }
    return merged;
  }

  happensBefore(other: VectorClock): boolean {
    let atLeastOneLess = false;
    const allKeys = new Set([...this.clock.keys(), ...other.clock.keys()]);
    for (const key of allKeys) {
      if (this.get(key) > other.get(key)) return false;
      if (this.get(key) < other.get(key)) atLeastOneLess = true;
    }
    return atLeastOneLess;
  }

  isConcurrent(other: VectorClock): boolean {
    return !this.happensBefore(other) && !other.happensBefore(this);
  }

  toJSON(): Record<string, number> {
    return Object.fromEntries(this.clock);
  }

  static fromJSON(json: Record<string, number>): VectorClock {
    return new VectorClock(json);
  }
}

// ─── LWW Register ────────────────────────────────────────────────────────────

export class LWWRegister<T> {
  private value: T;
  private timestamp: number;
  private authorId: string;

  constructor(initialValue: T, timestamp: number = 0, authorId: string = "") {
    this.value = initialValue;
    this.timestamp = timestamp;
    this.authorId = authorId;
  }

  set(newValue: T, timestamp: number, authorId: string): boolean {
    if (timestamp > this.timestamp || 
        (timestamp === this.timestamp && authorId > this.authorId)) {
      this.value = newValue;
      this.timestamp = timestamp;
      this.authorId = authorId;
      return true;
    }
    return false;
  }

  get(): T {
    return this.value;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  merge(other: LWWRegister<T>): LWWRegister<T> {
    if (other.timestamp > this.timestamp ||
        (other.timestamp === this.timestamp && other.authorId > this.authorId)) {
      return new LWWRegister(other.value, other.timestamp, other.authorId);
    }
    return new LWWRegister(this.value, this.timestamp, this.authorId);
  }
}

// ─── OR-Set (Observed-Remove Set) ────────────────────────────────────────────

export class ORSet<T> {
  private elements: Map<string, { value: T; addTag: string; removed: boolean }>;
  private tagCounter: number;
  private nodeId: string;

  constructor(nodeId: string) {
    this.elements = new Map();
    this.tagCounter = 0;
    this.nodeId = nodeId;
  }

  add(value: T): string {
    const tag = `${this.nodeId}_${++this.tagCounter}`;
    this.elements.set(tag, { value, addTag: tag, removed: false });
    return tag;
  }

  remove(value: T): string[] {
    const removedTags: string[] = [];
    for (const [tag, elem] of this.elements) {
      if (elem.value === value && !elem.removed) {
        elem.removed = true;
        removedTags.push(tag);
      }
    }
    return removedTags;
  }

  has(value: T): boolean {
    for (const elem of this.elements.values()) {
      if (elem.value === value && !elem.removed) return true;
    }
    return false;
  }

  values(): T[] {
    const result: T[] = [];
    for (const elem of this.elements.values()) {
      if (!elem.removed) result.push(elem.value);
    }
    return result;
  }

  merge(other: ORSet<T>): ORSet<T> {
    const merged = new ORSet<T>(this.nodeId);
    
    // Add all elements from both sets
    for (const [tag, elem] of this.elements) {
      merged.elements.set(tag, { ...elem });
    }
    for (const [tag, elem] of other.elements) {
      if (!merged.elements.has(tag)) {
        merged.elements.set(tag, { ...elem });
      } else {
        // If removed in either, mark as removed
        const existing = merged.elements.get(tag)!;
        if (elem.removed) existing.removed = true;
      }
    }
    
    return merged;
  }
}

// ─── CRDT Document ───────────────────────────────────────────────────────────

export class CRDTDocument {
  private documentId: string;
  private vectorClock: VectorClock;
  private lamportTimestamp: number;
  private nodes: Map<string, CRDTNode>;
  private operationLog: Operation[];
  private tombstones: Set<string>;
  private localAuthorId: string;

  constructor(documentId: string, authorId: string) {
    this.documentId = documentId;
    this.localAuthorId = authorId;
    this.vectorClock = new VectorClock();
    this.lamportTimestamp = 0;
    this.nodes = new Map();
    this.operationLog = [];
    this.tombstones = new Set();
  }

  // ── Node Operations ──────────────────────────────────────────────────────

  createNode(node: SceneNode): Operation {
    this.lamportTimestamp++;
    this.vectorClock.increment(this.localAuthorId);

    const crdtNode = new CRDTNode(node, this.lamportTimestamp, this.localAuthorId);
    this.nodes.set(node.id, crdtNode);

    const operation: Operation = {
      id: this.generateOperationId(),
      type: "node_create",
      documentId: this.documentId,
      nodeId: node.id,
      authorId: this.localAuthorId,
      authorPlatform: "web",
      timestamp: this.lamportTimestamp,
      payload: { node },
      parentOperationId: this.getLastOperationId(),
      vectorClock: this.vectorClock.toJSON(),
    };

    this.operationLog.push(operation);
    return operation;
  }

  deleteNode(nodeId: string): Operation {
    this.lamportTimestamp++;
    this.vectorClock.increment(this.localAuthorId);

    this.tombstones.add(nodeId);

    const operation: Operation = {
      id: this.generateOperationId(),
      type: "node_delete",
      documentId: this.documentId,
      nodeId,
      authorId: this.localAuthorId,
      authorPlatform: "web",
      timestamp: this.lamportTimestamp,
      payload: {},
      parentOperationId: this.getLastOperationId(),
      vectorClock: this.vectorClock.toJSON(),
    };

    this.operationLog.push(operation);
    return operation;
  }

  updateTransform(nodeId: string, transform: Partial<Transform>): Operation {
    this.lamportTimestamp++;
    this.vectorClock.increment(this.localAuthorId);

    const node = this.nodes.get(nodeId);
    if (node) {
      if (transform.position) {
        node.position.set(transform.position, this.lamportTimestamp, this.localAuthorId);
      }
      if (transform.rotation) {
        node.rotation.set(transform.rotation, this.lamportTimestamp, this.localAuthorId);
      }
      if (transform.scale) {
        node.scale.set(transform.scale, this.lamportTimestamp, this.localAuthorId);
      }
    }

    const operation: Operation = {
      id: this.generateOperationId(),
      type: "transform_update",
      documentId: this.documentId,
      nodeId,
      authorId: this.localAuthorId,
      authorPlatform: "web",
      timestamp: this.lamportTimestamp,
      payload: { transform },
      parentOperationId: this.getLastOperationId(),
      vectorClock: this.vectorClock.toJSON(),
    };

    this.operationLog.push(operation);
    return operation;
  }

  updateMaterial(nodeId: string, materialId: string, properties: Record<string, unknown>): Operation {
    this.lamportTimestamp++;
    this.vectorClock.increment(this.localAuthorId);

    const operation: Operation = {
      id: this.generateOperationId(),
      type: "material_update",
      documentId: this.documentId,
      nodeId,
      authorId: this.localAuthorId,
      authorPlatform: "web",
      timestamp: this.lamportTimestamp,
      payload: { materialId, properties },
      parentOperationId: this.getLastOperationId(),
      vectorClock: this.vectorClock.toJSON(),
    };

    this.operationLog.push(operation);
    return operation;
  }

  // ── Remote Operation Application ─────────────────────────────────────────

  applyRemoteOperation(operation: Operation): ConflictResolution | null {
    const remoteClock = VectorClock.fromJSON(operation.vectorClock);

    // Update vector clock
    this.vectorClock = this.vectorClock.merge(remoteClock);
    this.lamportTimestamp = Math.max(this.lamportTimestamp, operation.timestamp) + 1;

    // Check for conflicts
    const conflict = this.detectConflict(operation);
    if (conflict) {
      return this.resolveConflict(conflict.localOp, operation);
    }

    // Apply operation
    this.applyOperation(operation);
    this.operationLog.push(operation);

    return null;
  }

  private applyOperation(operation: Operation): void {
    switch (operation.type) {
      case "node_create": {
        const nodeData = operation.payload.node as SceneNode;
        const crdtNode = new CRDTNode(nodeData, operation.timestamp, operation.authorId);
        this.nodes.set(nodeData.id, crdtNode);
        break;
      }
      case "node_delete": {
        if (operation.nodeId) {
          this.tombstones.add(operation.nodeId);
        }
        break;
      }
      case "transform_update": {
        if (operation.nodeId) {
          const node = this.nodes.get(operation.nodeId);
          if (node) {
            const transform = operation.payload.transform as Partial<Transform>;
            if (transform.position) {
              node.position.set(transform.position, operation.timestamp, operation.authorId);
            }
            if (transform.rotation) {
              node.rotation.set(transform.rotation, operation.timestamp, operation.authorId);
            }
            if (transform.scale) {
              node.scale.set(transform.scale, operation.timestamp, operation.authorId);
            }
          }
        }
        break;
      }
      case "material_update": {
        // Material updates are LWW by timestamp
        break;
      }
      case "visibility_toggle": {
        if (operation.nodeId) {
          const node = this.nodes.get(operation.nodeId);
          if (node) {
            const hidden = operation.payload.hidden as boolean;
            node.visible.set(!hidden, operation.timestamp, operation.authorId);
          }
        }
        break;
      }
    }
  }

  // ── Conflict Detection & Resolution ──────────────────────────────────────

  private detectConflict(remoteOp: Operation): { localOp: Operation } | null {
    // Find concurrent local operations on the same node
    for (let i = this.operationLog.length - 1; i >= 0; i--) {
      const localOp = this.operationLog[i];
      if (localOp.nodeId === remoteOp.nodeId &&
          localOp.type === remoteOp.type &&
          localOp.authorId !== remoteOp.authorId) {
        const localClock = VectorClock.fromJSON(localOp.vectorClock);
        const remoteClock = VectorClock.fromJSON(remoteOp.vectorClock);
        if (localClock.isConcurrent(remoteClock)) {
          return { localOp };
        }
      }
    }
    return null;
  }

  private resolveConflict(localOp: Operation, remoteOp: Operation): ConflictResolution {
    // LWW resolution: higher timestamp wins, tie-break by author ID
    if (remoteOp.timestamp > localOp.timestamp ||
        (remoteOp.timestamp === localOp.timestamp && remoteOp.authorId > localOp.authorId)) {
      // Remote wins
      this.applyOperation(remoteOp);
      return {
        operationA: localOp,
        operationB: remoteOp,
        resolution: "accept_b",
      };
    } else {
      // Local wins
      return {
        operationA: localOp,
        operationB: remoteOp,
        resolution: "accept_a",
      };
    }
  }

  // ── Snapshot & Restore ───────────────────────────────────────────────────

  snapshot(): SceneDocument {
    const nodes: Record<string, SceneNode> = {};
    for (const [id, crdtNode] of this.nodes) {
      if (!this.tombstones.has(id)) {
        nodes[id] = crdtNode.toSceneNode();
      }
    }

    return {
      id: this.documentId,
      name: "CRDT Document",
      version: this.lamportTimestamp,
      protocolVersion: "2.0.0",
      coordinateSystem: "y_up_right",
      rootNodeId: "root",
      nodes,
      materials: {},
      environment: {
        skybox: null,
        ambientLight: { color: [1, 1, 1], intensity: 0.5 },
        fog: null,
        postProcessing: {
          bloom: false,
          bloomIntensity: 0,
          ssao: false,
          ssaoRadius: 0,
          toneMappingExposure: 1,
        },
      },
      privacyZones: {},
      metadata: {
        author: this.localAuthorId,
        description: "",
        tags: [],
        thumbnail: null,
        fileSize: 0,
        polyCount: 0,
        textureMemory: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  getOperationsSince(version: number): Operation[] {
    return this.operationLog.filter(op => op.timestamp > version);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateOperationId(): string {
    return `${this.localAuthorId}_${this.lamportTimestamp}_${Date.now()}`;
  }

  private getLastOperationId(): string | null {
    if (this.operationLog.length === 0) return null;
    return this.operationLog[this.operationLog.length - 1].id;
  }
}

// ─── CRDT Node ───────────────────────────────────────────────────────────────

class CRDTNode {
  id: string;
  name: LWWRegister<string>;
  type: string;
  position: LWWRegister<Vector3>;
  rotation: LWWRegister<Quaternion>;
  scale: LWWRegister<Vector3>;
  visible: LWWRegister<boolean>;
  locked: LWWRegister<boolean>;
  lockedBy: LWWRegister<string | null>;
  parentId: LWWRegister<string | null>;
  children: ORSet<string>;
  materials: ORSet<string>;

  constructor(node: SceneNode, timestamp: number, authorId: string) {
    this.id = node.id;
    this.name = new LWWRegister(node.name, timestamp, authorId);
    this.type = node.type;
    this.position = new LWWRegister(node.transform.position, timestamp, authorId);
    this.rotation = new LWWRegister(node.transform.rotation, timestamp, authorId);
    this.scale = new LWWRegister(node.transform.scale, timestamp, authorId);
    this.visible = new LWWRegister(node.visible, timestamp, authorId);
    this.locked = new LWWRegister(node.locked, timestamp, authorId);
    this.lockedBy = new LWWRegister(node.lockedBy, timestamp, authorId);
    this.parentId = new LWWRegister(node.parentId, timestamp, authorId);
    this.children = new ORSet(node.id);
    this.materials = new ORSet(node.id);

    for (const childId of node.childIds) {
      this.children.add(childId);
    }
    for (const matId of node.materials) {
      this.materials.add(matId);
    }
  }

  toSceneNode(): SceneNode {
    return {
      id: this.id,
      name: this.name.get(),
      type: this.type as any,
      transform: {
        position: this.position.get(),
        rotation: this.rotation.get(),
        scale: this.scale.get(),
      },
      parentId: this.parentId.get(),
      childIds: this.children.values(),
      visible: this.visible.get(),
      locked: this.locked.get(),
      lockedBy: this.lockedBy.get(),
      materials: this.materials.values(),
      metadata: {},
      privacyZoneId: null,
      createdAt: 0,
      updatedAt: this.position.getTimestamp(),
      createdBy: "",
      updatedBy: "",
    };
  }
}
