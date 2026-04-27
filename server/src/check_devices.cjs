const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const devices = await prisma.device.findMany();
  console.log('JSON_START');
  console.log(JSON.stringify(devices));
  console.log('JSON_END');
  await prisma.$disconnect();
}

check();
