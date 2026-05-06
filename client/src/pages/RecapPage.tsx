import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { 
  BarChart2, 
  Users, 
  Calendar, 
  Printer, 
  Search, 
  Activity, 
  TrendingUp, 
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';

const API_URL = '/api';

const RecapPage = () => {
  const [loading, setLoading] = useState(false);
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
        toast.error('Failure to retrieve monthly audit data');
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

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const periode = `${monthNames[selectedMonth-1].toUpperCase()} ${selectedYear}`;

    // Ambil data dari settings
    const namaKepala = settings.headmaster_name || "...........................";
    const nipKepala = settings.headmaster_nip || "...........................";
    const namaBendahara = settings.treasurer_name || "...........................";
    const nipBendahara = settings.treasurer_nip || "...........................";

    const html = `
      <html>
        <head>
          <title>Laporan_Rekap_Presensi_${periode}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,800;1,400&display=swap');
            body { 
              font-family: 'Open Sans', sans-serif; 
              padding: 40px; 
              color: #1a1a1a;
              line-height: 1.5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px double #000; 
              padding-bottom: 20px;
            }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; }
            .header h2 { margin: 5px 0; font-size: 16px; font-weight: 600; }
            .header p { margin: 0; font-size: 12px; color: #666; }
            
            .info-table { width: 100%; margin-bottom: 20px; font-size: 12px; font-weight: 600; }
            
            table.main-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 11px;
            }
            table.main-table th { 
              background: #f8fafc; 
              border: 1px solid #000; 
              padding: 12px 8px; 
              text-align: center;
              font-weight: 800;
              text-transform: uppercase;
            }
            table.main-table td { 
              border: 1px solid #000; 
              padding: 10px 8px; 
              text-align: center;
            }
            .text-left { text-align: left !important; }
            .font-bold { font-weight: 800; }
            .bg-gray { background: #f1f5f9; }
            
            .footer { 
              margin-top: 50px; 
              display: flex; 
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .signature { text-align: center; width: 250px; }
            .signature p { margin: 0; font-size: 12px; }
            .signature .name { margin-top: 80px; font-weight: 800; text-decoration: underline; font-size: 13px; }
            
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rekapitulasi Kehadiran & Kedisiplinan Pegawai</h1>
            <h2>MAN 1 BANYUPUTIH BATANG</h2>
            <p>Alamat: Jl. Raya Banyuputih, Kec. Banyuputih, Kab. Batang, Jawa Tengah</p>
          </div>

          <table class="info-table">
            <tr>
              <td style="width: 100px">PERIODE</td>
              <td>: ${periode}</td>
            </tr>
          </table>

          <table class="main-table">
            <thead>
              <tr>
                <th>PIN</th>
                <th class="text-left">NAMA LENGKAP</th>
                <th>JADWAL</th>
                <th>HADIR</th>
                <th>ALPA</th>
                <th>TELAT</th>
                <th>P. CEPAT</th>
                <th>TOTAL JAM</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  <td>#${String(row.employeeId).padStart(4, '0')}</td>
                  <td class="text-left font-bold">${row.employeeName}</td>
                  <td>${row.totalWorkDays}</td>
                  <td class="bg-gray">${row.totalDays}</td>
                  <td class="${row.totalAbsent > 0 ? 'font-bold' : ''}">${row.totalAbsent}</td>
                  <td>${row.totalLate}m</td>
                  <td>${row.totalEarly}m</td>
                  <td class="font-bold">${Math.floor(row.totalWorkDuration / 60)}j ${row.totalWorkDuration % 60}m</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="signature">
              <p>Mengetahui,</p>
              <p>Kepala Madrasah</p>
              <p class="name">${namaKepala}</p>
              <p>NIP. ${nipKepala}</p>
            </div>
            <div class="signature">
              <p>Batang, ${format(new Date(), 'dd MMMM yyyy')}</p>
              <p>Bendahara,</p>
              <p class="name">${namaBendahara}</p>
              <p>NIP. ${nipBendahara}</p>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
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

  return (
    <div className="max-w-7xl mx-auto pb-20" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <Toaster 
        toastOptions={{
          style: {
            background: '#0a0a0f',
            color: '#fff',
            border: '1px solid rgba(168,85,247,0.2)',
            fontSize: '11px',
            textTransform: '',
            fontWeight: 'bold'
          }
        }} 
      />
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 pb-12 border-b border-slate-200">
        <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <BarChart2 size={32} />
            </div>
            <div>
                <h2 className="text-lg font-medium font-semibold font-medium text-slate-800">ANALYTIC <span className="text-blue-600 italic">AUDIT</span></h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-medium text-slate-500 tracking-[0.4em]">Global Recapitalization Matrix</span>
                  <div className="h-0.5 w-12 bg-blue-50"></div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <select className="bg-transparent border-none text-[10px] font-medium text-slate-500 px-6 py-2 outline-none cursor-pointer hover:text-slate-800 transition-colors" value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))}>
                 {Array.from({length:12}, (_,i)=><option key={i+1} value={i+1} className="bg-white text-slate-800">{format(new Date(2022,i,1),'MMMM')}</option>)}
              </select>
              <div className="w-px h-6 bg-white/10 self-center"></div>
              <select className="bg-transparent border-none text-[10px] font-medium text-slate-500 px-6 py-2 outline-none cursor-pointer hover:text-slate-800 transition-colors" value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))}>
                 {[2024,2025,2026].map(y=><option key={y} value={y} className="bg-white text-slate-800">{y}</option>)}
              </select>
           </div>
           <button onClick={handlePrint} className="w-10 h-10 bg-white/[0.02] text-blue-600 border border-blue-200 rounded-[1.5rem] flex items-center justify-center shadow-sm hover:bg-primary hover:text-slate-800 transition-colors">
              <Printer size={24} className="transition-transform" />
           </button>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
         <div className="mansaba-card !p-10 flex items-center gap-8 border-l-4 border-l-primary shadow-[0_15px_50px_rgba(168,85,247,0.1)]">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-lg font-medium shadow-sm">
               <Users size={28} />
            </div>
            <div>
               <p className="text-[10px] font-medium text-slate-500 tracking-[0.4em] mb-3 leading-none flex items-center gap-2">
                 <Activity size={12} className="text-blue-600" /> PERSONNEL_COUNT
               </p>
               <h4 className="text-lg font-medium font-semibold font-medium text-slate-800 leading-none">{recapData.length} <span className="text-xs font-medium text-slate-500 ml-2">NODES</span></h4>
            </div>
         </div>
         <div className="mansaba-card !p-10 flex items-center gap-8 border-l-4 border-l-emerald-500 shadow-[0_15px_50px_rgba(16,185,129,0.1)]">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-medium shadow-sm">
               <Calendar size={28} />
            </div>
            <div>
               <p className="text-[10px] font-medium text-slate-500 tracking-[0.4em] mb-3 leading-none">ACCUMULATED_SESSIONS</p>
               <h4 className="text-lg font-medium font-semibold font-medium text-slate-800 leading-none">
                  {recapData.reduce((acc, curr) => acc + curr.totalDays, 0).toLocaleString()} <span className="text-xs font-medium text-slate-500 ml-2">EVENTS</span>
               </h4>
            </div>
         </div>
      </div>

      {/* RECAP TABLE PORTAL */}
      <div className="mansaba-card !p-0 overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-10 py-8 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
            <div className="relative w-full max-w-md">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 -focus-within:text-blue-600 transition-colors" size={18} />
               <input className="mansaba-input !pl-16 !bg-white !py-4" placeholder="FILTER_PERSONNEL_NAME..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-4 px-8 py-3.5 bg-white rounded-lg border border-slate-200">
               <TrendingUp size={14} className="text-blue-600" />
               <span className="text-[10px] font-medium text-slate-500 tracking-[0.3em]">{loading ? 'SYNCING_LOG_STREAM...' : filteredData.length + '_RECORDS_DETECTED'}</span>
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="mansaba-table">
               <thead>
                  <tr>
                     <th className="mansaba-th text-center w-32 border-slate-200">UNIT_ID</th>
                     <th className="mansaba-th px-10 border-slate-200">PERSONNEL_CORE</th>
                     <th className="mansaba-th text-center border-slate-200">JADWAL/HADIR</th>
                     <th className="mansaba-th text-center border-slate-200 text-rose-400">ALPA</th>
                     <th className="mansaba-th text-center border-slate-200 text-rose-500">TELAT (MIN)</th>
                     <th className="mansaba-th text-center border-slate-200 text-amber-500">P. CEPAT (MIN)</th>
                     <th className="mansaba-th text-center border-slate-200 text-emerald-600">TOTAL JAM</th>
                     <th className="mansaba-th text-right px-12 border-slate-200">STATUS</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-40 text-center text-[10px] font-medium text-slate-500 tracking-[1em]">STREAMING DATA...</td>
                    </tr>
                  ) : filteredData.length > 0 ? filteredData.map((row) => (
                      <tr key={row.employeeId} className="tr-hover">
                        <td className="mansaba-td text-center">
                           <span className="font-medium text-blue-600 text-xs transition-colors">#{String(row.employeeId).padStart(5, '0')}</span>
                        </td>
                        <td className="mansaba-td px-10 py-6">
                           <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800 mb-1.5">{row.employeeName}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-50 transition-colors"></div>
                                <span className="text-[9px] font-medium text-slate-500 tracking-[0.2em]">{row.role || 'STANDARD_OPERATIVE'}</span>
                              </div>
                           </div>
                        </td>
                        <td className="mansaba-td text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-800">{row.totalWorkDays} / {row.totalDays}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">Hari Kerja</span>
                           </div>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-xs font-black ${row.totalAbsent > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                              {row.totalAbsent}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-xs font-bold ${row.totalLate > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                              {row.totalLate}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-xs font-bold ${row.totalEarly > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {row.totalEarly}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-xs font-black text-emerald-600">
                                 {Math.floor(row.totalWorkDuration / 60)}j {row.totalWorkDuration % 60}m
                              </span>
                              <span className="text-[8px] text-emerald-400 uppercase font-black tracking-tighter">Efektif</span>
                           </div>
                        </td>
                        <td className="mansaba-td text-right px-12">
                           <div className="flex items-center justify-end gap-3">
                            {row.totalAbsent === 0 && row.totalLate === 0 ? (
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                  <ShieldCheck size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">EXCELLENT</span>
                                </div>
                            ) : row.totalAbsent > 3 ? (
                                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
                                  <Activity size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">CRITICAL</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                                  <Clock size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">STABLE</span>
                                </div>
                            )}
                           </div>
                        </td>
                      </tr>
                  )) : (
                      <tr>
                        <td colSpan={8} className="py-48 text-center text-slate-500">
                           <div className="flex flex-col items-center gap-8 opacity-5">
                              <FileText size={80} />
                              <p className="text-[12px] font-medium tracking-[0.6em]">NO_RECORDS_INDEXED</p>
                           </div>
                        </td>
                      </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <style>{`
        @media print {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default RecapPage;
