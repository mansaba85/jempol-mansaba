
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2026-03-31T15:00:00Z');
  const end = new Date('2026-04-30T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end
      }
    }
  });

  console.log(`Mengembalikan ${logs.length} log April ke format asal...`);
  
  let updatedCount = 0;
  for (const log of logs) {
    // Kita kurangi 7 jam (kembali ke format "Jakarta berbaju UTC")
    // Tapi kita hanya kurangi jika jamnya mencurigakan (jam 13 ke atas)
    const h = log.timestamp.getUTCHours();
    if (h >= 11) { // Logika: Jam 06 pagi dimajukan jadi 13. Jadi kalau >= 11 kita balikin.
        const newTimestamp = new Date(log.timestamp.getTime() - (7 * 60 * 60 * 1000));
        await prisma.attendance.update({
          where: { id: log.id },
          data: { timestamp: newTimestamp }
        });
        updatedCount++;
    }
  }

  console.log(`✅ Berhasil mengembalikan ${updatedCount} log April.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
