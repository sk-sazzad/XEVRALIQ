import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@unifiedinbox.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@unifiedinbox.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("   Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
