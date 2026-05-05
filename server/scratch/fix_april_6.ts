
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2026-04-06T00:00:00Z');
  const end = new Date('2026-04-06T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end
      }
    }
  });

  console.log(`Ditemukan ${logs.length} log pada tanggal 6 April 2026.`);
  
  let updatedCount = 0;
  for (const log of logs) {
    const newTimestamp = new Date(log.timestamp.getTime() + (7 * 60 * 60 * 1000));
    await prisma.attendance.update({
      where: { id: log.id },
      data: { timestamp: newTimestamp }
    });
    updatedCount++;
  }

  console.log(`✅ Berhasil memperbaiki ${updatedCount} log untuk tanggal 6 April 2026.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
