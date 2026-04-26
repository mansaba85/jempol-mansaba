import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const AttendancePage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/logs', {
        params: { search, startDate, endDate }
      });
      setLogs(res.data.logs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b border-slate-100">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Log Presensi Biometrik</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Aktivitas kehadiran mesin fingerprint real-time</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="relative">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
             </div>
             <input 
               type="text"
               className="input-mansaba w-full xl:w-64 pl-11 !py-2.5"
               placeholder="Cari guru/staf..."
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-3 bg-surface-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <input 
                  type="date"
                  className="bg-transparent text-[11px] font-black uppercase text-slate-600 outline-none px-3"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">s/d</span>
              <input 
                  type="date"
                  className="bg-transparent text-[11px] font-black uppercase text-slate-600 outline-none px-3"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
              />
           </div>
           <button onClick={fetchLogs} className="btn-mansaba !py-2.5">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 3H2l8 9v7l4 3v-10l8-9z" /></svg>
             Filter
           </button>
        </div>
      </header>

      <div className="table-wrapper">
        <table className="table-mansaba">
          <thead>
            <tr>
              <th className="table-header w-48 text-center">Waktu / Tanggal</th>
              <th className="table-header">Nama Pegawai</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header">Perangkat</th>
              <th className="table-header text-right">Keamanan</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="table-row group">
                <td className="table-cell text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-800 leading-none mb-1">{format(new Date(log.timestamp), 'dd MMM yyyy')}</span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                   </div>
                </td>
                <td className="table-cell">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-primary text-sm shadow-sm group-hover:scale-110 transition-transform">
                         {log.employeeName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm tracking-tight">{log.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PIN: {String(log.employeeId).padStart(4, '0')}</div>
                      </div>
                   </div>
                </td>
                <td className="table-cell text-center">
                   <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 ${log.type === 'CHECK IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-surface-100 text-slate-400'}`}>
                    {log.type}
                   </span>
                </td>
                <td className="table-cell">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.deviceName}</span>
                   </div>
                </td>
                <td className="table-cell text-right">
                   <span className="text-[10px] font-black text-emerald-500/60 bg-emerald-50/50 px-3 py-1 rounded-lg border border-emerald-50 uppercase tracking-[0.2em]">
                    SEC_VERIFIED
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {logs.length === 0 && !loading && (
          <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7" /></svg>
            <p className="text-xs font-black uppercase tracking-[0.3em]">Nihil: Belum ada data absensi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
