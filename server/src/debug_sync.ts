import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const latest = await prisma.attendance.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5
  });
  console.log("Latest logs in DB:", latest);
  
  // also check how many logs are from today
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayLogs = await prisma.attendance.count({
    where: { timestamp: { gte: today } }
  });
  console.log("Logs today:", todayLogs);
}
check().finally(() => prisma.$disconnect());
