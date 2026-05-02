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

void ensureOwner().then(() => {
  app.listen(port, "0.0.0.0", (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});
