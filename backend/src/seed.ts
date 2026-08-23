import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { role: "Admin" } });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("Admin@12345", salt);
      await prisma.user.create({
        data: {
          anonymousUsername: "SuperAdmin",
          email: "admin@finding.app",
          passwordHash,
          realName: "System Administrator",
          role: "Admin",
          collegeName: "Arya (MAIN), kukas",
          branch: "Computer Science",
          yearSemester: "8",
          isVerifiedBadge: true,
          isSetupComplete: true,
        },
      });
      console.log("Admin account provisioned.");
    }
  } catch (err: any) {
    console.warn("Database seed notice:", err.message);
  }
}
