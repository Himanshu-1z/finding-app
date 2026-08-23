import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { optionalJwt } from "../middleware/auth";

export const verificationRouter = Router();

// POST /api/verification/upload
verificationRouter.post("/upload", optionalJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { studentIdPhotoUrl, capturedIdImage } = req.body;
    const photo = studentIdPhotoUrl || capturedIdImage;

    if (!photo) {
      return res.status(400).json({ error: "Photo is required." });
    }

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { studentIdPhotoUrl: photo },
      });

      const verification = await prisma.studentVerification.create({
        data: {
          userId,
          studentIdPhotoUrl: photo,
          status: "Pending",
        },
      });

      return res.json({ success: true, verificationId: verification.id });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/verification/status
verificationRouter.get("/status", optionalJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json({ status: "None" });

    const verification = await prisma.studentVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });

    return res.json({
      status: verification ? verification.status : "None",
      isVerifiedBadge: verification?.status === "Approved",
    });
  } catch (err: any) {
    return res.json({ status: "None" });
  }
});

