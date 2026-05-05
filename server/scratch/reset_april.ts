
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2026-03-31T00:00:00Z');
  const end = new Date('2026-04-30T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: { timestamp: { gte: start, lte: end } }
  });

  console.log(`Menganalisa ${logs.length} log April untuk dikembalikan ke format mesin...`);
  
  let resetCount = 0;
  for (const log of logs) {
    // Kita kurangi 7 jam jika jamnya sekarang ada di jam "setelah perbaikan"
    // Logika: Jam 06 pagi aslinya 23 malam. Jam 14 siang aslinya 07 pagi.
    const h = log.timestamp.getUTCHours();
    
    // Jika jam 05-18 UTC, kemungkinan besar ini hasil perbaikan saya tadi.
    // Kita balikin ke aslinya.
    if (h >= 5 && h <= 18) {
        const newT = new Date(log.timestamp.getTime() - (7 * 60 * 60 * 1000));
        await prisma.attendance.update({ where: { id: log.id }, data: { timestamp: newT } });
        resetCount++;
    }
  }

  console.log(`✅ BERHASIL MERESET ${resetCount} log ke format asli mesin.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
