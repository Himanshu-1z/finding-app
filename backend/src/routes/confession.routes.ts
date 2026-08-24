import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateJwt, optionalJwt } from "../middleware/auth";
import { emitToUser, broadcastGlobal } from "../websocket/chatHub";

export const confessionRouter = Router();

// GET /api/confession & /api/confession/feed
const handleGetFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userMysteryName = req.user?.mysteryName || "";
    const userRealName = (req.user as any)?.realName || "";
    const { college, branch, year, search } = req.query;

    const baseFilter: any = {
      status: "visible",
      isApproved: true,
    };

    if (college && college !== "All" && college !== "All Colleges") {
      whereFilter(baseFilter, "collegeName", String(college));
    }
    if (branch) whereFilter(baseFilter, "branch", String(branch));
    if (year) whereFilter(baseFilter, "yearSemester", String(year));
    if (search) {
      baseFilter.content = { contains: String(search), mode: "insensitive" };
    }

    // Visibility rules:
    // 1. Admins/Super Admins see all approved stories.
    // 2. Authenticated users see public stories PLUS tagged stories where they are author or tagged person.
    // 3. Unauthenticated/Guest see public stories only.
    let visibilityFilter: any;
    if (userRole === "Admin" || userRole === "Super Admin") {
      visibilityFilter = {};
    } else if (userId) {
      visibilityFilter = {
        OR: [
          { type: "public" },
          {
            type: "tagged",
            OR: [
              { authorId: userId },
              { targetPerson: { equals: userMysteryName, mode: "insensitive" } },
              { targetPerson: { equals: userRealName, mode: "insensitive" } },
            ],
          },
        ],
      };
    } else {
      visibilityFilter = { type: "public" };
    }

    const confessions = await prisma.confession.findMany({
      where: {
        AND: [baseFilter, visibilityFilter],
      },
      include: {
        author: true,
        likes: true,
        comments: true,
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    const userRequestsSet = new Set<string>();
    if (userId) {
      const activeRequests = await prisma.interactionRequest.findMany({
        where: {
          OR: [
            { targetUserId: userId },
            { confessorId: userId },
          ],
          confessorAction: {
            notIn: ["Declined", "declined", "Rejected", "rejected"],
          },
        },
        select: { confessionId: true },
      });
      activeRequests.forEach((r) => {
        if (r.confessionId) userRequestsSet.add(r.confessionId);
      });
    }

    const mapped = confessions.map((c) => {
      const isLiked = userId ? c.likes.some((l) => l.userId === userId) : false;
      const isRequested = userId ? userRequestsSet.has(c.id) : false;
      const isMine = userId ? c.authorId === userId : (userMysteryName && c.author?.anonymousUsername?.toLowerCase() === userMysteryName.toLowerCase());
      return {
        id: c.id,
        content: c.content,
        author: c.author?.anonymousUsername || "Anonymous",
        authorId: c.authorId,
        authorCollege: c.collegeName || c.author?.collegeName || "Campus",
        authorBranch: c.branch || c.author?.branch || "Student",
        authorYear: c.yearSemester || c.author?.yearSemester || "1",
        time: getTimeAgo(c.createdAt),
        createdAt: c.createdAt,
        likes: c.likes.length,
        likedByMe: isLiked,
        isRequested: isRequested,
        isMine: Boolean(isMine),
        type: c.type,
        targetPerson: c.targetPerson,
        isPinned: c.isPinned,
        reportCount: c.reportCount,
      };
    });

    return res.json(mapped);
  } catch (err: any) {
    console.error("Fetch feed error:", err);
    return res.json([]);
  }
};

function whereFilter(filterObj: any, field: string, value: string) {
  filterObj[field] = value;
}

confessionRouter.get("/", optionalJwt, handleGetFeed);
confessionRouter.get("/feed", optionalJwt, handleGetFeed);
confessionRouter.get("/search", optionalJwt, handleGetFeed);

// GET /api/confession/targeted
confessionRouter.get("/targeted", optionalJwt, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const myName = user?.mysteryName || "";
    const confessions = await prisma.confession.findMany({
      where: {
        type: "tagged",
        targetPerson: { contains: myName, mode: "insensitive" },
      },
      include: { author: true, likes: true },
    });
    return res.json(confessions);
  } catch (_) {
    return res.json([]);
  }
});

// GET /api/confession/my
confessionRouter.get("/my", optionalJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json([]);
    const confessions = await prisma.confession.findMany({
      where: { authorId: userId },
      include: { author: true, likes: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(
      confessions.map((c) => ({
        id: c.id,
        content: c.content,
        author: c.author?.anonymousUsername || "Me",
        authorId: c.authorId,
        authorCollege: c.collegeName || "Campus",
        authorBranch: c.branch || "General",
        authorYear: c.yearSemester || "1",
        createdAt: c.createdAt,
        likes: c.likes.length,
        likesCount: c.likes.length,
        type: c.type,
        isMine: true,
      }))
    );
  } catch (_) {
    return res.json([]);
  }
});

// GET /api/confession/users/search
confessionRouter.get("/users/search", optionalJwt, async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || req.query.search || "").trim();
    if (!query) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { anonymousUsername: { contains: query, mode: "insensitive" } },
          { realName: { contains: query, mode: "insensitive" } },
          { collegeName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    return res.json(
      users.map((u: any) => ({
        id: u.id,
        name: u.realName || u.anonymousUsername,
        secretName: u.anonymousUsername,
        college: u.collegeName || "Campus",
        branch: u.branch || "Student",
        semester: u.yearSemester || "1",
        isVerifiedBadge: u.isVerifiedBadge || false,
      }))
    );
  } catch (_) {
    return res.json([]);
  }
});

// POST /api/confession
confessionRouter.post("/", optionalJwt, async (req: Request, res: Response) => {
  try {
    const { content, targetPerson, type, college, branch, semester, authorMysteryName, authorRealName } = req.body;
    let userId = req.user?.id;

    let user: any = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && authorMysteryName && (user.anonymousUsername.startsWith("Anon_") || user.anonymousUsername !== authorMysteryName)) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              anonymousUsername: authorMysteryName,
              realName: authorRealName || user.realName || "",
              collegeName: college || user.collegeName || "Arya (MAIN), kukas",
              branch: branch || user.branch || "CS",
              yearSemester: semester || user.yearSemester || "1",
            },
          });
        } catch (_) {}
      }
    }

    if (!user) {
      // Create user with student's chosen name
      const chosenName = authorMysteryName || "Student_" + Math.random().toString(36).substring(2, 7);
      user = await prisma.user.create({
        data: {
          anonymousUsername: chosenName,
          realName: authorRealName || chosenName,
          email: `guest_${Date.now()}@finding.app`,
          passwordHash: "auto_hash",
          collegeName: college || "Arya (MAIN), kukas",
          branch: branch || "CS",
          yearSemester: semester || "1",
        },
      });
      userId = user.id;
    }

    const confession = await prisma.confession.create({
      data: {
        authorId: user.id,
        content: content || "",
        targetPerson: targetPerson || null,
        type: type || "public",
        collegeName: college || user.collegeName || "Arya (MAIN), kukas",
        branch: branch || user.branch || "CS",
        yearSemester: semester || user.yearSemester || "1",
        isApproved: true,
        status: "visible",
      },
      include: {
        author: true,
      },
    });

    const authorDisplayName = authorMysteryName || confession.author?.anonymousUsername || user.anonymousUsername || "Anonymous";

    return res.status(201).json({
      id: confession.id,
      content: confession.content,
      author: authorDisplayName,
      authorId: confession.authorId,
      authorCollege: confession.collegeName,
      authorBranch: confession.branch,
      authorYear: confession.yearSemester,
      time: "Just now",
      createdAt: confession.createdAt,
      likes: 0,
      likedByMe: false,
      isRequested: false,
      type: confession.type,
      targetPerson: confession.targetPerson,
      isPinned: false,
    });
  } catch (err: any) {
    console.error("Create confession error:", err);
    return res.status(500).json({ error: err.message || "Failed to create confession." });
  }
});

// POST /api/confession/:id/like
confessionRouter.post("/:id/like", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const confessionId = String(req.params.id);
    const userId = req.user!.id;

    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      include: { author: true },
    });

    if (!confession) {
      return res.status(404).json({ error: "Confession not found." });
    }

    const existing = await prisma.confessionLike.findUnique({
      where: {
        confessionId_userId: {
          confessionId,
          userId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await prisma.confessionLike.delete({
        where: { id: existing.id },
      });
      liked = false;
    } else {
      await prisma.confessionLike.create({
        data: {
          confessionId,
          userId,
        },
      });
      liked = true;

      // In-app notification for story author
      if (confession.authorId && confession.authorId !== userId) {
        try {
          const liker = await prisma.user.findUnique({ where: { id: userId } });
          const notif = await prisma.notification.create({
            data: {
              userId: confession.authorId,
              type: "StoryLiked",
              title: "New Like on your Story! ❤️",
              body: `${liker?.anonymousUsername || "Someone"} liked your story: "${confession.content.substring(0, 40)}..."`,
            },
          });
          emitToUser(confession.authorId, "NotificationReceived", notif);
        } catch (_) {}
      }
    }

    const totalLikes = await prisma.confessionLike.count({ where: { confessionId } });

    // Real-time broadcast updated like count to everyone
    broadcastGlobal("ConfessionLiked", { id: confessionId, likes: totalLikes, likedByMe: liked });

    return res.json({ id: confessionId, liked, likes: totalLikes, likesCount: totalLikes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/confession/:id/comments
confessionRouter.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const confessionId = String(req.params.id);
    const comments = await prisma.confessionComment.findMany({
      where: { confessionId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        author: c.author?.anonymousUsername || "Anonymous",
        time: getTimeAgo(c.createdAt),
      }))
    );
  } catch (err: any) {
    return res.json([]);
  }
});

// POST /api/confession/:id/comments
confessionRouter.post("/:id/comments", optionalJwt, async (req: Request, res: Response) => {
  try {
    const confessionId = String(req.params.id);
    let userId = req.user?.id;
    if (!userId) {
      const guest = await prisma.user.findFirst();
      userId = guest?.id || "";
    }
    const { content } = req.body;
    const comment = await prisma.confessionComment.create({
      data: {
        confessionId,
        authorId: userId,
        content: content || "",
      },
      include: { author: true },
    });
    return res.json({
      id: comment.id,
      content: comment.content,
      author: (comment as any).author?.anonymousUsername || "Anonymous",
      time: "Just now",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

