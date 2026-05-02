import type { UserRow, TransactionRow } from "@workspace/db";

export function serializeUser(
  u: UserRow,
  extras?: { bonusReady?: boolean; unreadNotifications?: number; unreadDms?: number },
) {
  return {
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    coins: u.coins,
    createdAt: u.createdAt.toISOString(),
    isAdmin: u.isAdmin === 1,
    email: u.email ?? null,
    bio: u.bio ?? null,
    avatarColor: u.avatarColor,
    bonusReady: extras?.bonusReady ?? false,
    unreadNotifications: extras?.unreadNotifications ?? 0,
    unreadDms: extras?.unreadDms ?? 0,
  };
}

export function serializePublicUser(u: UserRow) {
  return {
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    avatarColor: u.avatarColor,
    isAdmin: u.isAdmin === 1,
  };
}

export function serializeAdminUser(u: UserRow) {
  return {
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    email: u.email ?? null,
    passwordHash: u.passwordHash ?? null,
    coins: u.coins,
    avatarColor: u.avatarColor,
    isAdmin: u.isAdmin === 1,
    createdAt: u.createdAt.toISOString(),
  };
}

export function serializeTransaction(t: TransactionRow) {
  return {
    id: t.id,
    userId: t.userId,
    amount: t.amount,
    reason: t.reason,
    source: t.source,
    createdAt: t.createdAt.toISOString(),
  };
}

export const BONUS_INTERVAL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days
export const BONUS_AMOUNT = 50;

export function bonusReady(lastBonusAt: Date | null): boolean {
  if (!lastBonusAt) return true;
  return Date.now() - lastBonusAt.getTime() >= BONUS_INTERVAL_MS;
}
