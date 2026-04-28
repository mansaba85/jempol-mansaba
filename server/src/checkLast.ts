import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const d1 = await prisma.attendance.findFirst({ where: { deviceId: 1 }, orderBy: { timestamp: 'desc' } });
  console.log("Device 1 last:", d1);
  const d5 = await prisma.attendance.findFirst({ where: { deviceId: 5 }, orderBy: { timestamp: 'desc' } });
  console.log("Device 5 last:", d5);
}
check().finally(() => prisma.$disconnect());
