import { Router, type IRouter, type Request } from "express";
import {
  db,
  usersTable,
  friendshipsTable,
  directMessagesTable,
  notificationsTable,
  transactionsTable,
  orderPair,
  type UserRow,
} from "@workspace/db";
import { and, desc, eq, gt, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { requireUser } from "../lib/auth";
import { serializePublicUser } from "../lib/serializers";

const router: IRouter = Router();

async function findUserByPublicId(publicId: string): Promise<UserRow | null> {
  const [u] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.publicId, publicId))
    .limit(1);
  return u ?? null;
}

async function findUserById(id: string): Promise<UserRow | null> {
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return u ?? null;
}

async function getFriendshipStatus(meId: string, otherId: string) {
  if (meId === otherId) return "self";
  const { userIdA, userIdB } = orderPair(meId, otherId);
  const [row] = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)))
    .limit(1);
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requesterId === meId ? "pending_outgoing" : "pending_incoming";
}

router.get("/users/search", requireUser, async (req, res) => {
  const q = String(req.query["q"] ?? "").trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }
  const rows = await db
    .select()
    .from(usersTable)
    .where(or(ilike(usersTable.publicId, `%${q}%`), ilike(usersTable.username, `%${q}%`)))
    .orderBy(desc(usersTable.coins))
    .limit(20);
  res.json(rows.map(serializePublicUser));
});

router.get("/users/:publicId", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const publicId = String(req.params["publicId"] ?? "");
  const u = await findUserByPublicId(publicId);
  if (!u) {
    res.status(404).json({ error: "Tapylmady" });
    return;
  }
  const [rankRow] = await db
    .select({ c: sql<number>`count(*)::int + 1`.as("c") })
    .from(usersTable)
    .where(gt(usersTable.coins, u.coins));
  const [gamesRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(transactionsTable)
    .where(
      sql`${transactionsTable.userId} = ${u.id} AND ${transactionsTable.source} IN ('game_spin','game_luckybox','game_slot','game_crash')`,
    );
  const friendStatus = await getFriendshipStatus(me.id, u.id);
  res.json({
    id: u.id,
    publicId: u.publicId,
    username: u.username,
    avatarColor: u.avatarColor,
    isAdmin: u.isAdmin === 1,
    bio: u.bio ?? null,
    coins: u.coins,
    rank: rankRow ? Number(rankRow.c) : null,
    gamesPlayed: Number(gamesRow?.c ?? 0),
    createdAt: u.createdAt.toISOString(),
    friendStatus,
  });
});

router.get("/friends", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const rows = await db
    .select({
      userIdA: friendshipsTable.userIdA,
      userIdB: friendshipsTable.userIdB,
      requesterId: friendshipsTable.requesterId,
      status: friendshipsTable.status,
      createdAt: friendshipsTable.createdAt,
    })
    .from(friendshipsTable)
    .where(or(eq(friendshipsTable.userIdA, me.id), eq(friendshipsTable.userIdB, me.id)));
  const otherIds = rows.map((r) => (r.userIdA === me.id ? r.userIdB : r.userIdA));
  const users = otherIds.length
    ? await db
        .select()
        .from(usersTable)
        .where(or(...otherIds.map((id) => eq(usersTable.id, id))))
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const friends: unknown[] = [];
  const incoming: unknown[] = [];
  const outgoing: unknown[] = [];
  for (const r of rows) {
    const otherId = r.userIdA === me.id ? r.userIdB : r.userIdA;
    const u = userMap.get(otherId);
    if (!u) continue;
    const entry = { user: serializePublicUser(u), since: r.createdAt.toISOString() };
    if (r.status === "accepted") friends.push(entry);
    else if (r.requesterId === me.id) outgoing.push(entry);
    else incoming.push(entry);
  }
  res.json({ friends, incoming, outgoing });
});

router.post("/friends/request", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const publicId = String((req.body ?? {}).publicId ?? "").trim();
  const target = await findUserByPublicId(publicId);
  if (!target) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }
  if (target.id === me.id) {
    res.status(400).json({ error: "Özüňize sorag iberip bilmersiňiz" });
    return;
  }
  const { userIdA, userIdB } = orderPair(me.id, target.id);
  const [existing] = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)))
    .limit(1);
  if (existing) {
    if (existing.status === "accepted") {
      res.json({ ok: true });
      return;
    }
    if (existing.requesterId === me.id) {
      res.json({ ok: true });
      return;
    }
    // they already requested us — auto-accept
    await db
      .update(friendshipsTable)
      .set({ status: "accepted" })
      .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)));
    await db.insert(notificationsTable).values({
      userId: target.id,
      title: "Dostluk kabul edildi",
      body: `${me.username} siziň dostluk soragyňyzy kabul etdi.`,
      kind: "friend",
    });
    res.json({ ok: true });
    return;
  }
  await db.insert(friendshipsTable).values({
    userIdA,
    userIdB,
    requesterId: me.id,
    status: "pending",
  });
  await db.insert(notificationsTable).values({
    userId: target.id,
    title: "Dostluk soragy",
    body: `${me.username} sizi dost edinmek isleýär.`,
    kind: "friend",
  });
  res.json({ ok: true });
});

router.post("/friends/:userId/accept", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const otherId = String(req.params["userId"] ?? "");
  const other = await findUserById(otherId);
  if (!other) {
    res.status(404).json({ error: "Tapylmady" });
    return;
  }
  const { userIdA, userIdB } = orderPair(me.id, other.id);
  const [row] = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)))
    .limit(1);
  if (!row || row.status === "accepted" || row.requesterId === me.id) {
    res.status(400).json({ error: "Sorag tapylmady" });
    return;
  }
  await db
    .update(friendshipsTable)
    .set({ status: "accepted" })
    .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)));
  await db.insert(notificationsTable).values({
    userId: other.id,
    title: "Dostluk kabul edildi",
    body: `${me.username} siziň dostluk soragyňyzy kabul etdi.`,
    kind: "friend",
  });
  res.json({ ok: true });
});

router.delete("/friends/:userId", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const otherId = String(req.params["userId"] ?? "");
  const { userIdA, userIdB } = orderPair(me.id, otherId);
  await db
    .delete(friendshipsTable)
    .where(and(eq(friendshipsTable.userIdA, userIdA), eq(friendshipsTable.userIdB, userIdB)));
  res.json({ ok: true });
});

router.get("/dm/threads", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  // Get the latest message per partner using a CTE-like approach in SQL
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (partner_id)
      partner_id,
      message,
      created_at,
      unread
    FROM (
      SELECT
        CASE WHEN from_id = ${me.id} THEN to_id ELSE from_id END AS partner_id,
        message,
        created_at,
        SUM(CASE WHEN to_id = ${me.id} AND read_at IS NULL THEN 1 ELSE 0 END)
          OVER (PARTITION BY CASE WHEN from_id = ${me.id} THEN to_id ELSE from_id END) AS unread
      FROM direct_messages
      WHERE from_id = ${me.id} OR to_id = ${me.id}
    ) t
    ORDER BY partner_id, created_at DESC
    LIMIT 100
  `);
  const partners = (rows.rows as Array<{ partner_id: string; message: string; created_at: Date; unread: string | number }>);
  if (partners.length === 0) {
    res.json([]);
    return;
  }
  const ids = partners.map((p) => p.partner_id);
  const users = await db
    .select()
    .from(usersTable)
    .where(or(...ids.map((id) => eq(usersTable.id, id))));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const threads = partners
    .map((p) => {
      const u = userMap.get(p.partner_id);
      if (!u) return null;
      return {
        user: serializePublicUser(u),
        lastMessage: p.message,
        lastAt: new Date(p.created_at).toISOString(),
        unread: Number(p.unread ?? 0),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  res.json(threads);
});

router.get("/dm/:userId/messages", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const otherId = String(req.params["userId"] ?? "");
  const rows = await db
    .select()
    .from(directMessagesTable)
    .where(
      or(
        and(eq(directMessagesTable.fromId, me.id), eq(directMessagesTable.toId, otherId)),
        and(eq(directMessagesTable.fromId, otherId), eq(directMessagesTable.toId, me.id)),
      ),
    )
    .orderBy(directMessagesTable.createdAt)
    .limit(200);
  // mark incoming as read
  await db
    .update(directMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(directMessagesTable.fromId, otherId),
        eq(directMessagesTable.toId, me.id),
        isNull(directMessagesTable.readAt),
      ),
    );
  res.json(
    rows.map((m) => ({
      id: m.id,
      fromId: m.fromId,
      toId: m.toId,
      message: m.message,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    })),
  );
});

const lastDmAt = new Map<string, number>();
const DM_COOLDOWN_MS = 800;

router.post("/dm/:userId/messages", requireUser, async (req, res) => {
  const me = (req as Request & { user: UserRow }).user;
  const otherId = String(req.params["userId"] ?? "");
  if (otherId === me.id) {
    res.status(400).json({ error: "Özüňize ýazyp bilmersiňiz" });
    return;
  }
  const message = String((req.body ?? {}).message ?? "").trim();
  if (message.length === 0 || message.length > 500) {
    res.status(400).json({ error: "Habar nädogry" });
    return;
  }
  const other = await findUserById(otherId);
  if (!other) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }
  const now = Date.now();
  const last = lastDmAt.get(me.id) ?? 0;
  if (now - last < DM_COOLDOWN_MS) {
    res.status(429).json({ error: "Çalt ýazýarsyňyz" });
    return;
  }
  lastDmAt.set(me.id, now);
  const [inserted] = await db
    .insert(directMessagesTable)
    .values({ fromId: me.id, toId: other.id, message })
    .returning();
  if (!inserted) {
    res.status(500).json({ error: "Iberip bolmady" });
    return;
  }
  await db.insert(notificationsTable).values({
    userId: other.id,
    title: `Habar: ${me.username}`,
    body: message.slice(0, 80),
    kind: "dm",
  });
  res.json({
    id: inserted.id,
    fromId: inserted.fromId,
    toId: inserted.toId,
    message: inserted.message,
    createdAt: inserted.createdAt.toISOString(),
    readAt: null,
  });
});

void ne;

export default router;
