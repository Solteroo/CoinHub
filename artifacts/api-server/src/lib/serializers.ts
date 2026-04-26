import type { UserRow, TransactionRow } from "@workspace/db";

export function serializeUser(u: UserRow) {
  return {
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    coins: u.coins,
    createdAt: u.createdAt.toISOString(),
    isAdmin: u.isAdmin === 1,
  };
}

export function serializeAdminUser(u: UserRow) {
  return {
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    coins: u.coins,
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
