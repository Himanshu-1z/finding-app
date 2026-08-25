import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt } from "../middleware/auth";

export const notificationRouter = Router();

// GET /api/notifications
notificationRouter.get("/", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

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
    console.error("Fetch notifications error:", err.message);
    return res.status(500).json({ error: "Failed to fetch notifications from database." });
  }
});

// PUT /api/notifications/:id/read
notificationRouter.put("/:id/read", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const notifId = String(req.params.id);
    const userId = req.user!.id;

    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) return res.status(404).json({ error: "Notification not found" });
    if (notif.userId !== userId && req.user?.role !== "Admin" && req.user?.role !== "Super Admin") {
      return res.status(403).json({ error: "Forbidden. Not your notification." });
    }

    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

