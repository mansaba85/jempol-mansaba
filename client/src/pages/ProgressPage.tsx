import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProgressPage = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProgress = async (y: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports/progress?year=${y}`);
      if (Array.isArray(res.data)) {
         setData(res.data);
      } else {
         setData([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProgress(year);
  }, [year]);



  // Extract unik employees
  const employees = useMemo(() => {
    if (data.length === 0) return [];
    const empMap = new Map();
    data.forEach(m => {
      m.employees.forEach((emp: any) => {
        if (!empMap.has(emp.id)) {
          empMap.set(emp.id, { id: emp.id, name: emp.name, role: emp.role, monthly: [] });
        }
      });
    });

    data.forEach(m => {
      m.employees.forEach((emp: any) => {
        const e = empMap.get(emp.id);
        e.monthly.push({ month: m.month, monthName: m.monthName, hadir: emp.hadir, telat: emp.telat, alpa: emp.alpa });
      });
    });

    return Array.from(empMap.values());
  }, [data]);

  const filteredEmployees = employees.filter((e: any) => (e.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Tren Kehadiran</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau grafik progres kehadiran dari bulan ke bulan.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
           <button onClick={() => setYear(y => y - 1)} className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"><i className="fa-solid fa-chevron-left"></i></button>
           <span className="text-lg font-black text-blue-700 w-16 text-center">{year}</span>
           <button onClick={() => setYear(y => y + 1)} className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 text-slate-500 font-medium">Sedang menyapu puluhan ribu data...</p>
        </div>
      ) : (
        <>
          {/* GLOBAL CHART */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4"><i className="fa-solid fa-chart-line text-blue-600 mr-2"></i> Kinerja Madrasah (Global)</h2>
             
             <div className="h-64 flex items-end gap-2 md:gap-4 relative pt-6">
                {/* Y Axis Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-semibold pointer-events-none pb-8">
                   <div className="border-b border-dashed border-slate-200 w-full flex-1"></div>
                   <div className="border-b border-dashed border-slate-200 w-full flex-1"></div>
                   <div className="border-b border-dashed border-slate-200 w-full flex-1"></div>
                   <div className="border-b border-dashed border-slate-200 w-full"></div>
                </div>

                {data.map((m, i) => {
                   const totalWork = m.totalHadir + m.totalAlpa;
                   const percent = totalWork > 0 ? Math.round((m.totalHadir / totalWork) * 100) : 0;
                   return (
                     <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2 z-10 group">
                        <div className="w-full relative flex justify-center h-full items-end group-hover:-translate-y-1 transition-transform">
                           <div className="w-full max-w-[40px] bg-blue-500 hover:bg-blue-400 transition-colors rounded-t-xl shadow-lg shadow-blue-500/30 relative flex justify-center" style={{ height: `${percent}%` }}>
                              {percent > 10 && <span className="text-[8px] font-bold text-white mt-2">{percent}%</span>}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg font-bold whitespace-nowrap transition-opacity">
                                 Hadir: {percent}% <br/> ({m.totalHadir} dari {totalWork} Hari)
                              </div>
                           </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{m.monthName.substring(0,3)}</span>
                     </div>
                   );
                })}
             </div>
          </div>

          {/* EMPLOYEE SEARCH */}
          <div className="relative">
             <input 
               type="text" 
               placeholder="Cari nama pegawai untuk melihat rapornya..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 shadow-sm"
             />
             <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>

          {/* EMPLOYEES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredEmployees.map(emp => {
                return (
                  <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                           {emp.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-800 line-clamp-1">{emp.name}</h3>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{emp.role}</span>
                        </div>
                     </div>

                     {/* Mini Chart */}
                     <div className="flex items-end gap-1 h-20 mb-2">
                        {emp.monthly.map((m: any, idx: number) => {
                           const isFuture = m.hadir === 0 && m.alpa === 0 && m.telat === 0;
                           const totalWork = m.hadir + m.alpa;
                           const percentHadir = totalWork > 0 && !isFuture ? Math.round((m.hadir / totalWork) * 100) : 0;
                           
                           const percentTelat = totalWork > 0 && !isFuture ? Math.round((m.telat / totalWork) * 100) : 0;
                           const percentTepat = Math.max(0, percentHadir - percentTelat);

                           return (
                             <div key={idx} className="flex-1 flex flex-col justify-end h-full gap-0.5 group relative">
                                {!isFuture && (
                                  <>
                                    <div className="w-full bg-rose-400 rounded-t-sm opacity-80" style={{ height: `${percentTelat}%` }}></div>
                                    <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${percentTepat}%` }}></div>
                                  </>
                                )}
                                {isFuture && <div className="w-full h-1 bg-slate-100 rounded-full"></div>}
                                
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[9px] py-1 px-1.5 rounded font-bold whitespace-nowrap z-20 pointer-events-none text-center">
                                  {m.monthName.substring(0,3)}: {percentHadir}% Hadir <br/> ({m.hadir}/{totalWork} Hari)
                                </div>
                             </div>
                           )
                        })}
                     </div>
                     
                     <div className="flex justify-between text-[8px] font-bold text-slate-400 px-1 uppercase">
                        <span>Jan</span>
                        <span>Des</span>
                     </div>
                  </div>
                )
             })}
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressPage;
