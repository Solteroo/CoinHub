import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, type UserRow } from "@workspace/db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "coinhub_sid";
const ADMIN_COOKIE = "coinhub_admin";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me";
export const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin123";

const sessions = new Map<string, { userId: string; expiresAt: number }>();
const adminSessions = new Map<string, number>();
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  if (candidate.length !== original.length) return false;
  return timingSafeEqual(candidate, original);
}

export function createSession(res: Response, userId: string) {
  const sid = randomBytes(32).toString("hex");
  sessions.set(sid, { userId, expiresAt: Date.now() + SESSION_TTL });
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export function clearSession(req: Request, res: Response) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) sessions.delete(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function createAdminSession(res: Response) {
  const sid = randomBytes(32).toString("hex");
  adminSessions.set(sid, Date.now() + SESSION_TTL);
  res.cookie(ADMIN_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export function clearAdminSession(req: Request, res: Response) {
  const sid = req.cookies?.[ADMIN_COOKIE];
  if (sid) adminSessions.delete(sid);
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
}

export function isAdminAuthed(req: Request): boolean {
  const sid = req.cookies?.[ADMIN_COOKIE];
  if (!sid) return false;
  const expiresAt = adminSessions.get(sid);
  if (!expiresAt || expiresAt < Date.now()) {
    if (sid) adminSessions.delete(sid);
    return false;
  }
  return true;
}

export async function getSessionUser(req: Request): Promise<UserRow | null> {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) sessions.delete(sid);
    return null;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);
  return user ?? null;
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Awtorizasiýa talap edilýär" });
    return;
  }
  (req as Request & { user: UserRow }).user = user;
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isAdminAuthed(req)) {
    res.status(401).json({ error: "Admin awtorizasiýa talap edilýär" });
    return;
  }
  next();
}

export function generatePublicId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "CH";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

void SESSION_SECRET;
