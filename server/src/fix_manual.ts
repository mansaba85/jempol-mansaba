import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const manuals = await prisma.attendance.findMany({
    where: { isManual: true, type: 'CHECK' }
  });
  
  console.log(`Found ${manuals.length} records to fix`);
  for (const m of manuals) {
    const localHour = (m.timestamp.getUTCHours() + 7) % 24;
    const newType = localHour < 12 ? 'CHECK IN' : 'CHECK OUT';
    await prisma.attendance.update({
      where: { id: m.id },
      data: { type: newType }
    });
  }
  console.log('Done!');
}

fix().finally(() => prisma.$disconnect());
