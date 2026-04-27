import type { WebSocket as WsSocket } from "ws";

export interface WsEvent {
  type: string;
  [key: string]: unknown;
}

const clients = new Map<string, Set<WsSocket>>();

export function registerWsClient(userId: string, ws: WsSocket) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ws);
  ws.on("close", () => {
    const set = clients.get(userId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) clients.delete(userId);
    }
  });
}

export function pushToUser(userId: string, event: WsEvent) {
  const conns = clients.get(userId);
  if (!conns) return;
  const payload = JSON.stringify(event);
  for (const ws of conns) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

export function pushToUsers(userIds: string[], event: WsEvent) {
  for (const userId of userIds) {
    pushToUser(userId, event);
  }
}
