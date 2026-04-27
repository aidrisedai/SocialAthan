import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { athanUsers } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const rows = await db
      .select({ id: athanUsers.id })
      .from(athanUsers)
      .where(eq(athanUsers.authToken, token))
      .limit(1);
    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid auth token" });
      return;
    }
    req.userId = rows[0].id;
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}
