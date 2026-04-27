const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanData() {
  console.log('--- MEMULAI PEMBERSIHAN BESAR-BESARAN ---');
  
  // Tentukan batas tahun 2026
  const startOf2026 = new Date('2026-01-01T00:00:00');
  const endOf2026 = new Date('2026-12-31T23:59:59');

  const deleted = await prisma.attendance.deleteMany({
    where: {
      OR: [
        { timestamp: { lt: startOf2026 } },
        { timestamp: { gt: endOf2026 } }
      ]
    }
  });

  console.log(`OPERASI SELESAI!`);
  console.log(`Berhasil menghapus: ${deleted.count} data lama.`);
  
  const remaining = await prisma.attendance.count();
  console.log(`Sisa data di database (Tahun 2026): ${remaining} data.`);
  
  await prisma.$disconnect();
}

cleanData().catch(console.error);
