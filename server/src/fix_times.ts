import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTimes() {
  console.log('Starting smart fix for attendance timestamps...');
  const logs = await prisma.attendance.findMany({
    where: { timestamp: { gte: new Date('2026-04-30T00:00:00Z') } }
  });
  console.log(`Checking ${logs.length} recent logs...`);

  let updatedCount = 0;
  const now = new Date();

  for (const log of logs) {
    const logDate = new Date(log.timestamp);
    
    // LOGIKA 1: Jika jam log lebih besar dari jam SEKARANG (karena tadi ditambah 7 jam)
    // Maka kita kurangi 7 jam agar kembali normal.
    if (logDate > now) {
      await prisma.attendance.update({
        where: { id: log.id },
        data: { timestamp: new Date(logDate.getTime() - (7 * 60 * 60 * 1000)) }
      });
      updatedCount++;
    } 
    // LOGIKA 2: Jika log kemarin/hari ini ada di jam "aneh" (seperti jam 21.00 - 23.59) 
    // padahal harusnya jam siang (14.00 - 16.59), kita kurangi 7 jam.
    else if (logDate.getHours() >= 21) {
       await prisma.attendance.update({
        where: { id: log.id },
        data: { timestamp: new Date(logDate.getTime() - (7 * 60 * 60 * 1000)) }
      });
      updatedCount++;
    }
  }

  console.log(`Smart fix complete. Updated ${updatedCount} logs.`);
}

fixTimes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
