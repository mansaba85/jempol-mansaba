import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const emps = await prisma.employee.findMany({
    where: { id: { in: [378, 10870, 10871, 12451, 12060] } }
  });
  console.log("Employees found in DB:", emps.map(e => e.id));
}
check().finally(() => prisma.$disconnect());
