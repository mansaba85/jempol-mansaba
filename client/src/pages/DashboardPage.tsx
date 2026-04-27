import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    efficiency: 0,
    recentLogs: [] as any[],
    storage: 0,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [eRes, lRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/logs`),
        axios.get(`${API_URL}/machine/storage`)
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
        recentLogs: todayLogs.slice(0, 10),
        storage: sRes.data?.percentage || 0,
      });
    } catch (err: any) {
      setError("Gagal sinkronisasi data presensi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center justify-between text-rose-700 shadow-sm animate-bounce-short">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation text-lg"></i>
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button onClick={fetchDashboardData} className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all shadow-md">Coba Lagi</button>
        </div>
      )}

      {/* HERO SECTION / WELCOME */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl p-8 md:p-10 border border-slate-800">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Admin</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
              Laporan kehadiran Guru dan Karyawan hari ini sudah disinkronisasi. Selamat bertugas!
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center gap-3 text-slate-300">
                <i className="fa-solid fa-calendar-day text-blue-400"></i>
                <span className="text-sm font-semibold">{format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}</span>
              </div>
              <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center gap-3 text-slate-300">
                <i className="fa-solid fa-clock text-indigo-400"></i>
                <span className="text-sm font-bold tracking-widest">{format(currentTime, 'HH:mm:ss')}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={fetchDashboardData}
              className="group relative px-6 py-4 bg-white text-slate-900 font-bold rounded-2xl flex items-center gap-3 overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <i className="fa-solid fa-rotate-right text-blue-600 relative z-10 group-hover:rotate-180 transition-transform duration-500"></i>
              <span className="relative z-10">Sinkronkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Pegawai"
          val={stats.totalEmployees}
          subtitle="Terdaftar di sistem"
          icon="fa-solid fa-users"
          color="blue"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          label="Telah Hadir"
          val={stats.presentToday}
          subtitle="Sudah presensi"
          icon="fa-solid fa-circle-check"
          color="emerald"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          label="Belum Hadir"
          val={stats.totalEmployees - stats.presentToday}
          subtitle="Menunggu scan"
          icon="fa-solid fa-hourglass-start"
          color="amber"
          onClick={() => navigate('/reports/absent')}
        />
        <StatCard
          label="Efisiensi"
          val={`${stats.efficiency}%`}
          subtitle="Tingkat kehadiran"
          icon="fa-solid fa-bolt-lightning"
          color="indigo"
          onClick={() => navigate('/honor')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LOG LOGS AREA */}
        <div className="lg:col-span-2 mansaba-card-no-pad overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                <i className="fa-solid fa-signal text-xs"></i>
              </div>
              Aktifitas Presensi
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">Realtime</span>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentLogs.length > 0 ? stats.recentLogs.map((log, i) => (
              <div key={i} className="group flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110 ${log.type === 'CHECK IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <i className={`fa-solid ${log.type === 'CHECK IN' ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket'}`}></i>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${log.isManual ? 'bg-indigo-500' : 'bg-blue-500'}`} title={log.isManual ? 'Input Manual' : 'Scan Mesin'}></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{log.employee?.name || `ID: ${log.employeeId}`}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-widest ${log.type === 'CHECK IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.type === 'CHECK IN' ? 'Scan Datang' : 'Scan Pulang'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">•</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{log.isManual ? 'Manual' : 'Mesin'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg tabular-nums">{format(new Date(log.timestamp), 'HH:mm')}</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 mx-auto overflow-hidden">
                    <i className="fa-solid fa-bolt-auto text-3xl text-slate-300 animate-pulse"></i>
                  </div>
                </div>
                <h5 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada aktifitas hari ini</h5>
              </div>
            )}
          </div>
        </div>

        {/* SIDE WIDGETS */}
        <div className="space-y-6">
          <div className="relative mansaba-card overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-blue-600"></i> Status Sistem
            </h4>
            <div className="space-y-4">
              <SystemStatusItem label="Database" status="Normal" color="emerald" />
              <SystemStatusItem label="Mesin Absensi" status="Terhubung" color="emerald" />
              <SystemStatusItem label="Sisa Memori Mesin" status={`${stats.storage}%`} color={stats.storage < 10 ? 'rose' : 'blue'} />
            </div>
          </div>

          <div className="mansaba-card bg-gradient-to-br from-indigo-600 to-blue-700 border-none text-white p-6 shadow-xl shadow-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg leading-tight">MANTRA<br />JARIKU MANSABA</h4>
                <p className="text-xs text-blue-100 mt-2 opacity-80 font-medium italic">"Kedisiplinan adalah kunci kesuksesan bersama."</p>
              </div>
              <i className="fa-solid fa-quote-right text-3xl opacity-20"></i>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">System v4.0.5</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-[10px] font-bold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, subtitle, icon, color, onClick }: any) => {
  const gradients: any = {
    blue: 'from-blue-600 to-blue-800 shadow-blue-100',
    amber: 'from-amber-500 to-amber-700 shadow-amber-100',
    indigo: 'from-indigo-600 to-indigo-800 shadow-indigo-100',
    emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-100'
  };

  return (
    <div
      onClick={onClick}
      className="group mansaba-card relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer active:scale-95"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-5 bg-current transition-transform group-hover:scale-150`}></div>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-br ${gradients[color]} text-white shadow-lg`}>
          <i className={icon}></i>
        </div>
        {color === 'emerald' && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start">LIVE</span>}
      </div>
      <div className="mt-5">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{val}</h4>
          <span className="text-[10px] text-slate-400 font-bold lowercase">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

const SystemStatusItem = ({ label, status, color }: any) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-semibold text-slate-600">{label}</span>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
      <span className={`text-xs font-bold text-${color}-600 uppercase tracking-wider`}>{status}</span>
    </div>
  </div>
)

export default DashboardPage;
