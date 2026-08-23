import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { optionalJwt } from "../middleware/auth";

export const notificationRouter = Router();

// GET /api/notifications
notificationRouter.get("/", optionalJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json([]);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (err: any) {
    return res.json([]);
  }
});

// PUT /api/notifications/:id/read
notificationRouter.put("/:id/read", optionalJwt, async (req: Request, res: Response) => {
  try {
    const notifId = String(req.params.id);
    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

