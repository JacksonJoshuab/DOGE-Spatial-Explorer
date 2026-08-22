// DOGE Spatial Explorer — Mock Data & API Simulation
// Provides in-memory CRUD operations with realistic latency simulation

import type { Item, ItemStatus, PagedResponse, User, Session, ApiError } from "./types";

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: "u1",
  email: "analyst@doge.gov",
  name: "Demo Analyst",
  roles: ["member"],
  permissions: ["items:read", "items:write"],
};

export const MOCK_SESSION: Session = {
  accessToken: "demo-token-xyz",
  expiresAt: "2026-12-31T23:59:59Z",
};

const seedItems: Item[] = [
  {
    id: "i1",
    name: "Federal Contract Review — DOD Q1",
    status: "active",
    createdAt: "2026-03-01T12:00:00Z",
    updatedAt: "2026-03-10T12:00:00Z",
    ownerId: "u1",
  },
  {
    id: "i2",
    name: "SAM.gov Vendor Audit Trail",
    status: "draft",
    createdAt: "2026-03-15T12:00:00Z",
    updatedAt: "2026-03-15T12:00:00Z",
    ownerId: "u1",
  },
  {
    id: "i3",
    name: "FPDS Procurement Analysis — FY2025",
    status: "active",
    createdAt: "2026-02-20T09:30:00Z",
    updatedAt: "2026-03-18T14:22:00Z",
    ownerId: "u1",
  },
  {
    id: "i4",
    name: "Grants.gov Opportunity Tracker",
    status: "archived",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-02-28T16:45:00Z",
    ownerId: "u1",
  },
  {
    id: "i5",
    name: "Geospatial Shipping Lane Monitor",
    status: "active",
    createdAt: "2026-03-22T11:15:00Z",
    updatedAt: "2026-03-30T09:00:00Z",
    ownerId: "u1",
  },
  {
    id: "i6",
    name: "NOAA Weather Impact Assessment",
    status: "draft",
    createdAt: "2026-03-28T15:30:00Z",
    updatedAt: "2026-03-28T15:30:00Z",
    ownerId: "u1",
  },
  {
    id: "i7",
    name: "Coast Guard AIS Vessel Tracking",
    status: "active",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-25T13:20:00Z",
    ownerId: "u1",
  },
  {
    id: "i8",
    name: "Supply Chain Rail Capacity Report",
    status: "archived",
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-02-10T11:30:00Z",
    ownerId: "u1",
  },
  {
    id: "i9",
    name: "USDA Commodity Futures Intelligence",
    status: "draft",
    createdAt: "2026-03-31T08:45:00Z",
    updatedAt: "2026-03-31T08:45:00Z",
    ownerId: "u1",
  },
  {
    id: "i10",
    name: "Executive Order Compliance Tracker",
    status: "active",
    createdAt: "2026-03-12T14:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    ownerId: "u1",
  },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

let itemStore: Item[] = [...seedItems];
let nextId = 11;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeError(code: string, message: string): ApiError {
  return { code, message, requestId: `req-${Date.now()}` };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<{ user: User; session: Session }> {
  await delay(600);
  if (email === "analyst@doge.gov" && password === "demo1234") {
    return { user: MOCK_USER, session: MOCK_SESSION };
  }
  throw makeError("AUTH_INVALID", "Invalid email or password.");
}

export async function apiLogout(): Promise<void> {
  await delay(300);
}

export async function apiGetMe(): Promise<{ user: User; permissions: string[] }> {
  await delay(200);
  return { user: MOCK_USER, permissions: MOCK_USER.permissions ?? [] };
}

// ─── Items API ────────────────────────────────────────────────────────────────

export async function apiGetItems(params: {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ItemStatus | "";
}): Promise<PagedResponse<Item>> {
  await delay(400);
  const { page = 1, pageSize = 10, query = "", status = "" } = params;

  let filtered = itemStore;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
  }
  if (status) {
    filtered = filtered.filter((i) => i.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, page, pageSize, total };
}

export async function apiGetItem(id: string): Promise<Item> {
  await delay(300);
  const item = itemStore.find((i) => i.id === id);
  if (!item) throw makeError("NOT_FOUND", `Item ${id} not found.`);
  return item;
}

export async function apiCreateItem(payload: { name: string; status: ItemStatus }): Promise<Item> {
  await delay(500);
  if (!payload.name.trim()) throw makeError("VALIDATION", "Name is required.");
  const now = new Date().toISOString();
  const item: Item = {
    id: `i${nextId++}`,
    name: payload.name.trim(),
    status: payload.status,
    createdAt: now,
    updatedAt: now,
    ownerId: "u1",
  };
  itemStore = [item, ...itemStore];
  return item;
}

export async function apiUpdateItem(id: string, payload: Partial<Pick<Item, "name" | "status">>): Promise<Item> {
  await delay(500);
  const idx = itemStore.findIndex((i) => i.id === id);
  if (idx === -1) throw makeError("NOT_FOUND", `Item ${id} not found.`);
  const updated: Item = {
    ...itemStore[idx],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  itemStore = itemStore.map((i) => (i.id === id ? updated : i));
  return updated;
}

export async function apiDeleteItem(id: string): Promise<void> {
  await delay(400);
  const exists = itemStore.some((i) => i.id === id);
  if (!exists) throw makeError("NOT_FOUND", `Item ${id} not found.`);
  itemStore = itemStore.filter((i) => i.id !== id);
}
