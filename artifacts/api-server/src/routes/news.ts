import { Router, type IRouter } from "express";
import { db, newsPostsTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { serializePublicUser } from "../lib/serializers";

const router: IRouter = Router();

router.get("/news", async (_req, res) => {
  const rows = await db
    .select()
    .from(newsPostsTable)
    .orderBy(desc(newsPostsTable.createdAt))
    .limit(50);
  res.json(
    rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

router.post("/admin/news", requireAdmin, async (req, res) => {
  const body = (req.body ?? {}) as { title?: string; body?: string };
  const title = String(body.title ?? "").trim().slice(0, 100);
  const text = String(body.body ?? "").trim().slice(0, 1000);
  if (!title || !text) {
    res.status(400).json({ error: "Sözbaşy we mazmuny ýazyň" });
    return;
  }
  const [inserted] = await db
    .insert(newsPostsTable)
    .values({ title, body: text })
    .returning();
  if (!inserted) {
    res.status(500).json({ error: "Saklanmady" });
    return;
  }
  res.json({
    id: inserted.id,
    title: inserted.title,
    body: inserted.body,
    createdAt: inserted.createdAt.toISOString(),
  });
});

router.delete("/admin/news/:newsId", requireAdmin, async (req, res) => {
  const newsId = String(req.params["newsId"] ?? "");
  await db.delete(newsPostsTable).where(eq(newsPostsTable.id, newsId));
  res.json({ ok: true });
});

router.get("/admin/owner", async (_req, res) => {
  const [owner] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.isAdmin, 1))
    .limit(1);
  if (!owner) {
    res.status(404).json({ error: "Owner tapylmady" });
    return;
  }
  res.json(serializePublicUser(owner));
});

export default router;
