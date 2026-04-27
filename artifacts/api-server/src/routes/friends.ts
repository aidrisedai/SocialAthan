import { Router } from "express";
import { db } from "@workspace/db";
import { athanFriendships, athanUsers } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/friends", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        friendId: athanFriendships.friendId,
        name: athanUsers.name,
        username: athanUsers.username,
      })
      .from(athanFriendships)
      .innerJoin(athanUsers, eq(athanUsers.id, athanFriendships.friendId))
      .where(eq(athanFriendships.userId, req.userId!));

    const friends = rows.map((r) => ({
      id: r.friendId,
      name: r.name,
      username: r.username,
      isConnected: true,
    }));
    res.json({ friends });
  } catch {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

router.post("/friends", requireAuth, async (req: AuthRequest, res) => {
  const { username } = req.body as { username?: string };
  if (!username) {
    res.status(400).json({ error: "username is required" });
    return;
  }
  try {
    const targetRows = await db
      .select({ id: athanUsers.id, name: athanUsers.name, username: athanUsers.username })
      .from(athanUsers)
      .where(eq(athanUsers.username, username.toLowerCase()))
      .limit(1);
    if (targetRows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const target = targetRows[0];
    if (target.id === req.userId) {
      res.status(400).json({ error: "Cannot add yourself" });
      return;
    }
    await db
      .insert(athanFriendships)
      .values({ userId: req.userId!, friendId: target.id })
      .onConflictDoNothing();
    res.status(201).json({ friend: { id: target.id, name: target.name, username: target.username, isConnected: true } });
  } catch {
    res.status(500).json({ error: "Failed to add friend" });
  }
});

router.delete("/friends/:friendId", requireAuth, async (req: AuthRequest, res) => {
  const { friendId } = req.params as Record<string, string>;
  try {
    await db
      .delete(athanFriendships)
      .where(and(eq(athanFriendships.userId, req.userId!), eq(athanFriendships.friendId, friendId)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

export default router;
