
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Ambil semua log dari akhir Maret sampai akhir April
  const start = new Date('2026-03-31T15:00:00Z');
  const end = new Date('2026-04-30T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  console.log(`Menganalisa ${logs.length} log untuk pembersihan total April...`);
  
  let fixedCount = 0;
  for (const log of logs) {
    // Kita cek: Jika log ini jamnya 23:xx atau 22:xx atau 00:xx 
    // DAN belum pernah kita majukan (kita asumsikan log jam 22-23 UTC itu pasti salah karena itu jam 5-6 pagi WIB)
    // Untuk lebih aman, kita hanya majukan log yang jam UTC-nya < 17 (karena jam 17 UTC sudah jam 00 WIB)
    
    const hour = log.timestamp.getUTCHours();
    
    // Logika: Jika log tersimpan di UTC murni (0-23), 
    // maka jam 06:00 WIB tersimpan sebagai 23:00 UTC (H-1)
    // maka jam 13:00 WIB tersimpan sebagai 06:00 UTC (H)
    
    // Kita akan majukan semua yang BELUM dimajukan. 
    // Bagaimana tau sudah dimajukan? Kita lihat jamnya. 
    // Jika jamnya sangat pagi (0-5 UTC), harusnya itu jam 7-12 siang.
    // Jika jamnya malam (22-23 UTC), harusnya itu jam 5-6 pagi.
    
    // Untuk 1 April, kita sudah majukan yang gte 2026-04-01T00:00:00
    // Jadi yang 2026-03-31T23:xx BELUM dimajukan.
    
    const oldTs = log.timestamp.toISOString();
    
    // KHUSUS: Kita hanya majukan jika jam tersebut memang "mencurigakan" sebagai UTC murni
    // atau jika dia berada di rentang yang kita tahu belum disentuh.
    
    // Supaya AMAN 100%, saya hanya akan memajukan log yang:
    // 1. Tanggalnya 31 Maret jam 17:00 ke atas (Pasti absen 1 April pagi yang tertinggal)
    // 2. Log-log lain yang mungkin terlewat di antara transisi hari.
    
    if (oldTs.includes('2026-03-31T')) {
       const h = log.timestamp.getUTCHours();
       if (h >= 17) { // Ini adalah absen pagi 1 April (jam 00-07 WIB)
          const newTimestamp = new Date(log.timestamp.getTime() + (7 * 60 * 60 * 1000));
          await prisma.attendance.update({ where: { id: log.id }, data: { timestamp: newTimestamp } });
          fixedCount++;
       }
    }
    
    // Juga cek apakah ada log di hari lain yang jamnya masih UTC murni (misal jam 22 atau 23)
    const h = log.timestamp.getUTCHours();
    if ((h === 22 || h === 23) && !oldTs.includes('2026-03-31T')) {
       // Cek apakah ini sudah diperbaiki? 
       // Jika jam 23 UTC diperbaiki, dia jadi jam 06 UTC (besoknya). 
       // Jadi kalau masih jam 23, berarti BELUM diperbaiki.
       const newTimestamp = new Date(log.timestamp.getTime() + (7 * 60 * 60 * 1000));
       await prisma.attendance.update({ where: { id: log.id }, data: { timestamp: newTimestamp } });
       fixedCount++;
    }
  }

  console.log(`✅ Berhasil membersihkan ${fixedCount} log tambahan di bulan April.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
