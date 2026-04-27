import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "athan_users" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL DEFAULT '',
    "username" text NOT NULL UNIQUE,
    "auth_token" text NOT NULL UNIQUE,
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "athan_friendships" (
    "user_id" text NOT NULL REFERENCES "athan_users"("id") ON DELETE CASCADE,
    "friend_id" text NOT NULL REFERENCES "athan_users"("id") ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id", "friend_id")
  )`,
  `CREATE INDEX IF NOT EXISTS "athan_friendships_user_idx" ON "athan_friendships" ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "athan_rsvps" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "athan_users"("id") ON DELETE CASCADE,
    "prayer" text NOT NULL,
    "rsvp_date" text NOT NULL,
    "status" text NOT NULL,
    "masjid_id" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "athan_rsvps_unique_idx" UNIQUE ("user_id", "prayer", "rsvp_date")
  )`,
  `CREATE INDEX IF NOT EXISTS "athan_rsvps_user_date_idx" ON "athan_rsvps" ("user_id", "rsvp_date")`,
  `CREATE TABLE IF NOT EXISTS "athan_messages" (
    "id" text PRIMARY KEY,
    "sender_id" text NOT NULL REFERENCES "athan_users"("id") ON DELETE CASCADE,
    "recipient_id" text NOT NULL REFERENCES "athan_users"("id") ON DELETE CASCADE,
    "text" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "athan_messages_conversation_idx" ON "athan_messages" ("sender_id", "recipient_id", "created_at")`,
];

export async function ensureSchema(): Promise<void> {
  for (const stmt of STATEMENTS) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (err) {
      logger.error({ err, stmt: stmt.slice(0, 80) }, "ensureSchema statement failed");
      throw err;
    }
  }
  logger.info("Database schema verified");
}
