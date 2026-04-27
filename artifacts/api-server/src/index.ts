import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { athanUsers } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { registerWsClient } from "./lib/wsManager";
import { ensureSchema } from "./lib/ensureSchema";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", async (ws, req) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost`);
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "Missing token");
      return;
    }
    const rows = await db
      .select({ id: athanUsers.id })
      .from(athanUsers)
      .where(eq(athanUsers.authToken, token))
      .limit(1);
    if (rows.length === 0) {
      ws.close(4001, "Invalid token");
      return;
    }
    const userId = rows[0].id;
    registerWsClient(userId, ws);
    ws.send(JSON.stringify({ type: "connected", userId }));
    logger.debug({ userId }, "WebSocket client connected");
  } catch (err) {
    logger.error({ err }, "WebSocket auth error");
    ws.close(4002, "Auth error");
  }
});

ensureSchema()
  .catch((err) => {
    logger.error({ err }, "ensureSchema failed — server will start but DB writes may fail");
  })
  .finally(() => {
    server.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  });
