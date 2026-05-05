
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2026-04-01T00:00:00Z');
  const end = new Date('2026-04-01T23:59:59Z');
  
  const logs = await prisma.attendance.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end
      }
    },
    include: {
      employee: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  console.log('--- LOG TANGGAL 1 APRIL 2026 (RAW UTC) ---');
  logs.forEach(l => {
    console.log(`ID: ${l.id} | Nama: ${l.employee.name} | Timestamp: ${l.timestamp.toISOString()} | Jam (Local Server): ${l.timestamp.getHours()}:${l.timestamp.getMinutes()}`);
  });
  console.log('--- SELESAI ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
