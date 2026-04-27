import { pgTable, text, integer, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull().unique(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    coins: integer("coins").notNull().default(0),
    isAdmin: integer("is_admin").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastDailyClaimAt: timestamp("last_daily_claim_at", { withTimezone: true }),
    dailyStreak: integer("daily_streak").notNull().default(0),
    lastTapAt: timestamp("last_tap_at", { withTimezone: true }),
    email: text("email"),
    bio: text("bio"),
    avatarColor: text("avatar_color").notNull().default("#D4AF37"),
    chatBanUntil: timestamp("chat_ban_until", { withTimezone: true }),
    lastBonusAt: timestamp("last_bonus_at", { withTimezone: true }),
  },
  (t) => [index("users_coins_idx").on(t.coins)],
);

export type UserRow = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
