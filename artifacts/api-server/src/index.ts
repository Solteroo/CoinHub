import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generatePublicId } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const OWNER_EMAIL = process.env["OWNER_EMAIL"] ?? "yrejepov1@gmail.com";
const OWNER_PASSWORD = "soltero.97";
const OWNER_USERNAME = "Owner";

async function ensureOwner(): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, OWNER_EMAIL))
      .limit(1);

    if (!existing) {
      let publicId = generatePublicId();
      for (let i = 0; i < 5; i++) {
        const dup = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.publicId, publicId)).limit(1);
        if (dup.length === 0) break;
        publicId = generatePublicId();
      }
      await db.insert(usersTable).values({
        username: OWNER_USERNAME,
        publicId,
        passwordHash: hashPassword(OWNER_PASSWORD),
        email: OWNER_EMAIL,
        isAdmin: 1,
        coins: 999999,
        avatarColor: "#D4AF37",
      });
      logger.info({ email: OWNER_EMAIL }, "Owner account created");
    } else {
      // Always ensure owner has correct password + admin flag
      await db.update(usersTable)
        .set({ isAdmin: 1, passwordHash: hashPassword(OWNER_PASSWORD) })
        .where(eq(usersTable.id, existing.id));
      logger.info({ email: OWNER_EMAIL }, "Owner account synced");
    }
  } catch (err) {
    logger.error({ err }, "Failed to ensure owner account");
  }
}

// Fake leaderboard players — they appear in search, profiles, leaderboard
// They have no password/email so nobody can log in as them
const FAKE_PLAYERS = [
  { username: "Merdan",     coins: 485000, avatarColor: "#7c3aed", bio: "Bagt çarhy meňki 🎡" },
  { username: "Aynur",      coins: 342000, avatarColor: "#f43f5e", bio: "Her gün oýnaýan 💫" },
  { username: "Kemal",      coins: 291000, avatarColor: "#10b981", bio: "Slot maşyn ussady 🎰" },
  { username: "Didar",      coins: 178500, avatarColor: "#3b82f6", bio: "Ruletka hünärmeni 🎯" },
  { username: "Leila",      coins: 156200, avatarColor: "#f59e0b", bio: "Çalt oýunlar söýýän ⚡" },
  { username: "Serdar",     coins: 134800, avatarColor: "#ef4444", bio: "Minalar oýnundan gorkmok 💣" },
  { username: "Bekmurat",   coins: 112300, avatarColor: "#8b5cf6", bio: "Hi-Lo professory 🃏" },
  { username: "Nasiba",     coins: 98700,  avatarColor: "#ec4899", bio: "Plinko we Bagt gutusy 🎁" },
  { username: "Timur",      coins: 87400,  avatarColor: "#14b8a6", bio: "Zar oýny lider 🎲" },
  { username: "Aziz",       coins: 65200,  avatarColor: "#f97316", bio: "Crash specialist 🚀" },
  { username: "Güller",     coins: 54100,  avatarColor: "#a78bfa", bio: "Bonus kolleksiýasy 🌸" },
  { username: "Sapar",      coins: 47800,  avatarColor: "#34d399", bio: "Slot master 🎰" },
  { username: "Öwez",       coins: 41300,  avatarColor: "#60a5fa", bio: "Agşam oýun wagty 🌙" },
];

async function ensureFakePlayers(): Promise<void> {
  try {
    for (const p of FAKE_PLAYERS) {
      const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.username, p.username)).limit(1);
      if (!existing) {
        let publicId = generatePublicId();
        for (let i = 0; i < 5; i++) {
          const dup = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.publicId, publicId)).limit(1);
          if (dup.length === 0) break;
          publicId = generatePublicId();
        }
        await db.insert(usersTable).values({
          username: p.username,
          publicId,
          passwordHash: null,   // can't log in
          email: null,
          isAdmin: 0,
          coins: p.coins,
          realCoins: Math.floor(p.coins * 0.4),
          avatarColor: p.avatarColor,
          bio: p.bio,
        });
        logger.info({ username: p.username, coins: p.coins }, "Fake player created");
      }
    }
    logger.info("Fake players seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed fake players");
  }
}

void ensureOwner()
  .then(() => ensureFakePlayers())
  .then(() => {
    app.listen(port, "0.0.0.0", (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  });
