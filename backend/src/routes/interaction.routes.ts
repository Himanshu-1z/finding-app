import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt, optionalJwt } from "../middleware/auth";
import { emitToUser, broadcastGlobal } from "../websocket/chatHub";

export const interactionRouter = Router();

// GET /api/interaction/my
interactionRouter.get("/my", optionalJwt, async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const rawUserId = req.user?.id;
    let user: any = null;

    if (rawUserId) {
      user = await prisma.user.findUnique({ where: { id: rawUserId } });
    }
    if (!user && req.user?.email) {
      user = await prisma.user.findUnique({ where: { email: req.user.email } });
    }
    if (!user && req.user?.mysteryName) {
      user = await prisma.user.findUnique({ where: { anonymousUsername: req.user.mysteryName } });
    }

    const currentUserId = user?.id || rawUserId;
    if (!currentUserId) {
      return res.json({ incoming: [], outgoing: [], value: [], count: 0 });
    }

    const currentMystery = user?.anonymousUsername || req.user?.mysteryName;

    const incomingRequests = await prisma.interactionRequest.findMany({
      where: {
        OR: [
          { confessorId: currentUserId },
          ...(currentMystery ? [{ confessor: { anonymousUsername: currentMystery } }] : []),
          ...(user?.email ? [{ confessor: { email: user.email } }] : []),
        ],
      },
      include: {
        targetUser: true,
        confessor: true,
        confession: true,
        chatRoom: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const outgoingRequests = await prisma.interactionRequest.findMany({
      where: {
        OR: [
          { targetUserId: currentUserId },
          ...(currentMystery ? [{ targetUser: { anonymousUsername: currentMystery } }] : []),
          ...(user?.email ? [{ targetUser: { email: user.email } }] : []),
        ],
      },
      include: {
        confessor: true,
        targetUser: true,
        confession: true,
        chatRoom: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const incoming = incomingRequests.map((i) => ({
      id: i.id,
      fromUser: i.targetUser?.anonymousUsername || "Anonymous",
      requesterId: i.targetUserId,
      avatarUrl: i.targetUser?.avatarUrl || null,
      confessionId: i.confessionId,
      confessionContent: i.confession?.content || "",
      status: (i.confessorAction || "pending").toLowerCase(),
      response: i.targetResponse,
      createdAt: i.createdAt,
      chatRoomId: i.chatRoom?.id || null,
    }));

    const outgoing = outgoingRequests.map((i) => ({
      id: i.id,
      toUser: i.confessor?.anonymousUsername || "Author",
      authorId: i.confessorId,
      avatarUrl: i.confessor?.avatarUrl || null,
      confessionId: i.confessionId,
      confessionContent: i.confession?.content || "",
      status: (i.confessorAction || "pending").toLowerCase(),
      response: i.targetResponse,
      createdAt: i.createdAt,
      chatRoomId: i.chatRoom?.id || null,
    }));

    return res.json({
      incoming,
      outgoing,
      value: [...incoming, ...outgoing],
      count: incoming.length + outgoing.length,
    });
  } catch (err: any) {
    console.error("Fetch interactions error:", err);
    return res.json({ incoming: [], outgoing: [], value: [], count: 0 });
  }
});

// POST /api/interaction/respond
interactionRouter.post("/respond", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { confessionId, response } = req.body;
    const userId = req.user!.id;

    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      include: { author: true },
    });
    if (!confession) {
      return res.status(404).json({ error: "Confession not found." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    if (confession.authorId === user.id) {
      return res.status(400).json({ error: "You cannot send an interaction request to your own story." });
    }

    let interaction = await prisma.interactionRequest.findFirst({
      where: {
        confessionId,
        targetUserId: user.id,
      },
    });

    if (interaction) {
      await prisma.interactionRequest.update({
        where: { id: interaction.id },
        data: {
          confessorAction: "Pending",
          targetResponse: response === 3 ? "InteractRequested" : "None",
          respondedAt: new Date(),
        },
      });
    } else {
      interaction = await prisma.interactionRequest.create({
        data: {
          confessionId,
          targetUserId: user.id,
          confessorId: confession.authorId,
          targetResponse: response === 3 ? "InteractRequested" : "None",
          confessorAction: "Pending",
          respondedAt: new Date(),
        },
      });
    }

    // In-app notification and real-time socket push for the author
    try {
      const notif = await prisma.notification.create({
        data: {
          userId: confession.authorId,
          type: "InteractRequest",
          title: "New Connection Request! 💬",
          body: `${user.anonymousUsername || "Someone"} wants to interact with your story: "${confession.content.substring(0, 35)}..."`,
        },
      });
      emitToUser(confession.authorId, "NotificationReceived", notif);
      emitToUser(confession.authorId, "InteractionRequestReceived", {
        id: interaction.id,
        fromUser: user.anonymousUsername || "Anonymous",
        requesterId: user.id,
        confessionId: confession.id,
        confessionContent: confession.content,
        status: "pending",
        createdAt: interaction.createdAt,
      });
      broadcastGlobal("AdminActivity", {
        type: "interaction",
        title: "New Interaction Request",
        actor: user.anonymousUsername,
        description: `Requested connection on confession #${confession.id.substring(0, 8)}`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return res.json({ success: true, interactionId: interaction.id });
  } catch (err: any) {
    console.error("Interaction respond error:", err);
    return res.status(500).json({ error: err.message || "Failed to respond." });
  }
});

// POST /api/interaction/confessor-action
interactionRouter.post("/confessor-action", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { interactionRequestId, action } = req.body;
    const currentUserId = req.user!.id;
    const userRole = req.user?.role;

    // 2=Accepted, 3=Declined
    const statusStr = action === 2 || action === "2" || action === "Accepted" ? "Accepted" : "Declined";

    const interaction = await prisma.interactionRequest.findUnique({
      where: { id: interactionRequestId },
      include: { confessor: true, targetUser: true, confession: true },
    });
    if (!interaction) {
      return res.status(404).json({ error: "Interaction request not found." });
    }

    if (interaction.confessorId !== currentUserId && interaction.targetUserId !== currentUserId && userRole !== "Admin" && userRole !== "Super Admin") {
      return res.status(403).json({ error: "Forbidden. You are not authorized to accept or decline this request." });
    }

    await prisma.interactionRequest.update({
      where: { id: interactionRequestId },
      data: {
        confessorAction: statusStr,
        respondedAt: new Date(),
      },
    });

    let chatRoomId: string | null = null;

    if (statusStr === "Accepted") {
      let chatRoom = await prisma.chatRoom.findFirst({
        where: { interactionRequestId: interaction.id },
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            interactionRequestId: interaction.id,
            user1Id: interaction.confessorId,
            user2Id: interaction.targetUserId,
            isActive: true,
          },
        });
      }
      chatRoomId = chatRoom.id;

      // In-app notification for the requester
      try {
        const notif = await prisma.notification.create({
          data: {
            userId: interaction.targetUserId,
            type: "RequestAccepted",
            title: "Connection Accepted! 🎉",
            body: `${interaction.confessor?.anonymousUsername || "Author"} accepted your connection request! Tap to start chatting.`,
          },
        });
        emitToUser(interaction.targetUserId, "NotificationReceived", notif);
        emitToUser(interaction.targetUserId, "InteractionOutcomeReceived", {
          requestId: interaction.id,
          action: "Accepted",
          status: "accepted",
          chatRoomId: chatRoom.id,
          confessorName: interaction.confessor?.anonymousUsername || "Author",
        });
        emitToUser(interaction.confessorId, "InteractionOutcomeUpdated", {
          requestId: interaction.id,
          action: "Accepted",
          status: "accepted",
          chatRoomId: chatRoom.id,
        });
      } catch (_) {}
    } else {
      emitToUser(interaction.targetUserId, "InteractionOutcomeReceived", {
        requestId: interaction.id,
        action: "Declined",
        status: "declined",
      });
    }

    return res.json({ success: true, chatRoomId, status: statusStr });
  } catch (err: any) {
    console.error("Confessor action error:", err);
    return res.status(500).json({ error: err.message || "Failed to process action." });
  }
});
