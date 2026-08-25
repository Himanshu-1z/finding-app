import { PrismaClient } from "@prisma/client";

const ACTIVE_SUPABASE_URL =
  "postgresql://postgres.sdnzfejfmxfranqqfxsc:%40Himanshu5134@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

function getActiveDatabaseUrl(): string {
  const envUrl = (process.env.DATABASE_URL || "").trim();
  // Fall back if env is missing or contains obsolete tenant identifier
  if (!envUrl || envUrl.includes("qdfukwfxlssyuvtuvxwb")) {
    return ACTIVE_SUPABASE_URL;
  }
  return envUrl;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getActiveDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

prisma.$connect()
  .then(() => {
    console.log("Connected to PostgreSQL / Supabase successfully via Prisma");
  })
  .catch((err) => {
    console.error("Prisma Database Connection Error:", err.message);
  });

