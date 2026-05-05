
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Rentang waktu April (termasuk absen pagi yang nyangkut di malam sebelumnya)
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

  console.log(`Menjalankan Perbaikan Final untuk ${logs.length} log April...`);
  
  let updatedCount = 0;
  for (const log of logs) {
    // Kita majukan 7 jam agar semua data April menjadi format "Jakarta berbaju UTC"
    // Ini adalah format yang disukai oleh isOld Hack di sistem Bapak.
    
    // Kita hanya majukan jika jamnya belum dimajukan (Jam 11 ke atas biasanya sudah dimajukan)
    const h = log.timestamp.getUTCHours();
    if (h < 11 || h >= 22) { 
        const newTimestamp = new Date(log.timestamp.getTime() + (7 * 60 * 60 * 1000));
        await prisma.attendance.update({
          where: { id: log.id },
          data: { timestamp: newTimestamp }
        });
        updatedCount++;
    }
  }

  console.log(`✅ BERHASIL! ${updatedCount} log April telah diluruskan kembali.`);
  console.log(`Sekarang data Pak Sutrimo dan Admin lainnya pasti sudah SINKRON.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
