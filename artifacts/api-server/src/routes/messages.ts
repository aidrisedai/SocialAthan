import { Router } from "express";
import { db } from "@workspace/db";
import { athanMessages } from "@workspace/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { pushToUser } from "../lib/wsManager";
import crypto from "crypto";

const router = Router();

router.get("/messages/:partnerId", requireAuth, async (req: AuthRequest, res) => {
  const { partnerId } = req.params as Record<string, string>;
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  try {
    const rows = await db
      .select()
      .from(athanMessages)
      .where(
        or(
          and(eq(athanMessages.senderId, req.userId!), eq(athanMessages.recipientId, partnerId)),
          and(eq(athanMessages.senderId, partnerId), eq(athanMessages.recipientId, req.userId!))
        )
      )
      .orderBy(asc(athanMessages.createdAt))
      .limit(limit);
    const messages = rows.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      text: r.text,
      timestamp: new Date(r.createdAt).getTime(),
    }));
    res.json({ messages });
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/messages/:partnerId", requireAuth, async (req: AuthRequest, res) => {
  const { partnerId } = req.params as Record<string, string>;
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const id = crypto.randomUUID();
    const trimmed = text.trim();
    await db.insert(athanMessages).values({
      id,
      senderId: req.userId!,
      recipientId: partnerId,
      text: trimmed,
    });
    const message = { id, senderId: req.userId!, text: trimmed, timestamp: Date.now() };
    res.status(201).json({ message });
    pushToUser(partnerId, { type: "new_message", senderId: req.userId!, message });
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
