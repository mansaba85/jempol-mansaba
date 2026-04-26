import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';

const AttendancePage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setStartDateInput] = useState('');
  
  // Real dates for backend
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/logs', {
        params: { search, startDate: queryStart, endDate: queryEnd }
      });
      setLogs(res.data.logs || []);
    } catch (err) { 
      console.error("Gagal memuat log presensi:", err);
      toast.error("Gagal memuat data log presensi.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [queryStart, queryEnd]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Log Presensi</h2>
           <p className="text-sm text-slate-500 mt-1">Daftar riwayat scan kehadiran seluruh pegawai secara real-time.</p>
        </div>
      </header>

      <div className="mansaba-card">
        <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              className="mansaba-input w-full pl-10"
              placeholder="Cari nama pegawai..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="date"
              className="mansaba-input"
              value={queryStart}
              onChange={e => setQueryStart(e.target.value)}
            />
            <span className="text-slate-400 font-medium">s/d</span>
            <input 
              type="date"
              className="mansaba-input"
              value={queryEnd}
              onChange={e => setQueryEnd(e.target.value)}
            />
          </div>
          
          <button type="submit" className="mansaba-btn-primary px-6" disabled={loading}>
            <i className="fa-solid fa-filter mr-2"></i> Filter
          </button>
        </form>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="mansaba-table">
            <thead>
              <tr>
                <th className="w-48">Waktu Scan</th>
                <th>Nama Pegawai</th>
                <th className="text-center">Tipe</th>
                <th>Perangkat</th>
                <th className="text-right">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 text-sm">Memuat data log presensi...</td>
                </tr>
              ) : logs.length > 0 ? logs.map(log => {
                const empName = log.employee?.name || 'Tidak Diketahui';
                const initial = empName.charAt(0).toUpperCase();
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{format(new Date(log.timestamp), 'dd MMM yyyy')}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-blue-600">
                          <i className="fa-regular fa-clock text-xs"></i>
                          <span className="text-xs font-semibold">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{empName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">ID: {log.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                         log.type?.toUpperCase().includes('IN') ? 'bg-emerald-100 text-emerald-700' : 
                         log.type?.toUpperCase().includes('OUT') ? 'bg-orange-100 text-orange-700' :
                         'bg-slate-100 text-slate-700'
                       }`}>
                        <i className={`fa-solid ${
                          log.type?.toUpperCase().includes('IN') ? 'fa-arrow-right-to-bracket' : 
                          log.type?.toUpperCase().includes('OUT') ? 'fa-arrow-right-from-bracket' :
                          'fa-fingerprint'
                        }`}></i>
                        {log.type}
                       </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-server text-xs"></i>
                        <span>{log.deviceId ? `Mesin ID ${log.deviceId}` : 'Sistem Pusat'}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      {log.isManual ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                           <i className="fa-solid fa-pen-to-square"></i> Manual Input
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                           <i className="fa-solid fa-fingerprint"></i> Biometrik
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <i className="fa-solid fa-folder-open text-4xl mb-3"></i>
                      <p className="text-sm font-medium">Tidak ada log presensi yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
