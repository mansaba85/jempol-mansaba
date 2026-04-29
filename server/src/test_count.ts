import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.employee.count();
  console.log('Employee count:', count);
  const devices = await prisma.device.findMany();
  console.log('Devices:', devices);
  process.exit(0);
}
main();
