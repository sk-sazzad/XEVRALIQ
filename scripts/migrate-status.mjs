// Converts SHIPPED → CONFIRMED before enum change
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const updated = await db.$executeRaw`UPDATE orders SET status = 'CONFIRMED' WHERE status = 'SHIPPED'`;
console.log(`Updated ${updated} orders from SHIPPED → CONFIRMED`);
await db.$disconnect();
