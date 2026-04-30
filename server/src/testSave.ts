import ZKLib from 'node-zklib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const devId = 1; // Solution machine
  const dev = await prisma.device.findUnique({ where: { id: devId } });
  
  const employees = await prisma.employee.findMany({
      include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } }
    });
  const empMap = new Map(employees.map(e => [e.id, e]));

  const zk = new ZKLib(dev.ipAddress, dev.port, 10000, 4000);
  await zk.createSocket();
  const logs = await zk.getAttendances();
  await zk.disconnect();

  const last = await prisma.attendance.findFirst({ where: { deviceId: devId }, orderBy: { timestamp: 'desc' } });
  const lastTs = last ? last.timestamp.getTime() : 0;

  const logsToSave = [];
  for (const l of logs.data) {
        const uid = parseInt(l.deviceUserId);
        const tapTime = new Date(l.recordTime);
        const tapYear = tapTime.getFullYear();
        if (tapYear < 2020 || tapYear > 2030 || tapTime.getTime() <= lastTs || !empMap.has(uid)) continue;

        let type = null;
        if (!type) {
            const tapLocalHour = (tapTime.getUTCHours() + 7) % 24;
            type = tapLocalHour < 12 ? 'CHECK IN' : 'CHECK OUT';
        }
        
        logsToSave.push({ employeeId: uid, timestamp: tapTime, type, deviceId: devId });
  }

  console.log("Logs To Save array length:", logsToSave.length, "Logs:", logsToSave);

  if (logsToSave.length > 0) {
      try {
        const result = await prisma.attendance.createMany({ data: logsToSave, skipDuplicates: true });
        console.log("CreateMany Result:", result);
      } catch (err) {
        console.error("CreateMany Error:", err);
      }
  } else {
      console.log('Tidak ada data baru');
  }
}

run().finally(() => prisma.$disconnect());
