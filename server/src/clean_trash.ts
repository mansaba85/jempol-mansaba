import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanTrash() {
  console.log('--- MEMBERSIHKAN LOG MASA DEPAN (TAHUN 2118/2119) ---');
  const deleted = await prisma.attendance.deleteMany({
    where: {
      OR: [
        { timestamp: { gte: new Date('2031-01-01') } },
        { timestamp: { lt: new Date('2020-01-01') } }
      ]
    }
  });
  console.log(`Berhasil menghapus ${deleted.count} data sampah.`);
  await prisma.$disconnect();
}

cleanTrash().catch(console.error);
