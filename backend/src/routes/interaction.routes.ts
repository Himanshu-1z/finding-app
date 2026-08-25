import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt, optionalJwt } from "../middleware/auth";
import { emitToUser, broadcastGlobal } from "../websocket/chatHub";

export const interactionRouter = Router();

// GET /api/interaction/my
interactionRouter.get("/my", authenticateJwt, async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const userId = req.user!.id;
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return res.status(401).json({ error: "Unauthorized user." });
    }

    const allRequests = await prisma.interactionRequest.findMany({
      where: {
        OR: [{ confessorId: dbUser.id }, { targetUserId: dbUser.id }],
      },
      include: {
        targetUser: true,
        confessor: true,
        confession: true,
        chatRoom: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const incoming: any[] = [];
    const outgoing: any[] = [];

    for (const r of allRequests) {
      const isTaggedStoryRequest = r.targetResponse === "TaggedAlert";

      if (isTaggedStoryRequest) {
        // Tagged story flow: Author (confessorId) initiated -> Tagged student (targetUserId) receives action
        if (r.targetUserId === dbUser.id) {
          incoming.push({
            id: r.id,
            fromUser: r.confessor?.anonymousUsername || "Author",
            requesterId: r.confessorId,
            avatarUrl: r.confessor?.avatarUrl || null,
            confessionId: r.confessionId,
            confessionContent: r.confession?.content || "Secret tagged confession for you",
            status: (r.confessorAction || "pending").toLowerCase(),
            response: r.targetResponse,
            createdAt: r.createdAt,
            chatRoomId: r.chatRoom?.id || null,
            isTaggedStory: true,
          });
        } else if (r.confessorId === dbUser.id) {
          outgoing.push({
            id: r.id,
            toUser: r.targetUser?.anonymousUsername || r.targetUser?.realName || "Tagged Student",
            authorId: r.targetUserId,
            avatarUrl: r.targetUser?.avatarUrl || null,
            confessionId: r.confessionId,
            confessionContent: r.confession?.content || "Story tagged for " + (r.targetUser?.realName || "student"),
            status: (r.confessorAction || "pending").toLowerCase(),
            response: r.targetResponse,
            createdAt: r.createdAt,
            chatRoomId: r.chatRoom?.id || null,
            isTaggedStory: true,
          });
        }
      } else {
        // Viewer interaction flow: Viewer (targetUserId) requested -> Author (confessorId) receives action
        if (r.confessorId === dbUser.id) {
          incoming.push({
            id: r.id,
            fromUser: r.targetUser?.anonymousUsername || "Anonymous",
            requesterId: r.targetUserId,
            avatarUrl: r.targetUser?.avatarUrl || null,
            confessionId: r.confessionId,
            confessionContent: r.confession?.content || "",
            status: (r.confessorAction || "pending").toLowerCase(),
            response: r.targetResponse,
            createdAt: r.createdAt,
            chatRoomId: r.chatRoom?.id || null,
            isTaggedStory: false,
          });
        } else if (r.targetUserId === dbUser.id) {
          outgoing.push({
            id: r.id,
            toUser: r.confessor?.anonymousUsername || "Author",
            authorId: r.confessorId,
            avatarUrl: r.confessor?.avatarUrl || null,
            confessionId: r.confessionId,
            confessionContent: r.confession?.content || "",
            status: (r.confessorAction || "pending").toLowerCase(),
            response: r.targetResponse,
            createdAt: r.createdAt,
            chatRoomId: r.chatRoom?.id || null,
            isTaggedStory: false,
          });
        }
      }
    }

    return res.json({
      incoming,
      outgoing,
      value: [...incoming, ...outgoing],
      count: incoming.length + outgoing.length,
    });
  } catch (err: any) {
    console.error("Fetch interactions error:", err.message);
    return res.status(500).json({ error: "Failed to fetch interaction requests from database." });
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
          data: JSON.stringify({ confessionId: confession.id, interactionRequestId: interaction.id }),
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
    console.error("Interaction respond error:", err.message);
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

    // Determine the authorized action-taker for this exact request
    const isTaggedStory = interaction.targetResponse === "TaggedAlert";
    const authorizedActionUserId = isTaggedStory ? interaction.targetUserId : interaction.confessorId;

    if (currentUserId !== authorizedActionUserId && userRole !== "Admin" && userRole !== "Super Admin") {
      const roleMsg = isTaggedStory ? "the tagged student" : "the story author";
      return res.status(403).json({ error: `Forbidden. Only ${roleMsg} is authorized to accept or decline this request.` });
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

      // In-app notification for the other party (the requester)
      const recipientOfAcceptedAlert = currentUserId === interaction.targetUserId ? interaction.confessorId : interaction.targetUserId;
      const actorName = currentUserId === interaction.targetUserId
        ? (interaction.targetUser?.anonymousUsername || "Student")
        : (interaction.confessor?.anonymousUsername || "Author");

      try {
        const notif = await prisma.notification.create({
          data: {
            userId: recipientOfAcceptedAlert,
            type: "RequestAccepted",
            title: "Connection Accepted! 🎉",
            body: `${actorName} accepted the connection! Tap to open chat.`,
            data: JSON.stringify({ chatRoomId: chatRoom.id, interactionRequestId: interaction.id }),
          },
        });
        emitToUser(recipientOfAcceptedAlert, "NotificationReceived", notif);
        emitToUser(recipientOfAcceptedAlert, "InteractionOutcomeReceived", {
          requestId: interaction.id,
          action: "Accepted",
          status: "accepted",
          chatRoomId: chatRoom.id,
          confessorName: actorName,
        });
        emitToUser(currentUserId, "InteractionOutcomeUpdated", {
          requestId: interaction.id,
          action: "Accepted",
          status: "accepted",
          chatRoomId: chatRoom.id,
        });
      } catch (_) {}
    } else {
      const recipientOfDeclinedAlert = currentUserId === interaction.targetUserId ? interaction.confessorId : interaction.targetUserId;
      emitToUser(recipientOfDeclinedAlert, "InteractionOutcomeReceived", {
        requestId: interaction.id,
        action: "Declined",
        status: "declined",
      });
    }

    return res.json({ success: true, chatRoomId, status: statusStr });
  } catch (err: any) {
    console.error("Confessor action error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to process action." });
  }
});
