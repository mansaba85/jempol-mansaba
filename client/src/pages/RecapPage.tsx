import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  const filteredData = recapData.filter(item => 
    item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    item.employeeId.toString().includes(search)
  ).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  return (
    <div className="max-w-7xl mx-auto pb-20">
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
           <button onClick={()=>window.print()} className="w-10 h-10 bg-white/[0.02] text-blue-600 border border-blue-200 rounded-[1.5rem] flex items-center justify-center shadow-sm hover:bg-primary hover:text-slate-800 transition-colors">
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
                     <th className="mansaba-th text-center border-slate-200">FREQ_SESSIONS</th>
                     <th className="mansaba-th text-center border-slate-200 text-rose-400">LATENCY (MIN)</th>
                     <th className="mansaba-th text-center border-slate-200 text-amber-400">EARLY_EXIT (MIN)</th>
                     <th className="mansaba-th text-right px-12 border-slate-200">PERFORMANCE_TAG</th>
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
                           <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                              <span className="text-xs font-medium text-slate-800">{row.totalDays}</span>
                              <span className="text-[9px] font-medium text-slate-500">SESSIONS</span>
                           </div>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-xs  font-medium ${row.totalLate > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                              {row.totalLate > 0 ? row.totalLate : '0'}
                           </span>
                        </td>
                        <td className="mansaba-td text-center">
                           <span className={`text-xs  font-medium ${row.totalEarly > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                              {row.totalEarly > 0 ? row.totalEarly : '0'}
                           </span>
                        </td>
                        <td className="mansaba-td text-right px-12">
                           <div className="flex items-center justify-end gap-3">
                            {row.totalDays > 20 ? (
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-lg border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                  <ShieldCheck size={12} />
                                  <span className="text-[9px] font-medium">LOYAL_PROTOCOL</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500 bg-white/[0.02] px-4 py-2 rounded-lg border border-slate-200">
                                  <Clock size={12} />
                                  <span className="text-[9px] font-medium">STANDARD</span>
                                </div>
                            )}
                           </div>
                        </td>
                      </tr>
                  )) : (
                      <tr>
                        <td colSpan={6} className="py-48 text-center text-slate-500">
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

      {/* PRINT VERSION - Standard Official Format */}
      <div className="hidden print:block fixed inset-0 bg-white p-12 text-black">
          <div className="text-center mb-10 border-b-4 border-black pb-8">
              <h1 className="text-lg font-medium font-medium">Rekapitulasi Kehadiran & Kedisiplinan</h1>
              <h2 className="text-lg font-medium mt-2">MAN 1 BANYUPUTIH BATANG</h2>
              <p className="text-[10px] font-medium mt-4 tracking-[0.3em] text-slate-500">PERIODE AUDIT: {format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy')}</p>
          </div>
          <table className="w-full border-collapse border-2 border-black text-[11px]">
             <thead>
                <tr className="bg-slate-100 italic">
                  <th className="border-2 border-black p-4 text-center font-medium">PIN</th>
                  <th className="border-2 border-black p-4 text-left font-medium">Nama Lengkap Personel</th>
                  <th className="border-2 border-black p-4 text-center font-medium">Total Hadir</th>
                  <th className="border-2 border-black p-4 text-center font-medium">Lambat (Menit)</th>
                  <th className="border-2 border-black p-4 text-center font-medium">Awal Pulang (Menit)</th>
                </tr>
             </thead>
             <tbody>
                {filteredData.map(row => (
                   <tr key={row.employeeId}>
                      <td className="border-2 border-black p-3 text-center">#{String(row.employeeId).padStart(4, '0')}</td>
                      <td className="border-2 border-black p-3 font-medium">{row.employeeName}</td>
                      <td className="border-2 border-black p-3 text-center font-medium">{row.totalDays} HARI</td>
                      <td className="border-2 border-black p-3 text-center">{row.totalLate}</td>
                      <td className="border-2 border-black p-3 text-center">{row.totalEarly}</td>
                   </tr>
                ))}
             </tbody>
          </table>
          <div className="flex justify-between items-start mt-24 px-16">
              <div className="text-center">
                 <p className="mb-24 font-medium">Mengetahui,<br/>Kepala Madrasah</p>
                 <p className="underline font-medium text-sm">Drs. H. MUKHLISIN, M.Pd</p>
                 <p className="text-[11px] font-medium mt-1">NIP. 196805121994031002</p>
              </div>
              <div className="text-center">
                 <p className="mb-24 font-medium">Bendahara,</p>
                 <p className="underline font-medium text-sm">NURUL HIKMAH, S.Pd</p>
                 <p className="text-[11px] font-medium mt-1">NIP. 198204152005012003</p>
              </div>
          </div>
      </div>

      <style>{`
        @media print {
          @page { size: portrait; margin: 0; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          #root > div > main { margin: 0 !important; padding: 0 !important; }
          div:not(.print\:block), header, nav, aside, footer { display: none !important; }
          .print\:block { display: block !important; position: static !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 2px solid black !important; }
        }
      `}</style>
    </div>
  );
};

export default RecapPage;
