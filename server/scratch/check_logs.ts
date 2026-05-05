
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const empId = parseInt(process.argv[2]);
  const month = parseInt(process.argv[3]);
  const year = parseInt(process.argv[4]);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  console.log(`Checking logs for Employee ID: ${empId} from ${start.toISOString()} to ${end.toISOString()}`);

  const logs = await prisma.attendance.findMany({
    where: {
      employeeId: empId,
      timestamp: {
        gte: start,
        lte: end
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  if (logs.length === 0) {
    console.log("No logs found for this period.");
  } else {
    logs.forEach(l => {
      const jktTime = new Date(l.timestamp.getTime() + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16);
      console.log(`- RAW: ${l.timestamp.toISOString()} | JKT: ${jktTime} | Device: ${l.deviceName}`);
    });
  }

  const emp = await prisma.employee.findUnique({
    where: { id: empId },
    include: {
      employeepattern: {
        include: {
          shiftpattern: {
            include: {
              shiftpatternitem: { include: { timetable: true } }
            }
          }
        }
      }
    }
  });

  if (emp) {
    console.log(`\nEmployee: ${emp.name} (${emp.role})`);
    const ep = emp.employeepattern[0];
    if (ep && ep.shiftpattern) {
      console.log(`Pattern: ${ep.shiftpattern.name} | Cycle: ${ep.shiftpattern.cycleDays} | Start: ${ep.shiftpattern.startDate}`);
      ep.shiftpattern.shiftpatternitem.forEach(item => {
        console.log(`  Day ${item.dayNumber}: ${item.timetable?.name} (${item.timetable?.jamMasuk} - ${item.timetable?.jamPulang})`);
      });
    } else {
      console.log("No shift pattern assigned!");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
