import { Router } from "express";
import { db } from "@workspace/db";
import { athanUsers } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

function genId() {
  return crypto.randomUUID();
}

router.post("/auth/register", async (req, res) => {
  const configuredCode = process.env.ATHAN_INVITE_CODE;
  if (!configuredCode) {
    res.status(503).json({ error: "Registration is not available at this time" });
    return;
  }
  const { name, username, inviteCode } = req.body as {
    name?: string;
    username?: string;
    inviteCode?: string;
  };
  if (!inviteCode || inviteCode.trim() !== configuredCode) {
    res.status(403).json({ error: "Invalid invite code" });
    return;
  }
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "username is required" });
    return;
  }
  const trimmed = username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(trimmed)) {
    res.status(400).json({ error: "Invalid username format" });
    return;
  }
  try {
    const existing = await db
      .select({ id: athanUsers.id })
      .from(athanUsers)
      .where(eq(athanUsers.username, trimmed))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    const id = genId();
    const authToken = genId();
    const displayName = (name ?? "").trim() || "New User";
    const [user] = await db
      .insert(athanUsers)
      .values({ id, name: displayName, username: trimmed, authToken })
      .returning({
        id: athanUsers.id,
        name: athanUsers.name,
        username: athanUsers.username,
        authToken: athanUsers.authToken,
      });
    res.status(201).json({
      user: { id: user.id, name: user.name, username: user.username },
      authToken: user.authToken,
    });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({ id: athanUsers.id, name: athanUsers.name, username: athanUsers.username })
      .from(athanUsers)
      .where(eq(athanUsers.id, req.userId!))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/users/by-username/:username", requireAuth, async (req: AuthRequest, res) => {
  const { username } = req.params as Record<string, string>;
  try {
    const rows = await db
      .select({ id: athanUsers.id, name: athanUsers.name, username: athanUsers.username })
      .from(athanUsers)
      .where(eq(athanUsers.username, username.toLowerCase()))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
