import { Router } from "express";
import { db } from "@workspace/db";
import { athanRsvps, athanFriendships, athanUsers } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { pushToUsers } from "../lib/wsManager";
import crypto from "crypto";

const router = Router();

function today() {
  return new Date().toISOString().split("T")[0];
}

router.get("/rsvps", requireAuth, async (req: AuthRequest, res) => {
  const date = (req.query.date as string) || today();
  try {
    const rows = await db
      .select()
      .from(athanRsvps)
      .where(and(eq(athanRsvps.userId, req.userId!), eq(athanRsvps.rsvpDate, date)));
    const rsvps: Record<string, string> = {};
    for (const r of rows) {
      rsvps[r.prayer] = r.status;
    }
    res.json({ rsvps, date });
  } catch {
    res.status(500).json({ error: "Failed to fetch RSVPs" });
  }
});

router.put("/rsvps/:prayer", requireAuth, async (req: AuthRequest, res) => {
  const { prayer } = req.params as Record<string, string>;
  const { status, masjidId } = req.body as { status?: string; masjidId?: string };
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }
  const date = today();
  try {
    await db
      .insert(athanRsvps)
      .values({
        id: crypto.randomUUID(),
        userId: req.userId!,
        prayer,
        rsvpDate: date,
        status,
        masjidId: masjidId ?? null,
      })
      .onConflictDoUpdate({
        target: [athanRsvps.userId, athanRsvps.prayer, athanRsvps.rsvpDate],
        set: { status, masjidId: masjidId ?? null },
      });
    res.json({ success: true, prayer, status, date });

    if (status === "going") {
      Promise.resolve().then(async () => {
        try {
          const userRow = await db
            .select({ name: athanUsers.name, username: athanUsers.username })
            .from(athanUsers)
            .where(eq(athanUsers.id, req.userId!))
            .limit(1);
          const friendRows = await db
            .select({ userId: athanFriendships.userId })
            .from(athanFriendships)
            .where(eq(athanFriendships.friendId, req.userId!));
          const friendIds = friendRows.map((r) => r.userId);
          if (friendIds.length > 0 && userRow.length > 0) {
            pushToUsers(friendIds, {
              type: "rsvp_update",
              userId: req.userId!,
              name: userRow[0].name,
              username: userRow[0].username,
              prayer,
              status,
              date,
              masjidId: masjidId ?? null,
            });
          }
        } catch {
        }
      });
    }
  } catch {
    res.status(500).json({ error: "Failed to update RSVP" });
  }
});

router.delete("/rsvps/:prayer", requireAuth, async (req: AuthRequest, res) => {
  const { prayer } = req.params as Record<string, string>;
  const date = today();
  try {
    await db
      .delete(athanRsvps)
      .where(
        and(
          eq(athanRsvps.userId, req.userId!),
          eq(athanRsvps.prayer, prayer),
          eq(athanRsvps.rsvpDate, date)
        )
      );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to clear RSVP" });
  }
});

router.get("/rsvps/friends", requireAuth, async (req: AuthRequest, res) => {
  const date = (req.query.date as string) || today();
  const masjidId = req.query.masjidId as string | undefined;
  try {
    const friendRows = await db
      .select({ friendId: athanFriendships.friendId })
      .from(athanFriendships)
      .where(eq(athanFriendships.userId, req.userId!));
    const friendIds = friendRows.map((r) => r.friendId);
    if (friendIds.length === 0) {
      res.json({ friendRsvps: {} });
      return;
    }
    const rsvpRows = await db
      .select({
        userId: athanRsvps.userId,
        prayer: athanRsvps.prayer,
        status: athanRsvps.status,
        masjidId: athanRsvps.masjidId,
        name: athanUsers.name,
        username: athanUsers.username,
      })
      .from(athanRsvps)
      .innerJoin(athanUsers, eq(athanUsers.id, athanRsvps.userId))
      .where(
        and(
          inArray(athanRsvps.userId, friendIds),
          eq(athanRsvps.rsvpDate, date),
          eq(athanRsvps.status, "going")
        )
      );
    const grouped: Record<
      string,
      Array<{ id: string; name: string; username: string; isConnected: boolean }>
    > = {};
    for (const row of rsvpRows) {
      if (masjidId && row.masjidId && row.masjidId !== masjidId) continue;
      if (!grouped[row.prayer]) grouped[row.prayer] = [];
      grouped[row.prayer].push({
        id: row.userId,
        name: row.name,
        username: row.username,
        isConnected: true,
      });
    }
    res.json({ friendRsvps: grouped, date });
  } catch {
    res.status(500).json({ error: "Failed to fetch friend RSVPs" });
  }
});

export default router;
