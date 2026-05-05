
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Rentang waktu 1 April 2026 (UTC)
  const start = new Date('2026-04-01T00:00:00Z');
  const end = new Date('2026-04-01T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end
      }
    }
  });

  console.log(`Ditemukan ${logs.length} log pada tanggal 1 April 2026.`);
  
  let updatedCount = 0;
  for (const log of logs) {
    // Tambah 7 jam (7 * 60 * 60 * 1000 ms)
    const newTimestamp = new Date(log.timestamp.getTime() + (7 * 60 * 60 * 1000));
    
    await prisma.attendance.update({
      where: { id: log.id },
      data: { timestamp: newTimestamp }
    });
    updatedCount++;
  }

  console.log(`✅ Berhasil memperbaiki ${updatedCount} log untuk tanggal 1 April 2026.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
