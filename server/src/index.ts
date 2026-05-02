import express from 'express';
import cors from 'cors';
import ZKLib from 'node-zklib';
import { PrismaClient } from '@prisma/client';
import { format, endOfMonth, parse } from 'date-fns';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import jwt from 'jsonwebtoken';

const upload = multer({ dest: 'uploads/' });
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mansaba_super_secret_1985';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- AUTH & LOGIN ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findFirst({
    where: { username, password }
  });
  if (user) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );
    res.json({ 
      success: true, 
      token,
      user: { username: user.username, role: user.role } 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Username atau Password salah' 
    });
  }
});

app.post('/api/login/employee', async (req, res) => {
  const { id, pin } = req.body;
  
  let employee;
  if (id) {
    employee = await prisma.employee.findFirst({
        where: { id: parseInt(String(id)), pin: String(pin) }
    });
  } else {
    // Login hanya dengan PIN
    employee = await prisma.employee.findUnique({
        where: { pin: String(pin) }
    });
  }

  if (employee) {
    const token = jwt.sign(
      { id: employee.id, username: employee.name, role: 'EMPLOYEE' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ 
      success: true, 
      token,
      user: { id: employee.id, username: employee.name, role: 'EMPLOYEE' } 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'NIP atau PIN salah' 
    });
  }
});

// Jalur Baru: Hanya untuk data Publik (Aman untuk halaman Login)
app.get('/api/settings/public', async (req, res) => {
  const publicKeys = ['app_name', 'school_name', 'school_logo'];
  const settings = await prisma.systemsetting.findMany({
    where: { key: { in: publicKeys } }
  });
  res.json(settings);
});

// Middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Silakan login.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Sesi berakhir. Silakan login kembali.' });
    req.user = user;
    next();
  });
};

// HANYA LINDUNGI JALUR /api (Kecuali Login & Public)
app.use('/api', (req: any, res: any, next: any) => {
  const publicRoutes = ['/login', '/login/employee', '/settings/public'];
  if (publicRoutes.includes(req.path)) return next();
  authenticateToken(req, res, next);
});

// Auto-seed Initial Admin
const seedAdmin = async () => {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { username: 'manubyp' }
    });
    if (!adminExists) {
      await prisma.user.create({
        data: {
          username: 'manubyp',
          password: 'Mansaba1985',
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user "manubyp" seeded successfully.');
    }
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
  }
};
seedAdmin();

// --- SAFETY SHIELD (Cegah Server Mati Jika Mesin Error) ---
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL ERROR - UNCAUGHT]:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL ERROR - UNHANDLED REJECTION]:', reason);
});

// --- MASTER DATA & CONFIG ---

// Categories & Timetables
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ include: { timetable: true } });
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  const category = await prisma.category.create({ data: { name } });
  res.json(category);
});

app.get('/api/timetables', async (req, res) => {
  const timetables = await prisma.timetable.findMany({ include: { category: true } });
  res.json(timetables);
});

app.post('/api/timetables', async (req, res) => {
  const data = req.body;
  const timetable = await prisma.timetable.create({ data });
  res.json(timetable);
});

app.put('/api/timetables/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const timetable = await prisma.timetable.update({ where: { id }, data: req.body });
  res.json(timetable);
});

app.delete('/api/timetables/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.timetable.delete({ where: { id } });
  res.json({ success: true });
});

// Shift Patterns
app.get('/api/patterns', async (req, res) => {
  const patterns = await prisma.shiftpattern.findMany({
    include: { shiftpatternitem: { include: { timetable: true } } }
  });
  // Map back to 'items' for frontend compatibility
  const mappedPatterns = patterns.map(p => ({
    ...p,
    items: p.shiftpatternitem
  }));
  res.json(mappedPatterns);
});

app.post('/api/patterns', async (req, res) => {
  const { name, category, cycleDays, startDate, items } = req.body;
  try {
    const pattern = await prisma.shiftpattern.create({
      data: {
        name,
        category,
        cycleDays,
        startDate: startDate ? new Date(startDate) : null,
        shiftpatternitem: {
          create: items.map((it: any) => ({
            dayNumber: parseInt(it.dayNumber),
            timetableId: parseInt(it.timetableId)
          }))
        }
      }
    });
    res.json(pattern);
  } catch (error) {
    res.status(500).json({ error: 'Gagal simpan pola' });
  }
});
app.put('/api/patterns/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, cycleDays, startDate } = req.body;
  try {
    const pattern = await prisma.shiftpattern.update({
      where: { id },
      data: { 
        name, 
        category, 
        cycleDays, 
        startDate: startDate ? new Date(startDate) : undefined 
      }
    });
    res.json(pattern);
  } catch (error) { res.status(500).json({ error: 'Gagal update pola' }); }
});

app.post('/api/patterns/:id/items', async (req, res) => {
  const id = parseInt(req.params.id);
  const { items } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shiftpatternitem.deleteMany({ where: { patternId: id } });
      await tx.shiftpatternitem.createMany({
        data: items.filter((it: any) => it.timetableId).map((it: any) => ({
          patternId: id,
          dayNumber: parseInt(it.dayNumber),
          timetableId: parseInt(it.timetableId)
        }))
      });
    });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Gagal simpan item pola' }); }
});

app.delete('/api/patterns/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.shiftpatternitem.deleteMany({ where: { patternId: id } });
  await prisma.employeepattern.deleteMany({ where: { patternId: id } });
  await prisma.shiftpattern.delete({ where: { id } });
  res.json({ success: true });
});

// Employees & Assignments
app.get('/api/employees', async (req, res) => {
  const employees = await prisma.employee.findMany({
    include: { 
      employeepattern: { include: { shiftpattern: true }, orderBy: { id: 'desc' }, take: 1 } 
    },
    orderBy: { id: 'asc' }
  });
  // Map back to 'assignedPatterns' and 'pattern' for frontend compatibility
  const mappedEmployees = employees.map(e => ({
    ...e,
    assignedPatterns: e.employeepattern.map((ap: any) => ({
      ...ap,
      pattern: ap.shiftpattern
    }))
  }));
  res.json(mappedEmployees);
});

app.post('/api/employees', async (req, res) => {
  const { id, name, nip, role, transportRate, patternId, patternStartDate, pin } = req.body;
  const empId = parseInt(id);
  const employee = await prisma.employee.upsert({
    where: { id: empId },
    update: { 
      name, 
      nip, 
      role, 
      transportRate: parseFloat(String(transportRate || 0)),
      pin: pin ? String(pin) : undefined,
      updatedAt: new Date()
    },
    create: { 
      id: empId, 
      name, 
      nip, 
      role, 
      transportRate: parseFloat(String(transportRate || 0)),
      pin: pin ? String(pin) : undefined,
      updatedAt: new Date()
    }
  });

  if (patternId && patternId !== 'none') {
    await prisma.employeepattern.deleteMany({ where: { employeeId: empId } });
    await prisma.employeepattern.create({
      data: {
        employeeId: empId,
        patternId: parseInt(String(patternId)),
        startDate: new Date(patternStartDate || new Date())
      }
    });
  }
  res.json(employee);
});

app.put('/api/employees/:id', async (req, res) => {
  const { name, nip, role, transportRate, pin } = req.body;
  const empId = parseInt(req.params.id);
  try {
    const employee = await prisma.employee.update({
      where: { id: empId },
      data: { 
        name, 
        nip, 
        role, 
        transportRate: parseFloat(String(transportRate || 0)),
        pin: pin ? String(pin) : undefined
      }
    });
    res.json(employee);
  } catch (error) {
    console.error("[Update Employee Error]", error);
    res.status(500).json({ error: 'Gagal memperbarui data pegawai' });
  }
});

app.post('/api/employees/bulk-pattern', async (req, res) => {
  const { employeeIds, patternId, startDate } = req.body;
  try {
    await prisma.employeepattern.deleteMany({ where: { employeeId: { in: employeeIds } } });
    await prisma.employeepattern.createMany({
      data: employeeIds.map((id: number) => ({
        employeeId: id,
        patternId: parseInt(patternId),
        startDate: new Date(startDate)
      }))
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal plotting massal' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.employeepattern.deleteMany({ where: { employeeId: id } });
    await prisma.attendance.deleteMany({ where: { employeeId: id } });
    await prisma.honor.deleteMany({ where: { employeeId: id } });
    await prisma.employeeshift.deleteMany({ where: { employeeId: id } });
    await prisma.employee.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("[Delete Employee Error]", error);
    res.status(500).json({ error: 'Gagal menghapus pegawai' });
  }
});

// Device Management
// Settings
app.get('/api/settings', async (req, res) => {
  const settings = await prisma.systemsetting.findMany();
  res.json(settings);
});

app.get('/api/devices', async (req, res) => {
  const devices = await prisma.device.findMany();
  res.json(devices);
});

app.post('/api/devices', async (req, res) => {
  const device = await prisma.device.create({ data: req.body });
  res.json(device);
});

app.delete('/api/devices/:id', async (req, res) => {
  await prisma.device.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

app.post('/api/employees/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ID tidak valid' });
  
  try {
    const numericIds = ids.map(Number);
    await prisma.employeepattern.deleteMany({ where: { employeeId: { in: numericIds } } });
    await prisma.attendance.deleteMany({ where: { employeeId: { in: numericIds } } });
    await prisma.honor.deleteMany({ where: { employeeId: { in: numericIds } } });
    await prisma.employeeshift.deleteMany({ where: { employeeId: { in: numericIds } } });
    await prisma.employee.deleteMany({ where: { id: { in: numericIds } } });
    res.json({ success: true });
  } catch (error) {
    console.error("[Bulk Delete Error]", error);
    res.status(500).json({ error: 'Gagal hapus massal: ' + (error instanceof Error ? error.message : 'Unknown') });
  }
});

// Cek status mesin (Versi ringkas untuk tombol Hubungkan)
app.get('/api/machine/status', async (req, res) => {
  try {
    const firstDevice = await prisma.device.findFirst({ where: { isActive: true } });
    if (!firstDevice) return res.json({ status: 'No Device', dbCount: 0 });

    const zk = new ZKLib(firstDevice.ipAddress, firstDevice.port, 12000, 5000); 
    await zk.createSocket();
    const info = await zk.getInfo();
    
    let userCount = 0;
    try {
      const users = await zk.getUsers();
      userCount = users.data?.length || info.userCount || 0;
    } catch (uErr) {
      console.warn("[Status] Gagal ambil user list, gunakan info fallback");
      userCount = info.userCount || 0;
    }

    await zk.disconnect();
    
    const dbCount = await prisma.attendance.count();
    res.json({ 
      status: 'Connected', 
      dbCount,
      info: { 
        logCount: info.logCount || 0, 
        userCount: userCount 
      }
    });
  } catch (error) {
    console.error("[Status Error]", error);
    const dbCount = await prisma.attendance.count().catch(() => 0);
    res.json({ status: 'Error', dbCount });
  }
});

app.get('/api/machine/status/:id', async (req, res) => {
  const device = await prisma.device.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const zk = new ZKLib(device.ipAddress, device.port, 10000, 4000);
  try {
    await zk.createSocket();
    const info = await zk.getInfo();
    await zk.disconnect();
    res.json({ status: 'Connected', info });
  } catch (error) {
    res.json({ status: 'Error' });
  }
});

// --- ATTENDANCE & SYNC ---

app.get('/api/logs', async (req, res) => {
  const { search, startDate, endDate } = req.query;
  let where: any = {};
  if (search) where.employee = { name: { contains: String(search) } };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(String(startDate));
    if (endDate) where.timestamp.lte = new Date(new Date(String(endDate)).setHours(23,59,59));
  } else {
    // Default: Tampilkan hanya data di tahun sekarang (dinamis)
    const currentYear = new Date().getFullYear();
    where.timestamp = {
      gte: new Date(`${currentYear}-01-01`),
      lte: new Date(`${currentYear}-12-31T23:59:59`)
    };
  }
  const logs = await prisma.attendance.findMany({
    where, include: { employee: true }, orderBy: { timestamp: 'desc' }, take: 1000
  });
  res.json({ logs });
});

app.post('/api/attendance/manual', async (req, res) => {
  const { employeeId, date, time, type } = req.body;
  // Pastikan jam menggunakan format HH:mm
  const timeStr = time.replace('.', ':');
  // Buat tanggal dalam konteks waktu lokal Indonesia (UTC+7)
  const timestamp = new Date(`${date}T${timeStr}:00+07:00`);
  
  const checkType = type === 'IN' ? 'CHECK IN' : 'CHECK OUT';
  
  await prisma.attendance.upsert({
    where: { employeeId_timestamp: { employeeId: parseInt(employeeId), timestamp } },
    update: { isManual: true, type: checkType },
    create: { employeeId: parseInt(employeeId), timestamp, type: checkType, isManual: true }
  });
  res.json({ success: true });
});

app.delete('/api/attendance/manual', async (req, res) => {
  const { employeeId, date, type } = req.query; // type: 'IN' or 'OUT'
  try {
    const empId = parseInt(String(employeeId));
    const targetDate = new Date(`${date}T00:00:00+07:00`);
    const nextDate = new Date(targetDate.getTime() + 86400000);

    const emp = await prisma.employee.findUnique({
      where: { id: empId },
      include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } }
    });

    if (!emp) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });

    let timetable: any = null;
    const ep = emp.employeepattern[0];
    if (ep && ep.shiftpattern?.startDate) {
        const dS = new Date(ep.shiftpattern.startDate); dS.setHours(0,0,0,0);
        const dC = new Date(targetDate); dC.setHours(0,0,0,0);
        const diff = Math.round((dC.getTime() - dS.getTime()) / 86400000);
        if (diff >= 0) {
            const dy = (diff % ep.shiftpattern.cycleDays) + 1;
            const ci = ep.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dy);
            timetable = ci?.timetable;
        }
    }

    const logs = await prisma.attendance.findMany({
        where: { employeeId: empId, timestamp: { gte: targetDate, lte: nextDate } }
    });

    const manualLogs = logs.filter(l => l.isManual);
    if (manualLogs.length === 0) return res.json({ success: true });

    let toDelete: any[] = [];
    if (timetable) {
      const [thM, tmM] = timetable.jamMasuk.split(/[:.]/).map(Number);
      const [thP, tmP] = timetable.jamPulang.split(/[:.]/).map(Number);

      toDelete = manualLogs.filter(l => {
          const hStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(l.timestamp);
          const [lh, lm] = hStr.split(':').map(Number);
          const dM = Math.abs((lh * 60 + lm) - (thM * 60 + tmM));
          const dP = Math.abs((lh * 60 + lm) - (thP * 60 + tmP));
          return type === 'IN' ? dM <= dP : dP < dM;
      });
    } else {
      // Jika tidak ada jadwal, hapus log manual pertama (IN) atau terakhir (OUT)
      const sortedManual = [...manualLogs].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
      if (type === 'IN') toDelete = [sortedManual[0]];
      else if (sortedManual.length > 1) toDelete = [sortedManual[sortedManual.length-1]];
    }

    if (toDelete.length > 0) {
        await prisma.attendance.deleteMany({
            where: { id: { in: toDelete.map(d => d.id).filter(id => id !== undefined) } }
        });
    }

    res.json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus presensi' });
  }
});

app.get('/api/machine/storage', async (req, res) => {
  try {
    const activeDevices = await prisma.device.findMany({ where: { isActive: true } });
    if (activeDevices.length === 0) return res.json({ percentage: 0 });
    
    const dev = activeDevices[0];
    const zk = new ZKLib(dev.ipAddress, dev.port, 10000, 4000);
    await zk.createSocket();
    const storage = await zk.getStorageInfo();
    await zk.disconnect();
    
    const { attCount, attSize } = storage;
    const usedPercent = (attCount / attSize) * 100;
    const remainingPercent = Math.max(0, Math.floor(100 - usedPercent));

    res.json({ 
      used: attCount, 
      total: attSize, 
      percentage: remainingPercent 
    });
  } catch (error) {
    res.json({ percentage: 0, error: true });
  }
});

// Jalur 1: Sinkronisasi Log Absensi dengan Validasi Jadwal Ketat
const runSyncAll = async (onProgress?: (step: string, percent: number, details?: string) => void) => {
  const sendProgress = onProgress || ((step, percent, details) => console.log(`[Sync] ${step} (${percent}%) ${details || ''}`));
  
  try {
    const activeDevices = await prisma.device.findMany({ where: { isActive: true } });
    if (activeDevices.length === 0) {
        sendProgress('Tidak ada mesin aktif', 100);
        return;
    }
    const employees = await prisma.employee.findMany({
      include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } }
    });
    const empMap = new Map(employees.map(e => [e.id, e]));

    for (const dev of activeDevices) {
      try {
        sendProgress(`${dev.name}: Menghubungkan...`, (activeDevices.indexOf(dev) / activeDevices.length) * 100);
        
        const zk = new ZKLib(dev.ipAddress, dev.port, 30000, 10000);
        await zk.createSocket();
        
        const logs = await zk.getAttendances();
        await zk.disconnect(); 

        if (!logs || !logs.data || logs.data.length === 0) {
          sendProgress(`${dev.name}: Log mesin kosong`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
          await prisma.device.update({ where: { id: dev.id }, data: { lastSync: new Date() } });
          continue;
        }

        const last = await prisma.attendance.findFirst({ where: { deviceId: dev.id }, orderBy: { timestamp: 'desc' } });
        const lastTs = last ? last.timestamp.getTime() : 0;
        
        const logsToSave: any[] = [];
        for (const l of logs.data) {
          const uid = parseInt(l.deviceUserId);
          const tapTime = new Date(l.recordTime);
          const tapYear = tapTime.getFullYear();
          
          if (tapYear < 2020 || tapYear > 2030 || tapTime.getTime() <= lastTs || !empMap.has(uid)) continue;

          const emp = empMap.get(uid)!;
          const formatTime = (d: Date) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
          const nowTime = formatTime(tapTime);

          let type: string | null = null;

          // 1. Check Today's Schedule
          for (const ap of emp.employeepattern) {
              const diffDays = Math.floor((tapTime.getTime() - ap.startDate.getTime()) / (1000 * 60 * 60 * 24));
              const dayInCycle = (diffDays % ap.shiftpattern.cycleDays) + 1;
              const item = ap.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dayInCycle);
              if (item && item.timetable) {
                  const tt = item.timetable;
                  if (nowTime >= (tt.mulaiScanIn || '00:00') && nowTime <= (tt.akhirScanIn || '23:59')) type = 'CHECK IN';
                  else if (nowTime >= (tt.mulaiScanOut || '00:00') && nowTime <= (tt.akhirScanOut || '23:59')) type = 'CHECK OUT';
              }
          }

          // 2. Yesterday Check
          if (!type) {
              const yesterday = new Date(tapTime.getTime() - 86400000);
              for (const ap of emp.employeepattern) {
                  const diffDays = Math.floor((yesterday.getTime() - ap.startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const dayInCycle = (diffDays % ap.shiftpattern.cycleDays) + 1;
                  const item = ap.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dayInCycle);
                  if (item && item.timetable) {
                      const tt = item.timetable;
                      if (nowTime >= (tt.mulaiScanOut || '00:00') && nowTime <= (tt.akhirScanOut || '23:59')) type = 'CHECK OUT';
                  }
              }
          }

          if (!type) {
              const tapLocalHour = (tapTime.getUTCHours() + 7) % 24;
              type = tapLocalHour < 12 ? 'CHECK IN' : 'CHECK OUT';
          }
          logsToSave.push({ employeeId: uid, timestamp: tapTime, type, deviceId: dev.id });
        }

        if (logsToSave.length > 0) {
          await prisma.attendance.createMany({ data: logsToSave, skipDuplicates: true });
          sendProgress(`${dev.name}: Berhasil sinkron ${logsToSave.length} log baru`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
        } else {
          sendProgress(`${dev.name}: Tidak ada log baru`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
        }
        await prisma.device.update({ where: { id: dev.id }, data: { lastSync: new Date() } });
      } catch (devErr: any) {
        console.error(`[Sync Error - ${dev.name}]`, devErr);
        sendProgress(`${dev.name}: GAGAL (${devErr.message || 'Koneksi Terputus'})`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
      }
    }
    sendProgress('Sinkronisasi Selesai!', 100);
  } catch (err: any) { 
    console.error("[Sync Global Error]", err);
    sendProgress('ERROR KRITIS: ' + (err.message || 'Terjadi kesalahan sistem'), 100); 
  }
};

app.get('/api/machine/sync-all', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  await runSyncAll((step, percent, details) => {
    res.write(`data: ${JSON.stringify({ step, percent, details })}\n\n`);
  });
  
  res.end();
});

// Jalur Baru: Sinkronisasi PER MESIN SPECIFIC
app.get('/api/machine/sync-one/:id', async (req, res) => {
  const isSSE = req.headers.accept === 'text/event-stream';
  
  if (isSSE) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  }
  
  const sendProgress = (step: string, percent: number) => {
    if (isSSE) res.write(`data: ${JSON.stringify({ step, percent })}\n\n`);
    console.log(`[Sync Device] ${step} (${percent}%)`);
  };
  
  const devId = parseInt(req.params.id);
  try {
    const dev = await prisma.device.findUnique({ where: { id: devId } });
    if (!dev) {
        if (isSSE) { sendProgress('Perangkat tidak ditemukan', 100); res.end(); }
        else return res.status(404).json({ error: 'Perangkat tidak ditemukan' });
        return;
    }

    sendProgress(`Menghubungkan ke ${dev.name}...`, 10);
    
    const employees = await prisma.employee.findMany({
      include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } }
    });
    const empMap = new Map(employees.map(e => [e.id, e]));

    const zk = new ZKLib(dev.ipAddress, dev.port, 40000, 10000);
    await zk.createSocket();
    
    sendProgress('Mengambil data log...', 40);
    const logs = await zk.getAttendances();
    await zk.disconnect();

    if (!logs || !logs.data || logs.data.length === 0) {
        await prisma.device.update({ where: { id: devId }, data: { lastSync: new Date() } });
        if (isSSE) { sendProgress('Log di mesin kosong', 100); res.end(); }
        else res.json({ success: true, message: 'Log kosong' });
        return;
    }

    sendProgress(`Memproses ${logs.data.length} log...`, 70);
    const last = await prisma.attendance.findFirst({ where: { deviceId: devId }, orderBy: { timestamp: 'desc' } });
    const lastTs = last ? last.timestamp.getTime() : 0;
    
    const logsToSave: any[] = [];
    for (const l of logs.data) {
        const uid = parseInt(l.deviceUserId);
        const tapTime = new Date(l.recordTime);
        const tapYear = tapTime.getFullYear();
        if (tapYear < 2020 || tapYear > 2030 || tapTime.getTime() <= lastTs || !empMap.has(uid)) continue;

        const emp = empMap.get(uid)!;
        const formatTime = (d: Date) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        const nowTime = formatTime(tapTime);

        let type: string | null = null;
        for (const ap of emp.employeepattern) {
            const diffDays = Math.floor((tapTime.getTime() - ap.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const dayInCycle = (diffDays % ap.shiftpattern.cycleDays) + 1;
            const item = ap.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dayInCycle);
            if (item && item.timetable) {
                const tt = item.timetable;
                if (nowTime >= (tt.mulaiScanIn || '00:00') && nowTime <= (tt.akhirScanIn || '23:59')) type = 'CHECK IN';
                else if (nowTime >= (tt.mulaiScanOut || '00:00') && nowTime <= (tt.akhirScanOut || '23:59')) type = 'CHECK OUT';
            }
        }
        
        if (!type) {
            const yesterday = new Date(tapTime.getTime() - 86400000);
            for (const ap of emp.employeepattern) {
                const diffDays = Math.floor((yesterday.getTime() - ap.startDate.getTime()) / (1000 * 60 * 60 * 24));
                const dayInCycle = (diffDays % ap.shiftpattern.cycleDays) + 1;
                const item = ap.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dayInCycle);
                if (item && item.timetable) {
                    const tt = item.timetable;
                    if (nowTime >= (tt.mulaiScanOut || '00:00') && nowTime <= (tt.akhirScanOut || '23:59')) type = 'CHECK OUT';
                }
            }
        }

        if (!type) {
            const tapLocalHour = (tapTime.getUTCHours() + 7) % 24;
            type = tapLocalHour < 12 ? 'CHECK IN' : 'CHECK OUT';
        }
        logsToSave.push({ employeeId: uid, timestamp: tapTime, type, deviceId: devId });
    }

    if (logsToSave.length > 0) {
        await prisma.attendance.createMany({ data: logsToSave, skipDuplicates: true });
        sendProgress(`Berhasil: ${logsToSave.length} data baru`, 100);
    } else {
        sendProgress('Tidak ada data baru', 100);
    }

    await prisma.device.update({ where: { id: devId }, data: { lastSync: new Date() } });
    if (isSSE) res.end();
    else res.json({ success: true, count: logsToSave.length });

  } catch (err: any) {
    console.error("[Sync One Error]", err);
    if (isSSE) { sendProgress('GAGAL: ' + (err.message || 'Koneksi terputus'), 100); res.end(); }
    else res.status(500).json({ error: err.message || 'Koneksi terputus' });
  }
});

// Jalur 2: Sinkronisasi Pegawai (Akan dipanggil dari Halaman Pegawai)
app.get('/api/machine/sync-employees', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const sendProgress = (step: string, percent: number, details?: string) => res.write(`data: ${JSON.stringify({ step, percent, details })}\n\n`);

    try {
        const activeDevices = await prisma.device.findMany({ where: { isActive: true } });
        if (activeDevices.length === 0) {
            sendProgress('Tidak ada mesin aktif', 100);
            res.end();
            return;
        }

        for (const dev of activeDevices) {
            try {
                sendProgress(`${dev.name}: Menghubungkan...`, (activeDevices.indexOf(dev) / activeDevices.length) * 100);
                const zk = new ZKLib(dev.ipAddress, dev.port, 20000, 5000);
                await zk.createSocket();

                sendProgress(`${dev.name}: Mengunduh Pegawai...`, 50);
                const users = await zk.getUsers();
                await zk.disconnect();

                if (!users || !users.data || users.data.length === 0) {
                    sendProgress(`${dev.name}: Tidak ada data pegawai`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
                    continue;
                }

                sendProgress(`${dev.name}: Memproses ${users.data.length} pegawai...`, 80);
                for (const u of users.data) {
                    if (u.name && u.name.trim() !== '') {
                        await prisma.employee.upsert({
                            where: { id: parseInt(u.userId) },
                            update: { name: u.name, updatedAt: new Date() },
                            create: { id: parseInt(u.userId), name: u.name, updatedAt: new Date() }
                        });
                    }
                }
                sendProgress(`${dev.name}: Selesai`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
            } catch (devErr: any) {
                console.error(`[Sync Employee Error - ${dev.name}]`, devErr);
                sendProgress(`${dev.name}: GAGAL (${devErr.message || 'Koneksi Terputus'})`, ((activeDevices.indexOf(dev) + 1) / activeDevices.length) * 100);
            }
        }
        sendProgress('Sinkronisasi Pegawai Selesai!', 100);
    } catch (err: any) {
        sendProgress('ERROR KRITIS: ' + (err.message || 'Gagal sinkron pegawai'), 100);
    }
    res.end();
}); 

// Laporan Detail Harian per Kursi/Pegawai
app.get('/api/reports/detailed', async (req, res) => {
  const { employeeId, startDate, endDate } = req.query;
  try {
    const empId = parseInt(String(employeeId));
    const start = new Date(`${startDate}T00:00:00+07:00`);
    const end = new Date(`${endDate}T23:59:59+07:00`);
    
    // Gunakan formatter yang sama dengan honor/recap agar presisi
    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' });
    const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
    const dayNameFormatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' });

    const emp = await prisma.employee.findUnique({
      where: { id: empId },
      include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } }
    });
    if (!emp) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });

    const logs = await prisma.attendance.findMany({
      where: { employeeId: empId, timestamp: { gte: start, lte: new Date(end.getTime() + 86400000) } },
      orderBy: { timestamp: 'asc' }
    });

    const sysS = await prisma.systemsetting.findMany();
    const sMap = new Map(sysS.map(s => [s.key, s.value]));
    
    const rU = parseInt(String(sMap.get('rate_umum') || 25000));
    const rS = parseInt(String(sMap.get('rate_sertif') || 25000));
    const rL = parseInt(String(sMap.get('rate_tidak_disiplin') || 10000));
    const pL = parseInt(sMap.get('penalty_late_minutes') || '5'); // Default 5
    const pE = parseInt(sMap.get('penalty_early_minutes') || '5'); // Default 5
    const vV = parseInt(String(sMap.get('voucher_nominal') || 0));

    const rB = emp.isSertifikasi ? rS : rU;

    const days = [];
    let dD = 0, nD = 0, tH = 0, tW = 0;

    let cd = new Date(start);
    while (cd <= end) {
      const dateStr = dateFormatter.format(cd);
      let tt: any = null;
      const ep = emp.employeepattern[0];
      
      if (ep && ep.shiftpattern?.startDate) {
        const dS = new Date(ep.shiftpattern.startDate); dS.setHours(0,0,0,0);
        const dC = new Date(cd); dC.setHours(0,0,0,0);
        const diff = Math.round((dC.getTime() - dS.getTime()) / 86400000);
        if (diff >= 0) {
          const dy = (diff % ep.shiftpattern.cycleDays) + 1;
          const ci = ep.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dy);
          if (ci?.timetable) {
            let dow = cd.getDay(); if (dow === 0) dow = 7;
            const tD = (ci.timetable.days || "1,2,3,4,5,6").split(',').map(Number);
            if (tD.includes(cd.getDay()) || tD.includes(dow)) tt = ci.timetable;
          }
        }
      }

      const dLogs = logs.filter(l => dateFormatter.format(l.timestamp) === dateStr);
      let status = tt ? 'ALPA' : 'LIBUR';
      let lateM = 0;
      let earlyM = 0;
      let iLog: any = null;
      let oLog: any = null;
      let ttp = 0;

      if (tt) {
        tW++;
        const isO = tt.jamPulang < tt.jamMasuk;
        const [thM, tmM] = tt.jamMasuk.split(/[:.]/).map(Number);
        const [thP, tmP] = tt.jamPulang.split(/[:.]/).map(Number);

        iLog = dLogs.find(l => {
          const hStr = timeFormatter.format(l.timestamp);
          if (l.isManual) {
            const [lh, lm] = hStr.split(':').map(Number);
            const dM = Math.abs((lh * 60 + lm) - (thM * 60 + tmM));
            const dP = Math.abs((lh * 60 + lm) - (thP * 60 + tmP));
            return dM <= dP;
          }
          return hStr >= (tt.mulaiScanIn || '00:00') && hStr <= (tt.akhirScanIn || '23:59');
        });

        const targetOut = isO ? logs.filter(l => dateFormatter.format(l.timestamp) === dateFormatter.format(new Date(cd.getTime() + 86400000))) : dLogs;
        oLog = [...targetOut].reverse().find(l => {
          const hStr = timeFormatter.format(l.timestamp);
          if (l.isManual) {
            const [lh, lm] = hStr.split(':').map(Number);
            const dM = Math.abs((lh * 60 + lm) - (thM * 60 + tmM));
            const dP = Math.abs((lh * 60 + lm) - (thP * 60 + tmP));
            return dP < dM;
          }
          return hStr >= (tt.mulaiScanOut || '00:00') && hStr <= (tt.akhirScanOut || '23:59');
        });

        if (iLog || oLog) {
          status = 'HADIR';
          tH++;
          
          let isDisciplined = true;
          if (iLog && tt.jamMasuk) {
            const hStr = timeFormatter.format(iLog.timestamp);
            const [lh, lm] = hStr.split(':').map(Number);
            const diff = (lh * 60 + lm) - (thM * 60 + tmM);
            if (diff > 5) { // Threshold 5 mins from recap
              lateM = diff;
              isDisciplined = false;
            }
          } else if (!iLog && oLog && pL > 5) {
             isDisciplined = false; lateM = pL;
          }

          if (oLog && tt.jamPulang) {
             const hStr = timeFormatter.format(oLog.timestamp);
             const [lh, lm] = hStr.split(':').map(Number);
             const targetH = isO ? thP + 24 : thP;
             const actualH = isO ? lh + 24 : lh;
             const diff = (targetH * 60 + tmP) - (actualH * 60 + lm);
             if (diff > 5) { // Threshold 5 mins from recap
                earlyM = diff;
                isDisciplined = false;
             }
          } else if (!oLog && iLog && pE > 5) {
             isDisciplined = false; earlyM = pE;
          }

          if (isDisciplined) {
             dD++; ttp = rB;
          } else {
             nD++; ttp = rL;
          }
        }
      }

      days.push({
        date: dateStr,
        status,
        timetable: tt ? { name: tt.name, jamMasuk: tt.jamMasuk, jamPulang: tt.jamPulang } : null,
        logs: { in: iLog?.timestamp || null, out: oLog?.timestamp || null },
        lateMinutes: lateM,
        earlyMinutes: earlyM,
        ttpValue: ttp
      });

      cd.setDate(cd.getDate() + 1);
    }

    const bruto = (dD * rB) + (nD * rL);
    
    // Transform days to flattened logs for ReportsPage compatibility
    const dailyLogs = days.map(d => {
      const dateObj = new Date(parse(d.date, 'yyyy-MM-dd', new Date()));
      const displayDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta' }).format(dateObj);
      
      return {
        tanggal: displayDate,
        hari: dayNameFormatter.format(dateObj),
        jamMasuk: d.timetable?.jamMasuk || null,
        jamPulang: d.timetable?.jamPulang || null,
        scanMasuk: d.logs.in ? timeFormatter.format(new Date(d.logs.in)) : '-',
        scanKeluar: d.logs.out ? timeFormatter.format(new Date(d.logs.out)) : '-',
        terlambat: d.lateMinutes > 0 ? `${Math.floor(d.lateMinutes / 60)}j ${d.lateMinutes % 60}m` : null,
        plgCpt: d.earlyMinutes > 0 ? `${Math.floor(d.earlyMinutes / 60)}j ${d.earlyMinutes % 60}m` : null,
        lateMinutes: d.lateMinutes,
        earlyMinutes: d.earlyMinutes,
        ttpValue: d.ttpValue,
        status: d.status
      };
    });

    res.json({
      employee: { id: emp.id, name: emp.name, nip: emp.nip, role: emp.role },
      days, // Keep for EmployeeDashboard (original format)
      logs: dailyLogs, // For ReportsPage (flattened format)
      summary: {
        totalDays: tH,
        totalDaysInPeriod: tW,
        totalAmount: bruto,
        voucherNominal: vV,
        netto: Math.max(0, bruto - vV),
        disciplinedDays: dD,
        nonDisciplinedDays: nD,
        rateBruto: rB,
        rateLate: rL
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil laporan detail' });
  }
});

app.get('/api/reports/monthly', async (req, res) => {
  const { employeeId, month, year } = req.query;
  try {
    const m = parseInt(String(month)), y = parseInt(String(year));
    const start = new Date(y, m - 1, 1), end = endOfMonth(start);
    let employees = [];
    if (employeeId === 'all') {
      employees = await prisma.employee.findMany({ include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } } });
    } else {
      const emp = await prisma.employee.findUnique({ where: { id: parseInt(String(employeeId)) }, include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } } });
      if (emp) employees = [emp];
    }
    const sys = await prisma.systemsetting.findMany();
    const sMap = new Map(sys.map(s => [s.key, s.value]));
    const pL = parseInt(sMap.get('penalty_late_minutes') || '0');
    const pE = parseInt(sMap.get('penalty_early_minutes') || '0');

    const results = [];
    for (const emp of employees) {
      const logs = await prisma.attendance.findMany({ where: { employeeId: emp.id, timestamp: { gte: start, lte: new Date(end.getTime() + 86400000) } } });
      let totalDays = 0, totalLate = 0, totalEarly = 0;
      let cd = new Date(start);
      while (cd <= end) {
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(cd);
        let tt: any = null; const ep = emp.employeepattern[0];
        if (ep && ep.shiftpattern?.startDate) {
          const dS = new Date(ep.shiftpattern.startDate); dS.setHours(0,0,0,0);
          const dC = new Date(cd); dC.setHours(0,0,0,0);
          const diff = Math.round((dC.getTime() - dS.getTime()) / 86400000);
          if (diff >= 0) {
            const dy = (diff % ep.shiftpattern.cycleDays) + 1;
            const ci = ep.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dy);
            if (ci?.timetable) {
              let dow = cd.getDay(); if (dow === 0) dow = 7;
              const tD = (ci.timetable.days || "1,2,3,4,5,6").split(',').map(Number);
              if (tD.includes(cd.getDay()) || tD.includes(dow)) tt = ci.timetable;
            }
          }
        }
        if (tt) {
          const isO = tt.jamPulang < tt.jamMasuk;
          const iLog = logs.find(l => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(l.timestamp) === dateStr && (l.isManual || (() => {
            const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(l.timestamp);
            return h >= (tt.mulaiScanIn || '00:00') && h <= (tt.akhirScanIn || '23:59');
          })()));
          const targetOut = isO ? logs.filter(l => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(l.timestamp) === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(cd.getTime() + 86400000))) : logs.filter(l => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(l.timestamp) === dateStr);
          const oLog = [...targetOut].reverse().find(l => l.isManual || (() => {
            const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(l.timestamp);
            return h >= (tt.mulaiScanOut || '00:00') && h <= (tt.akhirScanOut || '23:59');
          })());
          if (iLog || oLog) {
            totalDays++;
            if (iLog) {
              const [hIdx1, mIdx1] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(iLog.timestamp).split(':').map(Number);
              const [h1, m1] = tt.jamMasuk.split(/[:.]/).map(Number);
              const d1 = (hIdx1 * 60 + mIdx1) - (h1 * 60 + m1);
              if (d1 > 0) totalLate += d1;
            } else if (oLog && pL > 0) totalLate += pL;

            if (oLog) {
              const [hIdx2, mIdx2] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(oLog.timestamp).split(':').map(Number);
              const [h2, m2] = tt.jamPulang.split(/[:.]/).map(Number); const h2a = isO ? h2 + 24 : h2;
              let ah = hIdx2; if (isO) ah += 24;
              const d2 = (h2a * 60 + m2) - (ah * 60 + mIdx2);
              if (d2 > 0) totalEarly += d2;
            } else if (iLog && pE > 0) totalEarly += pE;
          }
        }
        // JIKA TT NULL (Bukan hari kerja), diabaikan sesuai permintaan
        cd.setDate(cd.getDate() + 1);
      }
      results.push({ employeeId: emp.id, employeeName: emp.name, totalDays, totalLate, totalEarly });
    }
    res.json(results);
  } catch (error) { res.status(500).json({ error: 'Gagal ringkasan' }); }
});

app.get('/api/honor/recap', async (req, res) => {
  const { month, year } = req.query;
  const m = parseInt(String(month)), y = parseInt(String(year));
  const start = new Date(y, m - 1, 1), end = endOfMonth(start);
  const settings = await prisma.systemsetting.findMany();
  const sMap = new Map(settings.map(s => [s.key, s.value]));
  const rU = parseInt(String(sMap.get('rate_umum') || 25000)), rS = parseInt(String(sMap.get('rate_sertif') || 25000)), rL = parseInt(String(sMap.get('rate_tidak_disiplin') || 10000)), vV = parseInt(String(sMap.get('voucher_nominal') || 30000));
  const pL = parseInt(sMap.get('penalty_late_minutes') || '0');
  const pE = parseInt(sMap.get('penalty_early_minutes') || '0');
  const employees = await prisma.employee.findMany({ include: { employeepattern: { include: { shiftpattern: { include: { shiftpatternitem: { include: { timetable: true } } } } } } } });
  
  const allLogs = await prisma.attendance.findMany({ 
    where: { timestamp: { gte: start, lte: new Date(end.getTime() + 86400000) } } 
  });

  // Pre-process logs into a Map for O(1) lookup
  const logsMap = new Map<string, any[]>();
  const dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
  const dayNameFormatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' });

  const getJktTime = (date: Date) => {
    // Ambil info tanggal Jakarta asli
    const s = date.toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
    const match = s.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/);
    if (!match) return "00:00";
    
    const [, dd, mm, yyyy, hh, mi] = match;
    const isOld = parseInt(yyyy) < 2026 || (parseInt(yyyy) === 2026 && parseInt(mm) < 5);

    if (isOld) {
      // Data April ke belakang: Ambil jam mentah (UTC)
      const h = date.getUTCHours().toString().padStart(2, '0');
      const m = date.getUTCMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    } else {
      // Data Mei ke depan: Ambil jam Jakarta asli (Hasil match)
      return `${hh}:${mi}`;
    }
  };
  
  const getJktDateStr = (date: Date) => {
    const s = date.toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
    const match = s.match(/(\d+)\/(\d+)\/(\d+)/);
    if (!match) return "01/01/2026";
    
    const [, dd, mm, yyyy] = match;
    const isOld = parseInt(yyyy) < 2026 || (parseInt(yyyy) === 2026 && parseInt(mm) < 5);

    if (isOld) {
      // Data April: Pakai UTC date agar tidak bergeser ke Mei
      const y = date.getUTCFullYear();
      const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const d = date.getUTCDate().toString().padStart(2, '0');
      return `${d}/${m}/${y}`;
    } else {
      // Data Mei: Pakai tanggal Jakarta asli
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
    }
  };

  allLogs.forEach(l => {
    const dateStr = getJktDateStr(l.timestamp);
    const key = `${l.employeeId}_${dateStr}`;
    if (!logsMap.has(key)) logsMap.set(key, []);
    logsMap.get(key)?.push(l);
  });

  const results: any[] = [];
  for (const emp of employees) {
    let dD = 0, nD = 0, tH = 0, tW = 0;
    
    let cdLoop = new Date(start);
    while (cdLoop <= end) {
      const dateStr = getJktDateStr(cdLoop);
      const cd = new Date(cdLoop);
      
      let tt: any = null; 
      const ep = emp.employeepattern && emp.employeepattern[0];
      if (ep && ep.shiftpattern) {
        // Ambil StartDate Pattern (Hanya Tanggalnya saja)
        const dS = new Date(ep.shiftpattern.startDate);
        dS.setHours(0,0,0,0);
        
        // Ambil Tanggal Berjalan (Hanya Tanggalnya saja)
        const dC = new Date(cd);
        dC.setHours(0,0,0,0);
        
        // Hitung selisih hari secara akurat
        const diffTime = dC.getTime() - dS.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0) {
          const dayCycle = (diffDays % ep.shiftpattern.cycleDays) + 1;
          const ci = ep.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dayCycle);
          
          if (ci && ci.timetable) {
            // Cek apakah hari ini (Senin-Minggu) aktif di jadwal tersebut
            let dow = dC.getDay(); // 0=Minggu, 1=Senin...
            const dowFixed = (dow === 0 ? 7 : dow); // Paksa 7=Minggu
            const validDays = (ci.timetable.days || "1,2,3,4,5,6").split(',').map(Number);
            
            if (validDays.includes(dow) || validDays.includes(dowFixed)) {
              tt = ci.timetable;
            }
          }
        }
      }

      if (tt) {
        tW++;
        const dayLogs = logsMap.get(`${emp.id}_${dateStr}`) || [];
        const isO = tt.jamPulang < tt.jamMasuk;
        
        const iL = dayLogs.find(l => l.isManual || (() => {
          const t = getJktTime(l.timestamp);
          return t >= (tt.mulaiScanIn || '00:00') && t <= (tt.akhirScanIn || '23:59');
        })());

        let targetOut = dayLogs;
        if (isO) {
          const tomorrow = new Date(cd); tomorrow.setDate(tomorrow.getDate() + 1);
          const nextDStr = dateFormatter.format(tomorrow);
          targetOut = logsMap.get(`${emp.id}_${nextDStr}`) || [];
        }

        const oL = [...targetOut].reverse().find(l => l.isManual || (() => {
          const t = getJktTime(l.timestamp);
          return t >= (tt.mulaiScanOut || '00:00') && t <= (tt.akhirScanOut || '23:59');
        })());

        if (iL || oL) {
          tH++; let late = false, early = false;
          if (iL && tt.jamMasuk) {
            const hStr = getJktTime(iL.timestamp);
            const [hIdx1, mIdx1] = hStr.split(':').map(Number);
            const [h, m] = tt.jamMasuk.split(/[:.]/).map(Number);
            if ((hIdx1 * 60 + mIdx1) - (h * 60 + m) > 5) {
              late = true;
              console.log(`[DEBUG] LATE: ${emp.name} | Date: ${dateStr} | Scan: ${hStr} | Target: ${tt.jamMasuk}`);
            }
          } else if (!iL && oL) {
             late = true;
          }

          if (oL && tt.jamPulang) {
            const hStr = getJktTime(oL.timestamp);
            const [hIdx2, mIdx2] = hStr.split(':').map(Number);
            const [h, m] = tt.jamPulang.split(/[:.]/).map(Number); 
            const ha = isO ? h + 24 : h;
            let ah = hIdx2; if (isO) ah += 24;
            if ((ha * 60 + m) - (ah * 60 + mIdx2) > 5) {
              early = true;
              console.log(`[DEBUG] EARLY: ${emp.name} | Date: ${dateStr} | Scan: ${hStr} | Target: ${tt.jamPulang}`);
            }
          } else if (!oL && iL) {
             // Jika baru scan masuk tapi belum scan pulang:
             // Anggap "Tidak Disiplin" (early = true) agar honor dasar (10rb) muncul.
             // Nanti kalau sudah scan pulang dengan benar, otomatis jadi dD (Disiplin).
             early = true;
          }

          if (!late && !early) dD++; else nD++;
        }
      }
      cdLoop.setDate(cdLoop.getDate() + 1);
    }

    const rB = emp.isSertifikasi ? rS : rU;
    const bruto = (dD * rB) + (nD * rL);
    results.push({ 
      employeeId: emp.id, 
      employeeName: emp.name, 
      isSertifikasi: emp.isSertifikasi, 
      totalHadir: tH, 
      disciplinedDays: dD, 
      nonDisciplinedDays: nD, 
      totalAbsent: tW - tH, 
      totalWorkDays: tW, 
      bruto, 
      netto: Math.max(0, bruto - vV), 
      voucherNominal: vV,
      rateBruto: rB,
      rateLate: rL
    });
  }
  res.json({ 
    summary: { 
      totalNetto: results.reduce((acc, r) => acc + r.netto, 0),
      totalDisciplined: results.reduce((acc, r) => acc + r.disciplinedDays, 0),
      totalNonDisciplined: results.reduce((acc, r) => acc + r.nonDisciplinedDays, 0),
    },
    data: results 
  });
});

// Endpoint untuk mendapatkan daftar pegawai yang BELUM HADIR (Tidak ada log tap jari padahal ada jadwal)
app.get('/api/reports/absent', async (req, res) => {
  const { date } = req.query;
  try {
    const targetDate = date ? new Date(String(date)) : new Date();
    targetDate.setHours(0,0,0,0);
    
    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' });
    const dateStr = dateFormatter.format(targetDate);
    
    // 1. Ambil semua pegawai & pola shift-nya
    const employees = await prisma.employee.findMany({ 
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

    // 2. Ambil log hari ini saja
    const logs = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: new Date(targetDate.getTime()),
          lte: new Date(targetDate.getTime() + 86400000)
        }
      }
    });

    const presentIds = new Set(logs.map(l => l.employeeId));
    const absentList = [];

    for (const emp of employees) {
      // Jika sudah hadir, skip
      if (presentIds.has(emp.id)) continue;

      // 3. Cek apakah hari ini dia HARUSNYA masuk sesuai shift?
      let hasShiftToday = false;
      const ep = emp.employeepattern[0];

      if (ep && ep.shiftpattern?.startDate) {
        const dS = new Date(ep.shiftpattern.startDate); dS.setHours(0,0,0,0);
        const diff = Math.round((targetDate.getTime() - dS.getTime()) / 86400000);
        
        if (diff >= 0) {
          const dy = (diff % ep.shiftpattern.cycleDays) + 1;
          const ci = ep.shiftpattern.shiftpatternitem.find(i => i.dayNumber === dy);
          
          if (ci?.timetable) {
            // Cek apakah hari ini (Senin-Minggu) aktif di jadwal tersebut
            let dow = targetDate.getDay(); 
            if (dow === 0) dow = 7; // Sesuaikan Minggu = 7
            
            const validDays = (ci.timetable.days || "1,2,3,4,5,6,7").split(',').map(Number);
            if (validDays.includes(targetDate.getDay()) || validDays.includes(dow)) {
              hasShiftToday = true;
            }
          }
        }
      }

      // Jika punya jadwal tapi tidak ada log hadir
      if (hasShiftToday) {
        absentList.push({
          id: emp.id,
          name: emp.name,
          role: emp.role || 'GURU'
        });
      }
    }

    res.json(absentList);
  } catch (error) {
    console.error("[Absent Report Error]", error);
    res.status(500).json({ error: 'Gagal mengambil data belum hadir' });
  }
});

// SETTINGS API
app.get('/api/settings', async (req, res) => res.json(await prisma.systemsetting.findMany()));
app.post('/api/settings', async (req, res) => {
  if (req.body.settings) {
    for (const s of req.body.settings) {
      await prisma.systemsetting.upsert({
        where: { key: s.key },
        update: { value: String(s.value), updatedAt: new Date() },
        create: { key: s.key, value: String(s.value), updatedAt: new Date() }
      });
    }
  }
  if (req.body.sertifikasiIds) {
    await prisma.employee.updateMany({ data: { isSertifikasi: false } });
    if (req.body.sertifikasiIds.length > 0) {
      await prisma.employee.updateMany({ 
        where: { id: { in: req.body.sertifikasiIds.map(Number) } }, 
        data: { isSertifikasi: true } 
      });
    }
  }
  res.json({ success: true });
});

app.get('/api/settings/backup', async (req, res) => {
  try {
    const data = {
      employees: await prisma.employee.findMany(),
      categories: await prisma.category.findMany(),
      timetables: await prisma.timetable.findMany(),
      patterns: await prisma.shiftpattern.findMany(),
      patternItems: await prisma.shiftpatternitem.findMany(),
      employeePatterns: await prisma.employeepattern.findMany(),
      attendances: await prisma.attendance.findMany(),
      devices: await prisma.device.findMany(),
      settings: await prisma.systemsetting.findMany()
    };
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Gagal backup' }); }
});

app.post('/api/settings/restore', upload.single('backup'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const data = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany();
      await tx.honor.deleteMany();
      await tx.employeepattern.deleteMany();
      await tx.employeeshift.deleteMany();
      await tx.shiftpatternitem.deleteMany();
      await tx.shiftpattern.deleteMany();
      await tx.timetable.deleteMany();
      await tx.category.deleteMany();
      await tx.employee.deleteMany();
      await tx.device.deleteMany();
      await tx.systemsetting.deleteMany();

      if (data.employees) await tx.employee.createMany({ data: data.employees });
      if (data.categories) await tx.category.createMany({ data: data.categories });
      if (data.timetables) await tx.timetable.createMany({ data: data.timetables });
      if (data.patterns) await tx.shiftpattern.createMany({ data: data.patterns });
      if (data.patternItems) await tx.shiftpatternitem.createMany({ data: data.patternItems });
      if (data.employeePatterns) await tx.employeepattern.createMany({ data: data.employeePatterns });
      if (data.attendances) await tx.attendance.createMany({ data: data.attendances });
      if (data.devices) await tx.device.createMany({ data: data.devices });
      if (data.settings) await tx.systemsetting.createMany({ data: data.settings });
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true });
  } catch (error) { 
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Gagal restore' }); 
  }
});

// --- SERVE FRONTEND (Untuk Produksi/Docker) ---
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Middleware cadangan untuk menangani Refresh di SPA (Single Page Application)
// Tanpa menggunakan simbol bintang (*) agar kompatibel dengan Express 5
app.use((req, res) => {
  // Jika request dimulai dengan /api, jangan kirim index.html (biar error 404 asli)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${port}`);
});

// --- AUTO SYNC BACKGROUND TASK (EVERY SHARP HOUR) ---
const initAutoSync = () => {
  const startSync = async () => {
    console.log(`[AutoSync] Starting automatic synchronization at sharp hour: ${new Date().toLocaleString()}...`);
    await runSyncAll();
  };

  const scheduleNext = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const msToNext = nextHour.getTime() - now.getTime();

    console.log(`[AutoSync] Next sync scheduled in ${Math.round(msToNext / 60000)} minutes (at ${nextHour.toLocaleTimeString()}).`);

    setTimeout(async () => {
      await startSync();
      // Setelah sinkronisasi pertama di jam tepat, ulangi setiap jam
      setInterval(startSync, 3600000);
    }, msToNext);
  };

  // Tunggu sebentar agar server stabil sebelum menghitung jadwal
  setTimeout(() => {
    console.log('[AutoSync] Initializing background sync scheduler...');
    scheduleNext();
  }, 10000);
};
initAutoSync();
