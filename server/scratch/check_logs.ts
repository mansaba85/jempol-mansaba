
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: new Date('2026-05-03T17:00:00Z'),
        lte: new Date('2026-05-04T17:00:00Z')
      }
    },
    include: {
      employee: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  console.log('--- MENCARI LOG JAM 06:14 JKT ---');
  logs.forEach(l => {
    const jktTime = l.timestamp.toLocaleTimeString('en-GB', {timeZone: 'Asia/Jakarta'});
    if (jktTime.startsWith('06:14')) {
       console.log(`[${l.timestamp.toISOString()}] ID: ${l.employeeId} | Nama: ${l.employee.name} | Jam JKT: ${jktTime}`);
    }
  });
  
  // Juga cari log milik AKHMAD LUTFI hari ini
  console.log('\n--- LOG MILIK AKHMAD LUTFI HARI INI ---');
  logs.forEach(l => {
    if (l.employee.name.includes('AKHMAD LUTFI')) {
       const jktTime = l.timestamp.toLocaleTimeString('en-GB', {timeZone: 'Asia/Jakarta'});
       console.log(`[${l.timestamp.toISOString()}] Jam JKT: ${jktTime}`);
    }
  });
  console.log('--- SELESAI ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
