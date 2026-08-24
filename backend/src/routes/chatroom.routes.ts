import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt } from "../middleware/auth";
import { broadcastToChatRoom } from "../websocket/chatHub";

export const chatRoomRouter = Router();

// GET /api/chatroom — Get all active chat rooms for current user
chatRoomRouter.get("/", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: true,
        user2: true,
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = rooms.map((r) => {
      const isUser1 = r.user1Id === userId;
      const partner = isUser1 ? r.user2 : r.user1;
      const partnerName = partner?.anonymousUsername || (isUser1 ? "User 2" : "User 1");
      const lastMsg = r.messages[0];
      const lastActiveTime = lastMsg ? new Date(lastMsg.sentAt).getTime() : new Date(r.createdAt).getTime();

      return {
        id: r.id,
        partnerId: partner?.id,
        name: partnerName,
        partnerName,
        letter: partnerName ? partnerName.charAt(0).toUpperCase() : "A",
        status: "Online",
        lastMessage: lastMsg ? lastMsg.content : "Connected! Say hello 👋",
        lastSenderId: lastMsg?.senderId,
        time: lastMsg ? getTimeAgo(lastMsg.sentAt) : "Recently",
        lastActiveTime,
        unread: lastMsg ? (!lastMsg.isRead && lastMsg.senderId !== userId) : false,
        isActive: r.isActive,
        createdAt: r.createdAt,
        user1: { id: r.user1Id, name: r.user1?.anonymousUsername },
        user2: { id: r.user2Id, name: r.user2?.anonymousUsername },
      };
    });

    mapped.sort((a, b) => b.lastActiveTime - a.lastActiveTime);

    return res.json(mapped);
  } catch (err: any) {
    console.error("Get chat rooms error:", err);
    return res.json([]);
  }
});

function getTimeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// GET /api/chatroom/:id
chatRoomRouter.get("/:id", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const chatRoomId = String(req.params.id);
    const currentUserId = req.user!.id;
    const userRole = req.user?.role;

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { user1: true, user2: true },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    const isParticipant = room.user1Id === currentUserId || room.user2Id === currentUserId || userRole === "Admin" || userRole === "Super Admin";
    if (!isParticipant) {
      return res.status(403).json({ error: "Access forbidden. You are not a participant in this room." });
    }

    const isUser1 = room.user1Id === currentUserId;
    const partner = isUser1 ? room.user2 : room.user1;
    const partnerName = partner?.anonymousUsername || (isUser1 ? "Student 2" : "Student 1");

    return res.json({
      id: room.id,
      partnerId: partner?.id,
      partnerName,
      name: partnerName,
      status: "Online",
      letter: partnerName ? partnerName.charAt(0).toUpperCase() : "A",
      user1: { id: room.user1Id, name: room.user1?.anonymousUsername },
      user2: { id: room.user2Id, name: room.user2?.anonymousUsername },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/chatroom/:id/messages
chatRoomRouter.get("/:id/messages", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const chatRoomId = String(req.params.id);
    const currentUserId = req.user!.id;
    const userRole = req.user?.role;

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    const isParticipant = room.user1Id === currentUserId || room.user2Id === currentUserId || userRole === "Admin" || userRole === "Super Admin";
    if (!isParticipant) {
      return res.status(403).json({ error: "Access forbidden. You are not a participant in this room." });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId },
      include: { sender: true },
      orderBy: { sentAt: "asc" },
      take: 100,
    });

    return res.json(
      messages.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        sender: currentUserId && m.senderId === currentUserId ? "me" : "them",
        senderName: m.sender?.anonymousUsername || "Anonymous",
        content: m.content,
        text: m.content,
        sentAt: m.sentAt,
        time: new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRead: m.isRead,
      }))
    );
  } catch (err: any) {
    return res.json([]);
  }
});

// POST /api/chatroom/:id/messages
chatRoomRouter.post("/:id/messages", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const chatRoomId = String(req.params.id);
    const senderId = req.user!.id;
    const { content } = req.body;

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Chat room not found." });
    }

    if (room.user1Id !== senderId && room.user2Id !== senderId && req.user?.role !== "Admin" && req.user?.role !== "Super Admin") {
      return res.status(403).json({ error: "Forbidden. You cannot send messages to this chat room." });
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      return res.status(404).json({ error: "Sender account not found." });
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId,
        senderId: sender.id,
        content: content || "",
        sentAt: new Date(),
      },
      include: { sender: true },
    });

    const payload = {
      id: message.id,
      chatRoomId,
      senderId: message.senderId,
      sender: "them",
      senderName: sender.anonymousUsername || "Anonymous",
      content: message.content,
      text: message.content,
      sentAt: message.sentAt.toISOString(),
      time: new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Broadcast to SignalR/WebSocket chat room
    try {
      broadcastToChatRoom(chatRoomId, "ReceiveMessage", payload);
    } catch (_) {}

    return res.json({
      id: message.id,
      senderId: message.senderId,
      sender: "me",
      senderName: sender.anonymousUsername || "Anonymous",
      content: message.content,
      text: message.content,
      sentAt: message.sentAt.toISOString(),
      time: new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (err: any) {
    console.error("Send message error:", err);
    return res.status(500).json({ error: err.message || "Failed to send message." });
  }
});

