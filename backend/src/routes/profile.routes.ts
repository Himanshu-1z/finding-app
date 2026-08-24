import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt, optionalJwt } from "../middleware/auth";

export const profileRouter = Router();

// GET /api/profile/me & GET /api/profile
const handleGetProfile = async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const rawUserId = req.user?.id;
    if (!rawUserId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const user = await prisma.user.findUnique({
      where: { id: rawUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.json({
      id: user.id,
      name: user.realName || user.anonymousUsername,
      secretName: user.anonymousUsername,
      email: user.email,
      gender: user.gender,
      dob: user.dateOfBirth ? user.dateOfBirth.toISOString().split("T")[0] : "",
      college: user.collegeName,
      branch: user.branch,
      semester: user.yearSemester,
      mobile: user.mobileNumber,
      avatarUrl: user.avatarUrl,
      capturedIdImage: user.studentIdPhotoUrl,
      isVerifiedBadge: user.isVerifiedBadge,
      role: user.role,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

profileRouter.get("/", authenticateJwt, handleGetProfile);
profileRouter.get("/me", authenticateJwt, handleGetProfile);

// PUT /api/profile
profileRouter.put("/", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { name, secretName, gender, dob, college, branch, semester, mobile, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        realName: name !== undefined ? name : undefined,
        anonymousUsername: secretName !== undefined ? secretName : undefined,
        gender: gender !== undefined ? gender : undefined,
        dateOfBirth: dob ? new Date(dob) : undefined,
        collegeName: college !== undefined ? college : undefined,
        branch: branch !== undefined ? branch : undefined,
        yearSemester: semester !== undefined ? semester : undefined,
        mobileNumber: mobile !== undefined ? mobile : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    return res.json({
      id: user.id,
      name: user.realName,
      secretName: user.anonymousUsername,
      email: user.email,
      college: user.collegeName,
      branch: user.branch,
      semester: user.yearSemester,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

