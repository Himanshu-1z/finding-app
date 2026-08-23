import { PrismaClient } from "@prisma/client";

const realPrisma = new PrismaClient({
  log: ["error"],
});

let isDatabaseConnected = false;

realPrisma.$connect()
  .then(() => {
    isDatabaseConnected = true;
    console.log("Connected to PostgreSQL / Supabase successfully via Prisma");
  })
  .catch(() => {
    isDatabaseConnected = false;
    console.log("Running in resilient Local Memory Store mode (configure DATABASE_URL in .env to connect to Supabase).");
  });

// In-Memory Database Store for Instant Local Testing & Offline Resiliency
class MemoryStore {
  users: any[] = [];
  confessions: any[] = [];
  confessionLikes: any[] = [];
  confessionComments: any[] = [];
  interactionRequests: any[] = [];
  chatRooms: any[] = [];
  chatMessages: any[] = [];
  notifications: any[] = [];
  studentVerifications: any[] = [];
  reports: any[] = [];
  payments: any[] = [];

  constructor() {
    this.seedDefaultData();
  }

  seedDefaultData() {
    // No mock/sample data inserted - completely clean for real student accounts and stories
  }
}

const memory = new MemoryStore();

function createGenericRepo(prismaKey: string, memoryKey: keyof MemoryStore, idPrefix: string) {
  const getDelegate = () => (realPrisma as any)[prismaKey];

  return {
    async count(args?: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().count(args);
        } catch (err: any) {
          console.warn(`Prisma count on ${prismaKey}:`, err.message);
        }
      }
      return (memory[memoryKey] as any[]).length;
    },
    async findMany(args?: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().findMany(args);
        } catch (err: any) {
          console.warn(`Prisma findMany on ${prismaKey}:`, err.message);
        }
      }
      let list = [...(memory[memoryKey] as any[])];
      if (args?.where) {
        const matchesWhere = (item: any, whereObj: any): boolean => {
          for (const key of Object.keys(whereObj)) {
            const val = whereObj[key];
            if (val === undefined) continue;
            if (key === "AND" && Array.isArray(val)) {
              if (!val.every((sub) => matchesWhere(item, sub))) return false;
            } else if (key === "OR" && Array.isArray(val)) {
              if (!val.some((sub) => matchesWhere(item, sub))) return false;
            } else if (typeof val === "object" && val !== null) {
              if (val.contains) {
                if (!String(item[key] || "").toLowerCase().includes(val.contains.toLowerCase())) return false;
              } else if (val.equals) {
                if (String(item[key] || "").toLowerCase() !== String(val.equals).toLowerCase()) return false;
              }
            } else if (item[key] !== val) {
              return false;
            }
          }
          return true;
        };

        list = list.filter((item) => matchesWhere(item, args.where));
      }

      // Populate relations for in-memory fallback
      return list.map((item) => {
        const copy = { ...item };
        if (memoryKey === "confessions") {
          copy.author = memory.users.find((u) => u.id === item.authorId);
          copy.likes = memory.confessionLikes.filter((l) => l.confessionId === item.id);
          copy.comments = memory.confessionComments.filter((c) => c.confessionId === item.id);
        } else if (memoryKey === "chatRooms") {
          copy.user1 = memory.users.find((u) => u.id === item.user1Id);
          copy.user2 = memory.users.find((u) => u.id === item.user2Id);
          copy.messages = memory.chatMessages.filter((m) => m.chatRoomId === item.id);
        } else if (memoryKey === "chatMessages") {
          copy.sender = memory.users.find((u) => u.id === item.senderId);
        } else if (memoryKey === "studentVerifications") {
          copy.user = memory.users.find((u) => u.id === item.userId);
        } else if (memoryKey === "interactionRequests") {
          copy.targetUser = memory.users.find((u) => u.id === item.targetUserId);
          copy.confessor = memory.users.find((u) => u.id === item.confessorId);
          copy.confession = memory.confessions.find((c) => c.id === item.confessionId);
          copy.chatRoom = memory.chatRooms.find((r) => r.interactionRequestId === item.id);
        }
        return copy;
      });
    },
    async findUnique(args: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().findUnique(args);
        } catch (err: any) {
          console.warn(`Prisma findUnique on ${prismaKey}:`, err.message);
        }
      }
      const list = await this.findMany(args);
      return list[0] || null;
    },
    async findFirst(args?: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().findFirst(args);
        } catch (err: any) {
          console.warn(`Prisma findFirst on ${prismaKey}:`, err.message);
        }
      }
      const list = await this.findMany(args);
      return list[0] || null;
    },
    async create(args: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().create(args);
        } catch (err: any) {
          console.warn(`Prisma create on ${prismaKey}:`, err.message);
        }
      }
      const newItem = {
        id: args.data?.id || `${idPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
      };
      (memory[memoryKey] as any[]).push(newItem);
      return this.findUnique({ where: { id: newItem.id } });
    },
    async createMany(args: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().createMany(args);
        } catch (err: any) {
          console.warn(`Prisma createMany on ${prismaKey}:`, err.message);
        }
      }
      if (Array.isArray(args.data)) {
        for (const d of args.data) {
          (memory[memoryKey] as any[]).push({
            id: `${idPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            ...d,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
      return { count: args.data?.length || 0 };
    },
    async update(args: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().update(args);
        } catch (err: any) {
          console.warn(`Prisma update on ${prismaKey}:`, err.message);
        }
      }
      const item = (memory[memoryKey] as any[]).find((x) => x.id === args.where.id);
      if (item) {
        Object.assign(item, args.data, { updatedAt: new Date() });
      }
      return item;
    },
    async delete(args: any) {
      if (isDatabaseConnected && getDelegate()) {
        try {
          return await getDelegate().delete(args);
        } catch (err: any) {
          console.warn(`Prisma delete on ${prismaKey}:`, err.message);
        }
      }
      const idx = (memory[memoryKey] as any[]).findIndex((x) => x.id === args.where.id);
      if (idx !== -1) {
        const deleted = (memory[memoryKey] as any[]).splice(idx, 1);
        return deleted[0];
      }
      return null;
    },
  };
}

export const prisma = {
  $connect: () => realPrisma.$connect(),
  user: createGenericRepo("user", "users", "usr"),
  confession: createGenericRepo("confession", "confessions", "conf"),
  confessionLike: createGenericRepo("confessionLike", "confessionLikes", "like"),
  confessionComment: createGenericRepo("confessionComment", "confessionComments", "comm"),
  interactionRequest: createGenericRepo("interactionRequest", "interactionRequests", "req"),
  chatRoom: createGenericRepo("chatRoom", "chatRooms", "room"),
  ChatMessage: createGenericRepo("chatMessage", "chatMessages", "msg"),
  chatMessage: createGenericRepo("chatMessage", "chatMessages", "msg"),
  notification: createGenericRepo("notification", "notifications", "notif"),
  studentVerification: createGenericRepo("studentVerification", "studentVerifications", "ver"),
  report: createGenericRepo("report", "reports", "rep"),
  payment: createGenericRepo("payment", "payments", "pay"),
};


