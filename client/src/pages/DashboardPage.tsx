import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const API_URL = '/api';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    efficiency: 0,
    recentLogs: [] as any[],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [eRes, lRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/logs`)
      ]);
      const employees = Array.isArray(eRes.data) ? eRes.data : [];
      const allLogs = Array.isArray(lRes.data.logs) ? lRes.data.logs : [];
      const todayLogs = allLogs.filter((l: any) => format(new Date(l.timestamp), 'yyyy-MM-dd') === today);
      const presentIds = new Set(todayLogs.map((l: any) => l.employeeId));
      const eff = employees.length > 0 ? Math.round((presentIds.size / employees.length) * 100) : 0;
      setStats({
        totalEmployees: employees.length,
        presentToday: presentIds.size,
        lateToday: 0,
        efficiency: eff,
        recentLogs: todayLogs.slice(0, 8),
      });
    } catch (err: any) {
      setError("Gagal sinkronisasi data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <i className="fa-solid fa-spinner fa-spin text-blue-600 text-2xl"></i>
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center justify-between text-rose-600">
          <div className="flex items-center gap-3">
             <i className="fa-solid fa-circle-exclamation"></i>
             <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={fetchDashboardData} className="px-4 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700">Coba Lagi</button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-semibold text-slate-800">
               Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
               {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
         </div>
         <button onClick={fetchDashboardData} className="mansaba-btn-primary">
            <i className="fa-solid fa-rotate-right"></i> Refresh Data
         </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Pegawai" val={stats.totalEmployees} icon="fa-solid fa-users" color="blue" />
        <StatCard label="Hadir Hari Ini" val={stats.presentToday} icon="fa-solid fa-user-check" color="emerald" />
        <StatCard label="Belum Hadir" val={stats.totalEmployees - stats.presentToday} icon="fa-solid fa-user-clock" color="amber" />
        <StatCard label="Tingkat Kehadiran" val={`${stats.efficiency}%`} icon="fa-solid fa-chart-pie" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LOG LOGS AREA */}
        <div className="lg:col-span-2 mansaba-card-no-pad">
           <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                 <i className="fa-solid fa-list-ul text-slate-400"></i> Log Presensi Terbaru
              </h3>
           </div>
           <div className="divide-y divide-slate-100">
              {stats.recentLogs.length > 0 ? stats.recentLogs.map((log, i) => (
                 <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.type === 'CHECK IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <i className={`fa-solid ${log.type === 'CHECK IN' ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket'}`}></i>
                       </div>
                       <div>
                          <h4 className="text-sm font-medium text-slate-800">{log.employee?.name || `ID: ${log.employeeId}`}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{log.type}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-medium text-slate-700">{format(new Date(log.timestamp), 'HH:mm')}</span>
                    </div>
                 </div>
              )) : (
                 <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
                       <i className="fa-solid fa-inbox text-xl"></i>
                    </div>
                    <p className="text-sm text-slate-500">Belum ada data presensi hari ini.</p>
                 </div>
              )}
           </div>
        </div>

        {/* INFO WIDGET */}
        <div className="space-y-6">
           <div className="mansaba-card bg-blue-600 border-none text-white p-6">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                 <i className="fa-solid fa-circle-info"></i> Informasi Sistem
              </h4>
              <p className="text-sm text-blue-100 mb-4 leading-relaxed">Sistem presensi berjalan normal. Sinkronisasi data dilakukan secara realtime untuk memastikan laporan akurat.</p>
              <div className="text-xs text-blue-200">
                 Versi 4.0.0
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon, color }: any) => {
  const accentColors: any = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50'
  };

  return (
    <div className="mansaba-card flex items-center gap-4">
       <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${accentColors[color]}`}>
          <i className={icon}></i>
       </div>
       <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <h4 className="text-2xl font-semibold text-slate-800 mt-1">{val}</h4>
       </div>
    </div>
  );
};

export default DashboardPage;
