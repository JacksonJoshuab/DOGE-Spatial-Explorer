import { and, count, desc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { AuditLog, InsertAuditLog, InsertItem, InsertUser, Item, auditLog, items, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Items CRUD ───────────────────────────────────────────────────────────────

export async function getItems(opts: {
  page: number;
  pageSize: number;
  query?: string;
  status?: "draft" | "active" | "archived" | "";
}): Promise<{ data: Item[]; total: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { page, pageSize, query = "", status = "" } = opts;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (query) conditions.push(like(items.name, `%${query}%`));
  if (status) conditions.push(eq(items.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db.select().from(items).where(where).limit(pageSize).offset(offset).orderBy(items.updatedAt),
    db.select({ count: count() }).from(items).where(where),
  ]);

  // Reverse to show newest first
  return { data: rows.reverse(), total: totalRows[0]?.count ?? 0 };
}

export async function getItemBySlug(slug: string): Promise<Item | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(items).where(eq(items.slug, slug)).limit(1);
  return result[0];
}

export async function createItem(payload: {
  name: string;
  status: "draft" | "active" | "archived";
  ownerId: string;
}): Promise<Item> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a unique slug
  const slug = `i${Date.now()}`;
  await db.insert(items).values({ ...payload, slug });

  const created = await db.select().from(items).where(eq(items.slug, slug)).limit(1);
  if (!created[0]) throw new Error("Failed to create item");
  return created[0];
}

export async function updateItem(
  slug: string,
  payload: Partial<{ name: string; status: "draft" | "active" | "archived" }>
): Promise<Item> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(items).set(payload).where(eq(items.slug, slug));

  const updated = await db.select().from(items).where(eq(items.slug, slug)).limit(1);
  if (!updated[0]) throw new Error("Item not found");
  return updated[0];
}

export async function deleteItem(slug: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(items).where(eq(items.slug, slug)).limit(1);
  if (!existing[0]) throw new Error("Item not found");

  await db.delete(items).where(eq(items.slug, slug));
}

export async function seedItemsIfEmpty(ownerId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ count: count() }).from(items);
  if ((existing[0]?.count ?? 0) > 0) return;

  const seedData: InsertItem[] = [
    { slug: "i1", name: "Federal Contract Review — DOD Q1", status: "active", ownerId },
    { slug: "i2", name: "SAM.gov Vendor Audit Trail", status: "draft", ownerId },
    { slug: "i3", name: "FPDS Procurement Analysis — FY2025", status: "active", ownerId },
    { slug: "i4", name: "Grants.gov Opportunity Tracker", status: "archived", ownerId },
    { slug: "i5", name: "Geospatial Shipping Lane Monitor", status: "active", ownerId },
    { slug: "i6", name: "NOAA Weather Impact Assessment", status: "draft", ownerId },
    { slug: "i7", name: "Coast Guard AIS Vessel Tracking", status: "active", ownerId },
    { slug: "i8", name: "Supply Chain Rail Capacity Report", status: "archived", ownerId },
    { slug: "i9", name: "USDA Commodity Futures Intelligence", status: "draft", ownerId },
    { slug: "i10", name: "Executive Order Compliance Tracker", status: "active", ownerId },
  ];

  await db.insert(items).values(seedData);
}

export async function switchUserRole(
  openId: string,
  role: "user" | "admin"
): Promise<{ role: "user" | "admin" }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.openId, openId));
  return { role };
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function writeAuditLog(entry: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available, skipping audit log entry");
    return;
  }
  try {
    await db.insert(auditLog).values(entry);
  } catch (error) {
    // Audit log failures should never break the main operation
    console.error("[AuditLog] Failed to write entry:", error);
  }
}

export async function getAuditLog(opts: {
  page: number;
  pageSize: number;
  resourceType?: string;
  action?: "create" | "update" | "delete" | "";
}): Promise<{ data: AuditLog[]; total: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { page, pageSize, resourceType = "", action = "" } = opts;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (resourceType) conditions.push(eq(auditLog.resourceType, resourceType));
  if (action) conditions.push(eq(auditLog.action, action));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(auditLog).where(where),
  ]);

  return { data: rows, total: totalRows[0]?.count ?? 0 };
}
