import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLogs() {
  console.log('--- MEMULAI PERBAIKAN LOG HARI INI ---');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Ambil semua log hari ini
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  console.log(`Menemukan ${logs.length} data hari ini.`);

  let fixCount = 0;
  for (const log of logs) {
    const hour = log.timestamp.getHours();
    const correctType = hour >= 11 ? 'CHECK OUT' : 'CHECK IN';
    
    if (log.type !== correctType) {
      await prisma.attendance.update({
        where: { id: log.id },
        data: { type: correctType }
      });
      fixCount++;
    }
  }

  console.log(`Selesai! ${fixCount} data telah diperbaiki labelnya.`);
  await prisma.$disconnect();
}

fixLogs().catch(e => {
  console.error(e);
  process.exit(1);
});
