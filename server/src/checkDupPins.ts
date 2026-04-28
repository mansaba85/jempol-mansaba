import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const all = await prisma.employee.findMany({ where: { NOT: { pin: null } } });
  const pins = all.map(e => e.pin);
  const duplicates = pins.filter((item, index) => pins.indexOf(item) !== index);
  console.log("Duplicate PINs found:", duplicates);
  if (duplicates.length > 0) {
      const dupDetails = all.filter(e => duplicates.includes(e.pin));
      console.log("Details:", dupDetails.map(e => ({ name: e.name, pin: e.pin })));
  }
}
check().finally(() => prisma.$disconnect());
