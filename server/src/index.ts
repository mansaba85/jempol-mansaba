import express from 'express';
import cors from 'cors';
import ZKLib from 'node-zklib';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const app = express();
app.use(cors());
const prisma = new PrismaClient();
const port = 3001;

// Helper: Cari Master Jadwal yang aktif untuk tanggal tertentu
async function getActiveMasterSchedule(date: Date) {
  // 1. Cari jadwal musiman yang aktif (ada rentang tanggal)
  const seasonal = await prisma.masterSchedule.findFirst({
    where: {
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date }
    }
  });
  if (seasonal) return seasonal;

  // 2. Fallback: Cari jadwal permanen yang aktif (startDate & endDate null)
  return await prisma.masterSchedule.findFirst({
    where: {
      isActive: true,
      startDate: null,
      endDate: null
    }
  });
}

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Absensi MANSABA Multi-Device Running...');
});

//--- PERANGKAT (DEVICE) API ---

// Ambil semua daftar mesin
app.get('/api/devices', async (req, res) => {
  const devices = await prisma.device.findMany();
  res.json(devices);
});

// Tambah mesin baru
app.post('/api/devices', async (req, res) => {
  const { name, ipAddress, port, password } = req.body;
  try {
    const device = await prisma.device.create({
      data: { name, ipAddress, port: parseInt(port), password }
    });
    res.json(device);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: `IP Address ${ipAddress} sudah terdaftar di sistem.` });
    }
    console.error("[Add Device Error]", error);
    res.status(500).json({ error: 'Gagal menambah mesin. Terjadi kesalahan pada server.' });
  }
});

// Hapus mesin
app.delete('/api/devices/:id', async (req, res) => {
  await prisma.device.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

//--- PEGAWAI (EMPLOYEE) API ---

// Ambil semua pegawai (plus Pola Shift yang diikuti)
app.get('/api/employees', async (req, res) => {
  const employees = await prisma.employee.findMany({
    include: { 
      assignedPatterns: {
        include: { pattern: true },
        orderBy: { id: 'desc' },
        take: 1
      } 
    },
    orderBy: { id: 'asc' }
  });
  res.json(employees);
});

// Tambah pegawai baru (+ Hubungkan Jadwal Awal)
app.post('/api/employees', async (req, res) => {
  const { id, name, nip, role, transportRate, shiftIds } = req.body;
  try {
    const employeeId = parseInt(id);
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Pegawai
      const emp = await tx.employee.create({
        data: { 
          id: employeeId, 
          name, 
          nip, 
          role, 
          transportRate: parseFloat(transportRate || 0) 
        }
      });

      // 2. Jika ada jadwal awal yang dipilih, hubungkan
      if (shiftIds && shiftIds.length > 0) {
        // Gunakan Set untuk memastikan tidak ada duplikat shiftId
        const uniqueShifts = [...new Set(shiftIds)];
        await tx.employeeShift.createMany({
          data: uniqueShifts.map((sid: any) => ({ employeeId, shiftId: parseInt(String(sid)) }))
        });
      }

      return emp;
    });

    res.json(result);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: `PIN/ID Pegawai ${id} sudah digunakan oleh pegawai lain.` });
    }
    console.error("[Add Employee Error]", error);
    res.status(500).json({ error: 'Gagal menambah pegawai. Terjadi kesalahan pada server.' });
  }
});

// Update data pegawai (Nama, NIP, Role, Honor, Pilihan Shift)
app.put('/api/employees/:id', async (req, res) => {
  const { name, nip, role, transportRate, shiftIds } = req.body;
  try {
    const employeeId = parseInt(req.params.id);
    
    await prisma.$transaction(async (tx) => {
      // 1. Update info dasar
      await tx.employee.update({
        where: { id: employeeId },
        data: { name, nip, role, transportRate: parseFloat(transportRate || 0) }
      });

      // 2. Hubungkan ke Shift pilihan (Hapus lama, pasang baru)
      if (shiftIds) {
        await tx.employeeShift.deleteMany({ where: { employeeId } });
        if (shiftIds.length > 0) {
          // Gunakan Set untuk memastikan tidak ada duplikat shiftId
          const uniqueShifts = [...new Set(shiftIds)];
          await tx.employeeShift.createMany({
            data: uniqueShifts.map((sid: any) => ({ employeeId, shiftId: parseInt(String(sid)) }))
          });
        }
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Update Employee Error]", error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui data pegawai' });
  }
});

// Aksi Massal: Update Shift dan Peran untuk banyak pegawai sekaligus
app.post('/api/employees/bulk-shift', async (req, res) => {
  const { employeeIds, shiftIds, role } = req.body;
  try {
    const transactions: any[] = [];
    
    for (const eid of employeeIds) {
      // Jika ada perubahan peran
      if (role) {
        transactions.push(prisma.employee.update({
          where: { id: eid },
          data: { role }
        }));
      }
      // Jika ada perubahan jadwal (shift)
      if (shiftIds) {
        transactions.push(prisma.employeeShift.deleteMany({ where: { employeeId: eid } }));
        transactions.push(prisma.employeeShift.createMany({
          data: shiftIds.map((sid: number) => ({ employeeId: eid, shiftId: sid }))
        }));
      }
    }
    
    await prisma.$transaction(transactions);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal melakukan pembaruan massal' });
  }
});

// Hapus pegawai (dengan pembersihan data terkait)
app.get('/api/employees/:id', async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { assignedPatterns: { include: { pattern: true } } }
  });
  res.json(emp);
});

app.delete('/api/employees/:id', async (req, res) => {
  const employeeId = parseInt(req.params.id);
  try {
    // Jalankan dalam transaksi agar aman
    await prisma.$transaction([
      prisma.employeePattern.deleteMany({ where: { employeeId } }),
      prisma.employeeShift.deleteMany({ where: { employeeId } }),
      prisma.attendance.deleteMany({ where: { employeeId } }),
      prisma.honor.deleteMany({ where: { employeeId } }),
      prisma.employee.delete({ where: { id: employeeId } })
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("[Delete Employee Error]", error);
    res.status(500).json({ error: 'Gagal menghapus pegawai. Terjadi kesalahan pada sistem database.' });
  }
});

// Aksi Massal: Hapus banyak pegawai sekaligus
app.post('/api/employees/bulk-delete', async (req, res) => {
  const { employeeIds } = req.body;
  try {
    const transactions = employeeIds.map((eid: number) => [
      prisma.employeeShift.deleteMany({ where: { employeeId: eid } }),
      prisma.attendance.deleteMany({ where: { employeeId: eid } }),
      prisma.honor.deleteMany({ where: { employeeId: eid } }),
      prisma.employee.delete({ where: { id: eid } })
    ]).flat();
    
    await prisma.$transaction(transactions);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus massal' });
  }
});

//--- MASTER JADWAL (MASTER SCHEDULE) API ---

// Ambil semua Master Jadwal
app.get('/api/master-schedules', async (req, res) => {
  const masters = await prisma.masterSchedule.findMany({
    include: { groups: { include: { shifts: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(masters);
});

// Buat Master Jadwal baru
app.post('/api/master-schedules', async (req, res) => {
  const { name, startDate, endDate, isActive } = req.body;
  try {
    const master = await prisma.masterSchedule.create({ 
      data: { 
        name, 
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive || false
      } 
    });
    res.json(master);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat Master Jadwal' });
  }
});

// Update Master Jadwal
app.put('/api/master-schedules/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, startDate, endDate, isActive } = req.body;
  try {
    const master = await prisma.masterSchedule.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive
      }
    });
    res.json(master);
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui Master Jadwal' });
  }
});

// Hapus Master Jadwal
app.delete('/api/master-schedules/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  // Cascade delete shifts first, then groups, then master
  const groups = await prisma.shiftGroup.findMany({ where: { masterScheduleId: id } });
  for (const g of groups) {
    await prisma.shift.deleteMany({ where: { groupId: g.id } });
  }
  await prisma.shiftGroup.deleteMany({ where: { masterScheduleId: id } });
  await prisma.masterSchedule.delete({ where: { id } });
  res.json({ success: true });
});

// --- CATEGORIES ---
app.get('/api/categories', async (req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(cats);
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const cat = await prisma.category.create({ data: { name } });
    res.json(cat);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Kategori sudah ada' });
    res.status(500).json({ error: 'Gagal tambah kategori' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Gagal hapus kategori' }); }
});

//--- MASTER JAM KERJA (TIMETABLE) API ---
app.get('/api/timetables', async (req, res) => {
  const t = await prisma.timetable.findMany({ 
    include: { category: true },
    orderBy: { createdAt: 'desc' } 
  });
  res.json(t);
});

app.post('/api/timetables', async (req, res) => {
  try {
    const { name, categoryId, days, jamMasuk, jamPulang, mulaiScanIn, akhirScanIn, mulaiScanOut, akhirScanOut, color } = req.body;
    const t = await prisma.timetable.create({
      data: { 
        name, 
        categoryId: categoryId ? parseInt(categoryId) : null,
        days, jamMasuk, jamPulang, mulaiScanIn, akhirScanIn, mulaiScanOut, akhirScanOut, 
        color: color || '#086862'
      }
    });
    res.json(t);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal simpan jam kerja' });
  }
});

app.put('/api/timetables/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, categoryId, days, jamMasuk, jamPulang, mulaiScanIn, akhirScanIn, mulaiScanOut, akhirScanOut, color } = req.body;
  try {
    const t = await prisma.timetable.update({
      where: { id },
      data: { 
        name, 
        categoryId: categoryId ? parseInt(categoryId) : null,
        days, jamMasuk, jamPulang, mulaiScanIn, akhirScanIn, mulaiScanOut, akhirScanOut, color 
      }
    });
    res.json(t);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal update jam kerja' });
  }
});

app.delete('/api/timetables/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Cek apakah digunakan di Pola Rolling
    const countItems = await prisma.shiftPatternItem.count({ where: { timetableId: id } });
    if (countItems > 0) {
      return res.status(400).json({ error: 'Tidak bisa menghapus: Jadwal ini sedang digunakan dalam Pola Rolling (Roster).' });
    }

    await prisma.timetable.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data. Pastikan data tidak berelasi dengan tabel lain.' });
  }
});

//--- SIKLUS ROLLING (PATTERN) API ---
app.get('/api/patterns', async (req, res) => {
  const patterns = await prisma.shiftPattern.findMany({
    include: { 
      items: { include: { timetable: true } },
      assignments: { include: { employee: true, pattern: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(patterns);
});

app.post('/api/patterns', async (req, res) => {
  const { name, category, cycleDays, startDate } = req.body;
  const pattern = await prisma.shiftPattern.create({
    data: { 
      name, 
      category, 
      cycleDays: parseInt(cycleDays),
      startDate: startDate ? new Date(startDate) : null
    }
  });
  res.json(pattern);
});

app.put('/api/patterns/:id', async (req, res) => {
  const { name, startDate } = req.body;
  const p = await prisma.shiftPattern.update({
    where: { id: parseInt(req.params.id) },
    data: { 
      name, 
      startDate: startDate ? new Date(startDate) : null 
    }
  });
  res.json(p);
});

app.delete('/api/patterns/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.shiftPatternItem.deleteMany({ where: { patternId: id } });
  await prisma.employeePattern.deleteMany({ where: { patternId: id } });
  await prisma.shiftPattern.delete({ where: { id } });
  res.json({ success: true });
});

app.post('/api/patterns/:id/items', async (req, res) => {
  const patternId = parseInt(req.params.id);
  const { items } = req.body;
  await prisma.shiftPatternItem.deleteMany({ where: { patternId } });
  const created = await prisma.shiftPatternItem.createMany({
    data: items.map((it: any) => ({
      patternId,
      timetableId: parseInt(it.timetableId),
      dayNumber: parseInt(it.dayNumber)
    }))
  });
  res.json(created);
});

app.post('/api/employees/patterns', async (req, res) => {
  const { employeeId, patternId, startDate } = req.body;
  await prisma.employeePattern.deleteMany({ where: { employeeId: parseInt(employeeId) } });
  const assignment = await prisma.employeePattern.create({
    data: {
      employeeId: parseInt(employeeId),
      patternId: parseInt(patternId),
      startDate: new Date(startDate)
    }
  });
  res.json(assignment);
});

app.post('/api/employees/bulk-pattern', async (req, res) => {
  const { employeeIds, patternId, startDate } = req.body;
  
  if (!employeeIds || !Array.isArray(employeeIds) || !patternId || !startDate) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  const data = employeeIds.map(empId => ({
    employeeId: parseInt(String(empId)),
    patternId: parseInt(String(patternId)),
    startDate: new Date(startDate)
  }));

  // Hapus plotting lama untuk para pegawai terpilih
  await prisma.employeePattern.deleteMany({
    where: { employeeId: { in: employeeIds.map(id => parseInt(String(id))) } }
  });

  // Buat plotting baru secara massal
  const result = await prisma.employeePattern.createMany({
    data: data
  });

  res.json({ success: true, count: result.count });
});

//--- KONTINER (SHIFT GROUP) API ---

// Ambil grup berdasarkan Master Jadwal ID
app.get('/api/groups', async (req, res) => {
  const { masterId } = req.query;
  const groups = await prisma.shiftGroup.findMany({
    where: masterId ? { masterScheduleId: parseInt(String(masterId)) } : {},
    include: { shifts: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(groups);
});

// Buat grup baru di dalam Master Jadwal
app.post('/api/groups', async (req, res) => {
  const { name, masterScheduleId } = req.body;
  const group = await prisma.shiftGroup.create({ 
    data: { name, masterScheduleId: parseInt(masterScheduleId) } 
  });
  res.json(group);
});

// Hapus grup
app.delete('/api/groups/:id', async (req, res) => {
  const groupId = parseInt(req.params.id);
  await prisma.shift.deleteMany({ where: { groupId } });
  await prisma.shiftGroup.delete({ where: { id: groupId } });
  res.json({ success: true });
});

// Ambil semua shift (untuk pilihan di halaman pegawai)
app.get('/api/shifts', async (req, res) => {
  const shifts = await prisma.shift.findMany({
    include: { group: true }
  });
  res.json(shifts);
});

// Tambah jadwal ke dalam grup
app.post('/api/shifts', async (req, res) => {
  try {
    const shift = await prisma.shift.create({ data: req.body });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat jadwal' });
  }
});

// Update jadwal
app.put('/api/shifts/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const shift = await prisma.shift.update({
      where: { id },
      data: req.body
    });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui jadwal' });
  }
});

app.delete('/api/shifts/:id', async (req, res) => {
  await prisma.shift.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// --- FITUR SAKTI: DUPLIKAT GRUP ---
app.post('/api/groups/:id/duplicate', async (req, res) => {
  const oldGroupId = parseInt(req.params.id);
  try {
    const oldGroup = await prisma.shiftGroup.findUnique({
      where: { id: oldGroupId },
      include: { shifts: true }
    });

    if (!oldGroup) return res.status(404).send('Group not found');

    // Buat grup baru (misal: "Copy of NORMAL")
    const newGroup = await prisma.shiftGroup.create({
      data: { name: `Copy of ${oldGroup.name}` }
    });

    // Salin semua isinya
    const newShifts = oldGroup.shifts.map(s => ({
      ...s,
      id: undefined, // Biar generate ID baru
      groupId: newGroup.id,
      createdAt: undefined,
      updatedAt: undefined
    }));

    await prisma.shift.createMany({ data: newShifts });

    res.json(newGroup);
  } catch (error) {
    res.status(500).send('Gagal duplikasi');
  }
});

// API Laporan Rekap Bulanan (Honor Transport)
app.get('/api/reports/monthly', async (req, res) => {
  const { month, year, employeeId } = req.query;
  const m = parseInt(String(month));
  const y = parseInt(String(year));

  try {
    // 1. Ambil semua pegawai
    const employees = await prisma.employee.findMany({
      where: employeeId !== 'all' ? { id: parseInt(String(employeeId)) } : {}
    });

    const report = [];

    for (const emp of employees) {
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      const logs = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          timestamp: { gte: startDate, lte: endDate }
        },
        orderBy: { timestamp: 'asc' }
      });

      // 3. Filter logs yang benar-hari hadir
      const validDaySet = new Set<string>();
      
      for (const log of logs) {
        const logDate = new Date(log.timestamp);
        const logDayStr = format(logDate, 'yyyy-MM-dd');
        const logTimeStr = format(logDate, 'HH:mm');
        const dayOfWeekIndex = logDate.getDay(); // 0-6 (0=Sun)
        
        // LOGIKA RODA SIKLUS (Recurring Patterns) - PRIORITAS PERTAMA
        const employeePattern = await prisma.employeePattern.findFirst({
          where: { employeeId: emp.id },
          include: { pattern: { include: { items: { include: { timetable: true } } } } }
        });

        let activeTimetablesForThisLog: any[] = [];

        if (employeePattern) {
          const { pattern, startDate } = employeePattern;
          const diffInMs = logDate.getTime() - new Date(startDate).getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInDays >= 0) {
            const dayInCycle = (diffInDays % pattern.cycleDays) + 1;
            const cycleItem = pattern.items.find(item => item.dayNumber === dayInCycle);
            if (cycleItem && cycleItem.timetable) {
              activeTimetablesForThisLog = [cycleItem.timetable];
            }
          }
        }

        // Jika tidak ada pola rolling, lanjut ke Logika Fallback Cerdas (Kategori Jadwal)
        if (activeTimetablesForThisLog.length === 0) {
          let master = await prisma.masterSchedule.findFirst({
            where: {
              isActive: true,
              startDate: { lte: logDate },
              endDate: { gte: logDate },
              groups: { some: { name: emp.role || '' } }
            }
          });

          if (!master) {
             master = await prisma.masterSchedule.findFirst({
                where: {
                  isActive: true,
                  startDate: null,
                  endDate: null,
                  groups: { some: { name: emp.role || '' } }
                }
              });
          }

          if (master) {
             const group = await prisma.shiftGroup.findFirst({
                where: { masterScheduleId: master.id, name: emp.role || '' },
                include: { shifts: true }
             });
             // Legacy fallback: convert old Shift model to match Timetable structure for logic below
             if (group) {
                activeTimetablesForThisLog = group.shifts.map(s => ({
                  jamMasuk: s.startTime,
                  jamPulang: s.endTime,
                  mulaiScanIn: s.startScanIn,
                  akhirScanIn: s.endScanIn,
                  mulaiScanOut: s.startScanOut,
                  akhirScanOut: s.endScanOut,
                  days: s.days
                }));
             }
          }
        }

        if (activeTimetablesForThisLog.length === 0) continue;

        // Validasi Jam Scan berdasarkan Timetable
        const isScanIn = activeTimetablesForThisLog.some((tt: any) => {
          const activeDays = (tt.days || "1,2,3,4,5,6").split(',');
          const normalizedDay = dayOfWeekIndex === 0 ? 7 : dayOfWeekIndex;
          const isCorrectDay = activeDays.includes(String(normalizedDay));
          
          // Jika pakai Pola Rolling, hari minggu/libur diabaikan, ikut nomor hari siklus yang sudah terpilih di atas
          const isInRange = logTimeStr >= (tt.mulaiScanIn || '00:00') && logTimeStr <= (tt.akhirScanIn || '23:59');
          return (employeePattern || isCorrectDay) ? isInRange : false; 
        });

        if (isScanIn) {
          validDaySet.add(logDayStr);
        }
      }

      const totalDays = validDaySet.size;
      const totalAmount = totalDays * emp.transportRate;

      report.push({
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        totalDays,
        rate: emp.transportRate,
        totalAmount
      });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghitung laporan' });
  }
});

// API Laporan Rincian Harian (Detail per Tanggal)
app.get('/api/reports/detailed', async (req, res) => {
  const { employeeId, startDate, endDate } = req.query;
  
  if (!employeeId || employeeId === 'all') {
    return res.status(400).json({ error: 'Pilih satu pegawai untuk laporan detail' });
  }

  try {
    const emp = await prisma.employee.findUnique({
      where: { id: parseInt(String(employeeId)) },
      include: {
        assignedPatterns: {
          include: { pattern: { include: { items: { include: { timetable: true } } } } },
          orderBy: { id: 'desc' },
          take: 1
        }
      }
    });

    if (!emp) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));
    end.setHours(23, 59, 59, 999);

    // Ambil log absensi (Perluas sampai H+1 untuk handle Shift Malam)
    const endPlusOne = new Date(end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    endPlusOne.setHours(23, 59, 59, 999);

    const logs = await prisma.attendance.findMany({
      where: {
        employeeId: emp.id,
        timestamp: { gte: start, lte: endPlusOne }
      },
      orderBy: { timestamp: 'asc' }
    });

    const report = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayNameEn = format(currentDate, 'EEE');
      const dayMap: { [key: string]: string } = {
        'Mon': 'Sen', 'Tue': 'Sel', 'Wed': 'Rab', 'Thu': 'Kam', 'Fri': 'Jum', 'Sat': 'Sab', 'Sun': 'Min'
      };
      const dayName = dayMap[dayNameEn] || dayNameEn;
      
      let timetable: any = null;
      const employeePattern = emp.assignedPatterns[0];

      // LOGIKA RODA SIKLUS
      if (employeePattern) {
        const { pattern, startDate: pStartDate } = employeePattern;
        const diffInMs = currentDate.getTime() - new Date(pStartDate).getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays >= 0) {
          const dayInCycle = (diffInDays % pattern.cycleDays) + 1;
          const cycleItem = pattern.items.find(item => item.dayNumber === dayInCycle);
          if (cycleItem && cycleItem.timetable) {
            const foundT = cycleItem.timetable;
            
            // VALIDASI HARI: Pastikan hari pemrosesan diizinkan oleh Timetable tersebut
            // 0=Sun, 1=Mon, ..., 6=Sat
            let currentDayNum = currentDate.getDay();
            if (currentDayNum === 0) currentDayNum = 7; // Sesuaikan jika Minggu dianggap 7
            
            const allowedDays = (foundT.days || "1,2,3,4,5,6").split(',').map(Number);
            // Cek apakah hari ini (1-7) ada di daftar allowedDays
            if (allowedDays.includes(currentDate.getDay()) || allowedDays.includes(currentDayNum)) {
              timetable = foundT;
            }
          }
        }
      }

      // VALIDASI TAMPILAN: Senin-Sabtu selalu tampil, Minggu hanya tampil jika ada jadwal
      const isSunday = currentDate.getDay() === 0;

      if (!isSunday || timetable) {
        const dayLogs = logs.filter(l => format(l.timestamp, 'yyyy-MM-dd') === dateStr);
        
        let scanIn = '';
        let scanOut = '';
        let terlambat = '';
        let plgCpt = '';
        let jamKerja = '';
        let jmlHadir = '';

        if (timetable) {
          const isOvernight = timetable.jamPulang < timetable.jamMasuk;
          const nextDateStr = format(new Date(currentDate.getTime() + 86400000), 'yyyy-MM-dd');

          // Scan Masuk (Selalu di hari yang sama)
          const scanInLog = dayLogs.find(l => {
            const time = format(l.timestamp, 'HH:mm');
            return time >= (timetable.mulaiScanIn || '00:00') && time <= (timetable.akhirScanIn || '23:59');
          });

          // Scan Keluar (Bisa di hari yang sama atau hari berikutnya jika overnight)
          const targetOutLogs = isOvernight 
            ? logs.filter(l => format(l.timestamp, 'yyyy-MM-dd') === nextDateStr)
            : dayLogs;

          const scanOutLog = [...targetOutLogs].reverse().find(l => {
            const time = format(l.timestamp, 'HH:mm');
            return time >= (timetable.mulaiScanOut || '00:00') && time <= (timetable.akhirScanOut || '23:59');
          });

          scanIn = scanInLog ? format(scanInLog.timestamp, 'HH.mm') : '';
          scanOut = scanOutLog ? format(scanOutLog.timestamp, 'HH.mm') : '';

          // Hitung Terlambat
          if (scanInLog && timetable.jamMasuk) {
            const actualH = scanInLog.timestamp.getHours();
            const actualM = scanInLog.timestamp.getMinutes();
            const [reqH, reqM] = timetable.jamMasuk.split(/[:.]/).map(Number);
            const diff = (actualH * 60 + actualM) - (reqH * 60 + reqM);
            if (diff > 0) {
              const h = Math.floor(diff / 60);
              const m = diff % 60;
              terlambat = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
          }

          // Hitung Pulang Cepat
          if (scanOutLog && timetable.jamPulang) {
            let actualH = scanOutLog.timestamp.getHours();
            const actualM = scanOutLog.timestamp.getMinutes();
            if (isOvernight) actualH += 24; // Tambah 24 jam untuk pembanding

            const [reqH, reqM] = timetable.jamPulang.split(/[:.]/).map(Number);
            const reqH_adj = isOvernight ? reqH + 24 : reqH;

            const diff = (reqH_adj * 60 + reqM) - (actualH * 60 + actualM);
            if (diff > 0) {
              const h = Math.floor(diff / 60);
              const m = diff % 60;
              plgCpt = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
          }

          // Hitung Jam Kerja & Jumlah Hadir
          if (timetable.jamMasuk && timetable.jamPulang) {
            const partsIn = timetable.jamMasuk.split(/[:.]/);
            const partsOut = timetable.jamPulang.split(/[:.]/);
            let h1 = parseInt(partsIn[0]);
            let h2 = parseInt(partsOut[0]);
            const m1 = parseInt(partsIn[1]);
            const m2 = parseInt(partsOut[1]);
            
            if (isOvernight) h2 += 24;

            if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
              const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
              if (diff > 0) {
                jamKerja = `${Math.floor(diff/60).toString().padStart(2,'0')}.${(diff%60).toString().padStart(2,'0')}`;
              }
            }
          }

          if (scanInLog && scanOutLog) {
            let diff = Math.floor((scanOutLog.timestamp.getTime() - scanInLog.timestamp.getTime()) / 60000);
            if (!isNaN(diff) && diff > 0) {
              jmlHadir = `${Math.floor(diff/60).toString().padStart(2,'0')}.${(diff%60).toString().padStart(2,'0')}`;
            }
          }
        }

        report.push({
          hari: dayName,
          tanggal: format(currentDate, 'dd/MM/yyyy'),
          jamMasuk: timetable?.jamMasuk || '',
          scanMasuk: scanIn,
          terlambat,
          jamPulang: timetable?.jamPulang || '',
          scanKeluar: scanOut,
          plgCpt,
          lembur: '',
          jamKerja,
          jmlHadir
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memproses laporan detail' });
  }
});

// Input Manual Absensi (Buat/Koreksi/Hapus log manual)
app.post('/api/attendance/manual', async (req, res) => {
  const { employeeId, date, time, type } = req.body;
  try {
    const empId = parseInt(employeeId);
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    // LOGIKA HAPUS: Jika jam kosong, hapus data MANUAL di tanggal tersebut
    if (!time || time.trim() === "" || time === "-") {
      await prisma.attendance.deleteMany({
        where: {
          employeeId: empId,
          timestamp: { gte: startOfDay, lte: endOfDay },
          isManual: true
        }
      });
      return res.json({ success: true, message: 'Data manual berhasil dihapus.' });
    }

    const cleanTime = time.replace('.', ':');
    const timestamp = new Date(`${date}T${cleanTime}:00`);

    if (isNaN(timestamp.getTime())) {
      return res.status(400).json({ error: 'Format waktu tidak valid.' });
    }

    const result = await prisma.attendance.upsert({
      where: {
        employeeId_timestamp: {
          employeeId: empId,
          timestamp: timestamp
        }
      },
      update: {
        isManual: true,
        note: 'Update Manual Admin'
      },
      create: {
        employeeId: empId,
        timestamp: timestamp,
        type: 'CHECK',
        isManual: true,
        note: 'Input Manual Admin'
      }
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Manual Attendance Error]", error);
    res.status(500).json({ error: 'Gagal memproses data manual: ' + error.message });
  }
});

// Ambil log absensi (dengan Nama Pegawai & Nama Mesin)
app.get('/api/logs', async (req, res) => {
  const { search, startDate, endDate } = req.query;
  try {
    let whereClause: any = {};
    
    // Filter Nama
    if (search) {
      whereClause.employee = {
        name: { contains: String(search) }
      };
    }

    // Filter Tanggal
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        whereClause.timestamp.lte = end;
      }
    }

    const totalCount = await prisma.attendance.count({ where: whereClause });
    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: { select: { name: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 5000 
    });
    
    const devices = await prisma.device.findMany();
    const deviceMap = new Map(devices.map(d => [d.id, d.name]));

    const formattedLogs = logs.map(l => ({
      ...l,
      employeeName: l.employee.name,
      deviceName: deviceMap.get(l.deviceId || 0) || 'Mesin Lokal'
    }));

    res.json({ logs: formattedLogs, totalCount });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil log' });
  }
});

// Cek status mesin (Versi ringkas untuk tombol Hubungkan)
app.get('/api/machine/status', async (req, res) => {
  try {
    const firstDevice = await prisma.device.findFirst();
    if (!firstDevice) return res.json({ status: 'No Device', dbCount: 0 });

    const zk = new ZKLib(firstDevice.ipAddress, firstDevice.port, 5000, 4000);
    await zk.createSocket();
    const info = await zk.getInfo();
    const users = await zk.getUsers();
    await zk.disconnect();
    
    const dbCount = await prisma.attendance.count();
    res.json({ 
      status: 'Connected', 
      dbCount,
      info: { logCount: info.logCount, userCount: users.data.length }
    });
  } catch (error) {
    const dbCount = await prisma.attendance.count().catch(() => 0);
    res.json({ status: 'Error', dbCount });
  }
});

// Cek status satu mesin spesifik via ID
app.get('/api/machine/status/:id', async (req, res) => {
  const device = await prisma.device.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!device) return res.status(404).json({ error: 'Mesin tidak ditemukan' });

  const zkInstance = new ZKLib(device.ipAddress, device.port, 5000, 4000);
  try {
    await zkInstance.createSocket();
    const info = await zkInstance.getInfo();
    const users = await zkInstance.getUsers();
    await zkInstance.disconnect();
    
    res.json({ 
      status: 'Connected', 
      info: {
        logCount: info.logCount,
        userCount: users.data.length || info.userCount
      } 
    });
  } catch (error) {
    res.json({ status: 'Error' });
  }
});

// Sinkronisasi SEMUA mesin sekaligus (SSE)
app.get('/api/machine/sync-all', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (step: string, percent: number, details?: string) => {
    res.write(`data: ${JSON.stringify({ step, percent, details })}\n\n`);
  };

  try {
    const activeDevices = await prisma.device.findMany({ where: { isActive: true } });
    sendProgress(`Memulai sinkronisasi ${activeDevices.length} perangkat...`, 5);

    let deviceIndex = 0;
    for (const dev of activeDevices) {
      deviceIndex++;
      const basePercent = Math.floor(((deviceIndex - 1) / activeDevices.length) * 100);
      
      sendProgress(`[${dev.name}] Menghubungkan ke ${dev.ipAddress}...`, basePercent + 5);
      
      const zk = new ZKLib(dev.ipAddress, dev.port, 40000, 10000);
      try {
        await zk.createSocket();
        const logs = await zk.getAttendances();
        console.log(`[Sync] ${dev.name} - Total di Mesin: ${logs.data.length}`);
        sendProgress(`[${dev.name}] Mengunduh ${logs.data.length} data...`, basePercent + 10);

        sendProgress('Memproses data pegawai...', 50);
        const users = await zk.getUsers(); 
        // Menggunakan userId (PIN) bukan uid (Internal index)
        const userMap = new Map(users.data.map((u: any) => [u.userId, u.name]));

        const uids = [...new Set(logs.data.map((l: any) => l.deviceUserId))];
        for (const uidStr of uids as string[]) {
          const uid = parseInt(uidStr);
          const machineName = userMap.get(uidStr);
          
          // Jika tidak ada nama di mesin, cek apakah sudah ada di DB kita
          if (!machineName || machineName.trim() === "") {
            const existing = await prisma.employee.findUnique({ where: { id: uid } });
            if (!existing) {
              console.log(`[Sync] Skip employee ID ${uid} because it has no name and doesn't exist in DB.`);
              continue; // Abaikan user baru tanpa nama
            }
          }

          const finalName = machineName || `Pegawai Baru (${uid})`;
          await prisma.employee.upsert({
            where: { id: uid }, 
            update: { name: finalName }, 
            create: { id: uid, name: finalName }
          });
        }

        // Ambil daftar valid ID yang ada di DB kita (untuk filter log)
        const dbEmployeeIds = (await prisma.employee.findMany({ select: { id: true } })).map(e => e.id);

        // Incremental sync
        const last = await prisma.attendance.findFirst({ 
          where: { deviceId: dev.id },
          orderBy: { timestamp: 'desc' } 
        });
        const lastTs = last ? last.timestamp.getTime() : 0;
        
        const now = new Date();
        const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

        const newLogs = logs.data.filter((l: any) => {
          const logTs = new Date(l.recordTime).getTime();
          const empId = parseInt(l.deviceUserId);
          const isKnown = dbEmployeeIds.includes(empId);
          
          // Filter: ABAIKAN jika tanggal di mesin lebih dari besok (karena jam mesin mungkin salah)
          const isFuture = logTs > tomorrow.getTime();
          return logTs > lastTs && !isFuture && isKnown;
        });

        console.log(`[Sync] ${dev.name} - Data Baru (Terfilter): ${newLogs.length}`);

        if (newLogs.length > 0) {
          const result = await prisma.attendance.createMany({
            data: newLogs.map((l: any) => ({
              employeeId: parseInt(l.deviceUserId),
              timestamp: new Date(l.recordTime),
              type: 'CHECK',
              deviceId: dev.id
            })),
            skipDuplicates: true
          });
          console.log(`[Sync] ${dev.name} - Berhasil Simpan: ${result.count}`);
        }

        await zk.disconnect();
        sendProgress(`[${dev.name}] Selesai.`, basePercent + Math.floor(100 / activeDevices.length));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Connection Error] Device ${dev.name}:`, errMsg);
        sendProgress(`[${dev.name}] Gagal: ${errMsg}`, basePercent + 5, 'Pastikan Attendance Manager PC sudah ditutup.');
      }
    }

    sendProgress('Semua perangkat selesai disinkronkan!', 100);
    res.end();
  } catch (error) {
    sendProgress('Global Error', 0, 'Terjadi kesalahan sistem.');
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Backend Absensi MANSABA Multi-Device aktif di port ${port}`);
});
