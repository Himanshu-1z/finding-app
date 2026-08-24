import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

prisma.$connect()
  .then(() => {
    console.log("Connected to PostgreSQL / Supabase successfully via Prisma");
  })
  .catch((err) => {
    console.error("Prisma Database Connection Error:", err.message);
  });
