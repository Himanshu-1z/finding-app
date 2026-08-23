import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  rooms?: Set<string>;
  userId?: string;
  userName?: string;
}

const RECORD_SEPARATOR = String.fromCharCode(0x1e);

let wss: WebSocketServer | null = null;
const roomSubscribers = new Map<string, Set<ExtendedWebSocket>>();

const userSockets = new Map<string, Set<ExtendedWebSocket>>();

export function setupChatHub(server: HttpServer) {
  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    ws.rooms = new Set<string>();

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw: string | Buffer) => {
      try {
        const text = raw.toString();
        // Handle SignalR record separator splitting
        const parts = text.split(RECORD_SEPARATOR).filter(Boolean);

        for (const part of parts) {
          try {
            const data = JSON.parse(part);

            // SignalR Handshake Request
            if (data.protocol === "json") {
              ws.send(`{}` + RECORD_SEPARATOR);
              continue;
            }

            // SignalR Ping (type: 6)
            if (data.type === 6) {
              ws.send(`{"type":6}` + RECORD_SEPARATOR);
              continue;
            }

            // SignalR Invocation (type: 1)
            if (data.type === 1 && data.target) {
              const args = data.arguments || [];
              handleHubInvocation(ws, data.target, args);
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn("WebSocket parse error:", err);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        const set = userSockets.get(ws.userId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) userSockets.delete(ws.userId);
        }
      }
      if (ws.rooms) {
        for (const roomId of ws.rooms) {
          const set = roomSubscribers.get(roomId);
          if (set) {
            set.delete(ws);
            if (set.size === 0) roomSubscribers.delete(roomId);
          }
        }
      }
    });
  });

  // Heartbeat keepalive
  setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      if (!extWs.isAlive) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  return wss;
}

function handleHubInvocation(ws: ExtendedWebSocket, target: string, args: any[]) {
  if (target === "Identify" || target === "RegisterUser") {
    const userId = String(args[0]);
    ws.userId = userId;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(ws);
  } else if (target === "JoinRoom") {
    const roomId = String(args[0]);
    if (!ws.rooms) ws.rooms = new Set<string>();
    ws.rooms.add(roomId);

    if (!roomSubscribers.has(roomId)) {
      roomSubscribers.set(roomId, new Set());
    }
    roomSubscribers.get(roomId)!.add(ws);
  } else if (target === "LeaveRoom") {
    const roomId = String(args[0]);
    if (ws.rooms) ws.rooms.delete(roomId);
    const set = roomSubscribers.get(roomId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) roomSubscribers.delete(roomId);
    }
  } else if (target === "SendMessage") {
    const [roomId, senderId, senderName, message] = args;
    const payload = {
      id: "msg-" + Date.now(),
      chatRoomId: String(roomId),
      senderId: String(senderId),
      senderName: String(senderName),
      content: String(message),
      text: String(message),
      sentAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    broadcastToChatRoom(String(roomId), "ReceiveMessage", payload);
  } else if (target === "SendTyping") {
    const [roomId, senderId, senderName, isTyping] = args;
    const payload = {
      chatRoomId: String(roomId),
      senderId: String(senderId),
      senderName: String(senderName),
      isTyping: Boolean(isTyping),
    };
    broadcastToChatRoom(String(roomId), "UserTyping", payload, ws);
  }
}

export function emitToUser(userId: string, target: string, payload: any) {
  const clients = userSockets.get(String(userId));
  if (!clients || clients.size === 0) return;

  const signalRMsg = JSON.stringify({
    type: 1,
    target,
    arguments: [payload],
  }) + RECORD_SEPARATOR;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(signalRMsg);
      } catch (_) {}
    }
  });
}

export function broadcastGlobal(target: string, payload: any) {
  if (!wss) return;
  const signalRMsg = JSON.stringify({
    type: 1,
    target,
    arguments: [payload],
  }) + RECORD_SEPARATOR;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(signalRMsg);
      } catch (_) {}
    }
  });
}

export function broadcastToChatRoom(roomId: string, target: string, payload: any, senderWs?: ExtendedWebSocket) {
  const clients = roomSubscribers.get(String(roomId));
  if (!clients || clients.size === 0) return;

  const signalRMsg = JSON.stringify({
    type: 1,
    target,
    arguments: [payload],
  }) + RECORD_SEPARATOR;

  clients.forEach((client) => {
    if (senderWs && client === senderWs && target === "UserTyping") {
      return;
    }
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(signalRMsg);
      } catch (_) {}
    }
  });
}

