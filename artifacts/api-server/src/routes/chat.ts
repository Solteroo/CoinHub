import { Router, type IRouter, type Request } from "express";
import { db, chatMessagesTable, usersTable, type UserRow } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { PostChatMessageBody } from "@workspace/api-zod";
import { requireUser, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const lastPostAt = new Map<string, number>();
const POST_COOLDOWN_MS = 1500;

router.get("/chat/messages", async (req, res) => {
  const limitRaw = Number(req.query["limit"] ?? 50);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));

  const rows = await db
    .select({
      id: chatMessagesTable.id,
      userId: chatMessagesTable.userId,
      message: chatMessagesTable.message,
      createdAt: chatMessagesTable.createdAt,
      username: usersTable.username,
      publicId: usersTable.publicId,
    })
    .from(chatMessagesTable)
    .innerJoin(usersTable, eq(chatMessagesTable.userId, usersTable.id))
    .where(eq(chatMessagesTable.deleted, 0))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(
    rows
      .reverse()
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        publicId: r.publicId,
        username: r.username,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      })),
  );
});

router.post("/chat/messages", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PostChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Habar nädogry" });
    return;
  }
  const message = parsed.data.message.trim();
  if (message.length === 0) {
    res.status(400).json({ error: "Boş habar iberip bolmaýar" });
    return;
  }

  const now = Date.now();
  const last = lastPostAt.get(user.id) ?? 0;
  if (now - last < POST_COOLDOWN_MS) {
    res.status(429).json({ error: "Çalt ýazýarsyňyz, biraz garaşyň" });
    return;
  }
  lastPostAt.set(user.id, now);

  const [inserted] = await db
    .insert(chatMessagesTable)
    .values({ userId: user.id, message })
    .returning();

  if (!inserted) {
    res.status(500).json({ error: "Habar saklap bolmady" });
    return;
  }

  res.json({
    id: inserted.id,
    userId: inserted.userId,
    publicId: user.publicId,
    username: user.username,
    message: inserted.message,
    createdAt: inserted.createdAt.toISOString(),
  });
});

router.delete("/admin/chat/messages/:messageId", requireAdmin, async (req, res) => {
  const messageId = req.params["messageId"];
  if (!messageId) {
    res.status(400).json({ error: "messageId gerek" });
    return;
  }
  await db
    .update(chatMessagesTable)
    .set({ deleted: 1 })
    .where(and(eq(chatMessagesTable.id, messageId), eq(chatMessagesTable.deleted, 0)));
  res.json({ ok: true });
});

// silence unused warning
void sql;

export default router;
