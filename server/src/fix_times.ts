import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTimes() {
  console.log('Starting to fix attendance timestamps...');
  
  // Ambil semua log absen
  const logs = await prisma.attendance.findMany();
  console.log(`Found ${logs.length} logs to check.`);

  let updatedCount = 0;
  for (const log of logs) {
    // Mundurkan 7 jam
    const oldDate = new Date(log.timestamp);
    const newDate = new Date(oldDate.getTime() - (7 * 60 * 60 * 1000));
    
    await prisma.attendance.update({
      where: { id: log.id },
      data: { timestamp: newDate }
    });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} logs (Subtracted 7 hours).`);
}

fixTimes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
