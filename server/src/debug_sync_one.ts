import ZKLib from 'node-zklib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSyncOne() {
  const devId = 1; // Assuming solution is ID 1
  const dev = await prisma.device.findUnique({ where: { id: devId } });
  console.log("Device ID 1:", dev);

  const employees = await prisma.employee.findMany();
  const empMap = new Map(employees.map(e => [e.id, e]));

  const zk = new ZKLib(dev.ipAddress, dev.port, 10000, 4000);
  await zk.createSocket();
  const logs = await zk.getAttendances();
  await zk.disconnect();

  const last = await prisma.attendance.findFirst({ where: { deviceId: devId }, orderBy: { timestamp: 'desc' } });
  const lastTs = last ? last.timestamp.getTime() : 0;
  console.log("lastTs:", lastTs, "Date:", last?.timestamp);

  let skippedByLastTs = 0;
  let skippedByEmp = 0;
  let processable = 0;

  for (const l of logs.data) {
    const uid = parseInt(l.deviceUserId);
    const tapTime = new Date(l.recordTime);
    const tapYear = tapTime.getFullYear();

    if (tapYear < 2020 || tapYear > 2030) continue;
    if (tapTime.getTime() <= lastTs) {
      skippedByLastTs++;
      continue;
    }
    if (!empMap.has(uid)) {
      skippedByEmp++;
      continue;
    }
    processable++;
  }
  
  console.log(`total logs: ${logs.data.length}, skippedByLastTs: ${skippedByLastTs}, skippedByEmp: ${skippedByEmp}, processable: ${processable}`);
}

debugSyncOne().finally(() => prisma.$disconnect());
