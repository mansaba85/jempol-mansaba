import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const SummaryCard = ({ label, val, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <div className="mansaba-card py-4 px-5">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border ${colorMap[color]}`}>
             <i className={`fa-solid ${icon}`}></i>
          </div>
          <div>
             <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
             <h4 className="text-lg font-bold text-slate-800">{val}</h4>
          </div>
       </div>
    </div>
  );
};

const RecapPage = () => {
  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [settings, setSettings] = useState<any>({});

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reports/monthly`, {
        params: {
          employeeId: 'all',
          month: selectedMonth,
          year: selectedYear
        }
      });
      setRecapData(res.data);
    } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil data rekap bulanan');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      const sMap: any = {};
      res.data.forEach((s: any) => { sMap[s.key] = s.value; });
      setSettings(sMap);
    } catch (err) { console.error(err); }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periode = format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', { locale: id }).toUpperCase();
    const namaSekolah = settings.school_name || 'MA NU 01 Banyuputih';
    const alamatSekolah = settings.school_address || 'Jalan Lapangan 9A Banyuputih Batang';
    const logoSekolah = settings.school_logo || '/logo.png';
    const namaKepala = settings.headmaster_name || '...........................';
    const nipKepala = settings.headmaster_nip || '...........................';
    const namaBendahara = settings.treasurer_name || '...........................';
    const nipBendahara = settings.treasurer_nip || '...........................';
    const tanggalCetak = format(new Date(), 'dd MMMM yyyy', { locale: id });

    const sum = (key: string) => filteredData.reduce((acc, c) => acc + (c[key] || 0), 0);
    const fmtDur = (mins: number) => `${Math.floor(mins / 60)}j ${mins % 60}m`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap_Presensi_${periode.replace(' ', '_')}</title>
        <style>
          .kop-surat { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 15px; }
          .kop-surat img { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
          .kop-surat .identitas { flex: 1; }
          .kop-surat .identitas h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .kop-surat .identitas p { margin: 2px 0 0 0; font-size: 10px; }
          .kop-surat .dokumen { text-align: right; flex-shrink: 0; max-width: 45%; }
          .kop-surat .dokumen h3 { margin: 0; font-size: 13px; font-weight: bold; }
          .kop-surat .dokumen p { margin: 2px 0 0 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 4px 6px; font-size: 10px; }
          th { font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .ttd-container { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 80px; }
          .ttd-box { text-align: center; }
          .ttd-box p { margin: 0; font-size: 11px; }
          .ttd-box .nama { margin-top: 70px; font-weight: bold; text-decoration: underline; }
        </style>
      </head>
      <body>
          <div class="kop-surat">
              <img src="${logoSekolah}" onerror="this.style.display='none'" />
              <div class="identitas">
                 <h2>${namaSekolah}</h2>
                 <p>Alamat : ${alamatSekolah}</p>
              </div>
              <div class="dokumen">
                 <h3>REKAPITULASI KEHADIRAN &amp; KEDISIPLINAN PEGAWAI</h3>
                 <p>Periode: ${periode}</p>
              </div>
          </div>

          <table>
             <thead>
                <tr>
                  <th style="width: 30px;">NO</th>
                  <th class="text-left">NAMA PEGAWAI</th>
                  <th style="width: 60px;">JADWAL</th>
                  <th style="width: 60px;">HADIR</th>
                  <th style="width: 60px;">ALPA</th>
                  <th style="width: 70px;">TELAT (MNT)</th>
                  <th style="width: 70px;">P. CEPAT (MNT)</th>
                  <th style="width: 80px;">TOTAL JAM</th>
                </tr>
             </thead>
             <tbody>
                ${filteredData.map((row, i) => `
                   <tr>
                      <td class="text-center">${i + 1}</td>
                      <td class="font-bold uppercase">${row.employeeName}</td>
                      <td class="text-center">${row.totalWorkDays}</td>
                      <td class="text-center">${row.totalDays}</td>
                      <td class="text-center">${row.totalAbsent}</td>
                      <td class="text-center">${row.totalLate}</td>
                      <td class="text-center">${row.totalEarly}</td>
                      <td class="text-center font-bold">${fmtDur(row.totalWorkDuration)}</td>
                   </tr>
                `).join('')}
                <tr class="font-bold">
                   <td colspan="2" class="text-center uppercase">Jumlah Total</td>
                   <td class="text-center">${sum('totalWorkDays')}</td>
                   <td class="text-center">${sum('totalDays')}</td>
                   <td class="text-center">${sum('totalAbsent')}</td>
                   <td class="text-center">${sum('totalLate')}</td>
                   <td class="text-center">${sum('totalEarly')}</td>
                   <td class="text-center">${fmtDur(sum('totalWorkDuration'))}</td>
                </tr>
             </tbody>
          </table>

          <div class="ttd-container">
              <div class="ttd-box">
                 <p>Mengetahui,</p>
                 <p>Kepala Madrasah</p>
                 <p class="nama">${namaKepala}</p>
                 <p>NIP. ${nipKepala}</p>
              </div>
              <div class="ttd-box">
                 <p>Banyuputih, ${tanggalCetak}</p>
                 <p>Bendahara,</p>
                 <p class="nama">${namaBendahara}</p>
                 <p>NIP. ${nipBendahara}</p>
              </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchRecap();
    fetchSettings();
  }, [fetchRecap]);

  const filteredData = recapData.filter(item =>
    item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    item.employeeId.toString().includes(search)
  ).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const statusBadge = (row: any) => {
    if (row.totalAbsent === 0 && row.totalLate === 0) {
      return <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Sempurna</span>;
    }
    if (row.totalAbsent > 3) {
      return <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">Perlu Perhatian</span>;
    }
    return <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Stabil</span>;
  };

  return (
    <div className="space-y-6 pb-20">
      <Toaster />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Rekap Presensi</h2>
           <p className="text-sm text-slate-500 mt-1">Rekapitulasi kehadiran &amp; kedisiplinan pegawai per bulan.</p>
        </div>
      </div>

      <div className="space-y-6">
          {/* METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard label="Jumlah Pegawai" val={filteredData.length} icon="fa-users" color="blue" />
            <SummaryCard label="Total Hadir" val={filteredData.reduce((acc, c) => acc + (c.totalDays || 0), 0)} icon="fa-calendar-check" color="emerald" />
            <SummaryCard label="Total Alpa" val={filteredData.reduce((acc, c) => acc + (c.totalAbsent || 0), 0)} icon="fa-user-slash" color="rose" />
            <SummaryCard label="Total Telat (Menit)" val={filteredData.reduce((acc, c) => acc + (c.totalLate || 0), 0)} icon="fa-clock" color="slate" />
          </div>

          {/* FILTER CONTROL */}
          <div className="mansaba-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input className="mansaba-input pl-10" placeholder="Cari nama pegawai..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Bulan:</span>
                  <select className="mansaba-input !py-1.5 w-auto" value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))}>
                      {Array.from({length:12}, (_,i)=><option key={i+1} value={i+1}>{format(new Date(2022,i,1),'MMMM', {locale: id})}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Tahun:</span>
                  <select className="mansaba-input !py-1.5 w-auto" value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))}>
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={handlePrint} className="w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all bg-white" title="Cetak Rekap">
                  <i className="fa-solid fa-print"></i>
                </button>
            </div>
          </div>

          {/* MAIN DATA TABLE */}
          <div className="mansaba-card-no-pad">
                <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 text-rose-600 animate-pulse bg-rose-50/30">
                  <i className="fa-solid fa-angles-right text-[10px]"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Geser ke samping untuk detail rekap</span>
                </div>
                <div className="overflow-x-auto">
                <table className="mansaba-table">
                  <thead>
                      <tr>
                        <th className="mansaba-th text-center w-12">No.</th>
                        <th className="mansaba-th text-center w-24">No. ID</th>
                        <th className="mansaba-th">Nama Pegawai</th>
                        <th className="mansaba-th text-center">Jadwal / Hadir</th>
                        <th className="mansaba-th text-center">Alpa</th>
                        <th className="mansaba-th text-center">Telat (Mnt)</th>
                        <th className="mansaba-th text-center">P. Cepat (Mnt)</th>
                        <th className="mansaba-th text-center">Total Jam</th>
                        <th className="mansaba-th text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-20 text-center text-sm text-slate-500">Memuat data...</td>
                      </tr>
                    ) : filteredData.length > 0 ? filteredData.map((row, i) => (
                      <tr key={row.employeeId} className="tr-hover">
                        <td className="mansaba-td text-center">{i + 1}</td>
                        <td className="mansaba-td text-center">
                           <span className="font-medium text-blue-600 text-xs">#{String(row.employeeId).padStart(5, '0')}</span>
                        </td>
                        <td className="mansaba-td">
                           <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">{row.employeeName}</span>
                              <span className="text-xs text-slate-500">{row.role || 'GURU'}</span>
                           </div>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className="text-sm font-bold text-slate-800">{row.totalWorkDays} / {row.totalDays}</span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-sm font-bold ${row.totalAbsent > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                              {row.totalAbsent}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-sm font-bold ${row.totalLate > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                              {row.totalLate}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-sm font-bold ${row.totalEarly > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {row.totalEarly}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className="text-sm font-bold text-emerald-600">
                              {Math.floor(row.totalWorkDuration / 60)}j {row.totalWorkDuration % 60}m
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           {statusBadge(row)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={9} className="py-20 text-center text-sm text-slate-500">Tidak ada data rekap untuk periode ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
          </div>
      </div>
    </div>
  );
};

export default RecapPage;
