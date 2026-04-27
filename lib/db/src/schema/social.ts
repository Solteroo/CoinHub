import { pgTable, text, integer, timestamp, uuid, index, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Friendship: undirected pair stored as ordered tuple (smaller uuid first)
export const friendshipsTable = pgTable(
  "friendships",
  {
    userIdA: uuid("user_id_a")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    userIdB: uuid("user_id_b")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | accepted
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userIdA, t.userIdB] }),
    index("friendships_a_idx").on(t.userIdA),
    index("friendships_b_idx").on(t.userIdB),
  ],
);

export const directMessagesTable = pgTable(
  "direct_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromId: uuid("from_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    toId: uuid("to_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("dm_pair_idx").on(t.fromId, t.toId),
    index("dm_to_idx").on(t.toId),
    index("dm_created_idx").on(t.createdAt),
  ],
);

export const newsPostsTable = pgTable(
  "news_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_created_idx").on(t.createdAt)],
);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    kind: text("kind").notNull().default("info"), // info | bonus | dm | transfer | friend
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notif_user_idx").on(t.userId),
    index("notif_created_idx").on(t.createdAt),
  ],
);

// Type exports
export type FriendshipRow = typeof friendshipsTable.$inferSelect;
export type DirectMessageRow = typeof directMessagesTable.$inferSelect;
export type NewsPostRow = typeof newsPostsTable.$inferSelect;
export type NotificationRow = typeof notificationsTable.$inferSelect;

// Helper: order pair so userIdA < userIdB
export function orderPair(a: string, b: string): { userIdA: string; userIdB: string } {
  return a < b ? { userIdA: a, userIdB: b } : { userIdA: b, userIdB: a };
}
