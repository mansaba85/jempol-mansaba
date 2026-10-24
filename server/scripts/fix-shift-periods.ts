/**
 * fix-shift-periods.ts — Perbaikan data periode penugasan pola shift yang korup.
 *
 * Latar belakang: logika penugasan lama menutup periode aktif tanpa validasi,
 * sehingga lahir baris employeepattern yang mustahil (endDate < startDate) dan
 * periode tumpang tindih. Akibatnya penilaian honor/laporan bulan-bulan
 * sebelumnya berubah atau runtuh (contoh: disiplin September menjadi 0).
 *
 * Yang diperbaiki skrip ini (konservatif, hanya yang terbukti mustahil):
 *  1. Baris invalid (endDate < startDate) yang merupakan duplikat persis dari
 *     baris valid (pegawai + pola + tanggal mulai sama) -> baris invalid DIHAPUS.
 *  2. Baris invalid lain -> endDate diisi sehari sebelum periode berikutnya
 *     mulai (atau dilaporkan untuk ditinjau manual bila tidak bisa ditentukan).
 *  3. shiftpattern.cycleDays yang lebih kecil dari dayNumber item terbesar
 *     (item di luar siklus tidak pernah terpilih rumus) -> dinaikkan.
 * Tumpang tindih antar baris VALID hanya DILAPORKAN, tidak diubah otomatis,
 * karena memilih salah satunya adalah keputusan manusia.
 *
 * Pemakaian (dari folder server, DATABASE_URL terisi / .env ada):
 *   npx tsx scripts/fix-shift-periods.ts           # dry-run: hanya laporan
 *   npx tsx scripts/fix-shift-periods.ts --apply   # terapkan perbaikan
 */
import { pathToFileURL } from 'url';
// PrismaClient diimpor dinamis di dalam main() agar fungsi perencana murni
// (planPeriodRepairs/planCycleFixes) bisa diimpor & diuji tanpa client ter-generate.

export interface PeriodRow {
  id: number;
  employeeId: number;
  patternId: number;
  startDate: string; // ISO / yyyy-mm-dd
  endDate: string | null;
}

export interface RepairPlan {
  deletes: { id: number; reason: string }[];
  updates: { id: number; endDate: string; reason: string }[];
  cycleFixes: { patternId: number; from: number; to: number }[];
  warnings: string[];
}

const dayMs = 86400000;
const dOnly = (s: string) => s.slice(0, 10);
const toMs = (s: string) => new Date(dOnly(s) + 'T00:00:00.000Z').getTime();
const toISODate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const isValid = (r: PeriodRow) => r.endDate === null || toMs(r.endDate) >= toMs(r.startDate);

export function planPeriodRepairs(rows: PeriodRow[]): Pick<RepairPlan, 'deletes' | 'updates' | 'warnings'> {
  const deletes: RepairPlan['deletes'] = [];
  const updates: RepairPlan['updates'] = [];
  const warnings: string[] = [];

  const byEmployee = new Map<number, PeriodRow[]>();
  for (const r of rows) {
    if (!byEmployee.has(r.employeeId)) byEmployee.set(r.employeeId, []);
    byEmployee.get(r.employeeId)!.push(r);
  }

  for (const [employeeId, list] of byEmployee) {
    const sorted = [...list].sort((a, b) => toMs(a.startDate) - toMs(b.startDate) || a.id - b.id);
    const deletedIds = new Set<number>();

    for (const row of sorted) {
      if (isValid(row)) continue;
      // (1) Duplikat persis dari baris valid -> hapus yang invalid.
      const dup = sorted.find(
        o => o.id !== row.id && !deletedIds.has(o.id) && o.patternId === row.patternId &&
             dOnly(o.startDate) === dOnly(row.startDate) && isValid(o)
      );
      if (dup) {
        deletes.push({ id: row.id, reason: `pegawai ${employeeId}: baris #${row.id} (pola ${row.patternId}, ${dOnly(row.startDate)} s.d. ${dOnly(row.endDate!)}) invalid dan duplikat persis dari baris valid #${dup.id}` });
        deletedIds.add(row.id);
        continue;
      }
      // (2) endDate = sehari sebelum periode lain yang mulai belakangan.
      const nextStart = sorted
        .filter(o => o.id !== row.id && !deletedIds.has(o.id) && toMs(o.startDate) > toMs(row.startDate))
        .map(o => toMs(o.startDate))
        .sort((a, b) => a - b)[0];
      if (nextStart !== undefined && nextStart - dayMs >= toMs(row.startDate)) {
        updates.push({ id: row.id, endDate: toISODate(nextStart - dayMs), reason: `pegawai ${employeeId}: baris #${row.id} (pola ${row.patternId}, mulai ${dOnly(row.startDate)}) endDate mustahil ${dOnly(row.endDate!)} -> diisi ${toISODate(nextStart - dayMs)} (sehari sebelum periode berikutnya)` });
        row.endDate = toISODate(nextStart - dayMs);
        continue;
      }
      warnings.push(`pegawai ${employeeId}: baris #${row.id} (pola ${row.patternId}, ${dOnly(row.startDate)} s.d. ${row.endDate ? dOnly(row.endDate) : 'aktif'}) invalid dan tidak bisa diperbaiki otomatis — tinjau manual.`);
    }

    // Laporan tumpang tindih antar baris valid (tidak diubah otomatis).
    const remaining = sorted.filter(r => !deletedIds.has(r.id) && isValid(r));
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const a = remaining[i], b = remaining[j];
        const aEnd = a.endDate ? toMs(a.endDate) : Infinity;
        const bEnd = b.endDate ? toMs(b.endDate) : Infinity;
        if (toMs(a.startDate) <= bEnd && toMs(b.startDate) <= aEnd) {
          warnings.push(`pegawai ${employeeId}: periode #${a.id} (pola ${a.patternId}, ${dOnly(a.startDate)} s.d. ${a.endDate ? dOnly(a.endDate) : 'aktif'}) tumpang tindih dengan #${b.id} (pola ${b.patternId}, ${dOnly(b.startDate)} s.d. ${b.endDate ? dOnly(b.endDate) : 'aktif'}) — penilaian memakai periode bertanggal mulai paling akhir; pastikan memang itu yang benar.`);
        }
      }
    }
    const actives = remaining.filter(r => r.endDate === null);
    if (actives.length > 1) {
      warnings.push(`pegawai ${employeeId}: memiliki ${actives.length} periode aktif (endDate kosong) — seharusnya hanya satu.`);
    }
  }
  return { deletes, updates, warnings };
}

export function planCycleFixes(patterns: { id: number; cycleDays: number; maxDay: number }[]): RepairPlan['cycleFixes'] {
  return patterns
    .filter(p => p.maxDay > p.cycleDays)
    .map(p => ({ patternId: p.id, from: p.cycleDays, to: p.maxDay }));
}

async function main() {
  const apply = process.argv.includes('--apply');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.employeepattern.findMany({ orderBy: [{ employeeId: 'asc' }, { startDate: 'asc' }, { id: 'asc' }] });
    const periodRows: PeriodRow[] = rows.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      patternId: r.patternId,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate ? r.endDate.toISOString() : null
    }));
    const plan = planPeriodRepairs(periodRows);

    const patterns = await prisma.shiftpattern.findMany({ include: { shiftpatternitem: true } });
    const cycleFixes = planCycleFixes(patterns.map(p => ({
      id: p.id,
      cycleDays: p.cycleDays,
      maxDay: p.shiftpatternitem.reduce((m, it) => Math.max(m, it.dayNumber), 0)
    })));

    console.log(`Mode: ${apply ? 'APPLY (menulis ke database)' : 'DRY-RUN (tidak ada perubahan)'}`);
    console.log(`Total baris periode diperiksa: ${periodRows.length}`);
    console.log(`\nHAPUS (${plan.deletes.length}):`);
    plan.deletes.forEach(d => console.log('  -', d.reason));
    console.log(`\nUBAH endDate (${plan.updates.length}):`);
    plan.updates.forEach(u => console.log('  -', u.reason));
    console.log(`\nPERBAIKI cycleDays (${cycleFixes.length}):`);
    cycleFixes.forEach(c => console.log(`  - pola ${c.patternId}: cycleDays ${c.from} -> ${c.to}`));
    console.log(`\nPERINGATAN (${plan.warnings.length}):`);
    plan.warnings.forEach(w => console.log('  !', w));

    if (!apply) {
      console.log('\nDry-run selesai. Jalankan dengan --apply untuk menerapkan HAPUS/UBAH/PERBAIKI di atas.');
      return;
    }
    await prisma.$transaction(async (tx) => {
      for (const d of plan.deletes) await tx.employeepattern.delete({ where: { id: d.id } });
      for (const u of plan.updates) await tx.employeepattern.update({ where: { id: u.id }, data: { endDate: new Date(u.endDate + 'T00:00:00.000Z') } });
      for (const c of cycleFixes) await tx.shiftpattern.update({ where: { id: c.patternId }, data: { cycleDays: c.to } });
    });
    console.log('\nPerbaikan diterapkan.');
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e); process.exit(1); });
}
