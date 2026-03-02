import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditLog, InsertAuditLogRow, InsertUser, users } from "../drizzle/schema";
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

// ─── Audit Log helpers ────────────────────────────────────────────────────────

export async function insertAuditEntry(entry: InsertAuditLogRow): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert audit entry: database not available");
    return;
  }
  await db.insert(auditLog).values(entry);
}

export interface AuditQueryOptions {
  category?: string;
  severity?: string;
  actor?: string;
  fromTs?: number;
  toTs?: number;
  limit?: number;
}

export async function queryAuditLog(opts: AuditQueryOptions = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (opts.category) conditions.push(eq(auditLog.category, opts.category));
  if (opts.severity) conditions.push(eq(auditLog.severity, opts.severity as "info" | "warning" | "critical"));
  if (opts.actor) conditions.push(eq(auditLog.actor, opts.actor));
  if (opts.fromTs) conditions.push(gte(auditLog.ts, opts.fromTs));
  if (opts.toTs) conditions.push(lte(auditLog.ts, opts.toTs));

  const query = db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.ts))
    .limit(opts.limit ?? 500);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function clearAuditLog(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(auditLog);
}
