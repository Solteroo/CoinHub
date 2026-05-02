import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res) => {
  const rows = await db
    .select({
      publicId: usersTable.publicId,
      username: usersTable.username,
      coins: usersTable.coins,
      avatarColor: usersTable.avatarColor,
      isAdmin: usersTable.isAdmin,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.coins))
    .limit(50);
  res.json(
    rows.map((r, i) => ({
      rank: i + 1,
      publicId: r.publicId,
      username: r.username,
      coins: r.coins,
      avatarColor: r.avatarColor ?? "#D4AF37",
      isAdmin: r.isAdmin === 1,
    })),
  );
});

export default router;
