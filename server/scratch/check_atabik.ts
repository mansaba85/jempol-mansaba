import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { name: { contains: 'ATABIK' } }
  });
  if (!emp) {
    console.log("Pegawai tidak ditemukan.");
    return;
  }
  console.log(`Ditemukan: ${emp.name} (ID: ${emp.id})`);

  // Rentang pencarian: 4 Juni 2026 jam 00:00 s.d 5 Juni 2026 jam 23:59 (WIB)
  const start = new Date('2026-06-03T17:00:00.000Z'); // 4 Jun 00:00 WIB
  const end = new Date('2026-06-05T16:59:59.000Z');   // 5 Jun 23:59 WIB

  const logs = await prisma.attendance.findMany({
    where: {
      employeeId: emp.id,
      timestamp: { gte: start, lte: end }
    },
    orderBy: { timestamp: 'asc' }
  });

  console.log(`\n=== LOG ABSENSI TANGGAL 4-5 JUNI 2026 ===`);
  if (logs.length === 0) {
    console.log("TIDAK ADA DATA ABSENSI.");
  } else {
    logs.forEach(l => {
      // Konversi ke WIB untuk tampilan
      const d = new Date(l.timestamp.getTime() + 7 * 60 * 60 * 1000);
      const jam = d.toISOString().replace('T', ' ').substring(0, 19);
      console.log(`- Waktu: ${jam} WIB | Mesin: ${l.machineIp} | Manual: ${l.isManual}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
