import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  LogOut, 
  LogIn,
  CalendarDays,
  UserCheck,
  ChevronRight, 
  ChevronLeft,
  RefreshCcw,
  History,
  LayoutGrid,
  Bell,
  Fingerprint
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const isHistoryView = location.pathname === '/history';

  // Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const res = await axios.get(`/api/reports/detailed?employeeId=${user.id}&startDate=${start}&endDate=${end}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + offset);
    setCurrentMonth(next);
  };

  const today = new Date();
  const todayData = data?.days?.find((d: any) => isSameDay(new Date(d.date), today));

  const formatLogTime = (timeStr: any) => {
    if (!timeStr) return '--:--';
    return format(new Date(timeStr), 'HH:mm');
  };

  const performancePercent = data?.summary?.totalDaysInPeriod > 0 
    ? Math.round((data.summary.totalDays / data.summary.totalDaysInPeriod) * 100) 
    : 0;

  if (isHistoryView) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pb-24">
        {/* Header Arsip */}
        <div className="bg-emerald-500 pt-12 pb-20 px-6 rounded-b-[3rem] shadow-lg shadow-emerald-500/20">
           <div className="flex items-center gap-4 mb-6">
              <button onClick={() => navigate('/')} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                 <ChevronLeft />
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Riwayat Presensi</h1>
           </div>
           
           <div className="flex items-center justify-between bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl"><ChevronLeft size={20}/></button>
              <span className="text-sm font-bold text-white uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl"><ChevronRight size={20}/></button>
           </div>
        </div>

        <div className="px-4 -mt-10 space-y-4">
           {loading ? (
             <div className="flex justify-center py-20">
                <RefreshCcw className="animate-spin text-emerald-500" size={32} />
             </div>
           ) : data?.days?.length > 0 ? (
             data.days.map((d: any, idx: number) => (
               <div key={idx} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 ${isSameDay(new Date(d.date), today) ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                  {/* Compact Card Header */}
                  <div className="flex items-center justify-between mb-2.5 border-b border-slate-50 pb-2">
                     <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center ${d.status === 'LIBUR' ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                           <span className="text-[7px] font-black uppercase leading-none">{format(new Date(d.date), 'EEE', { locale: id })}</span>
                           <span className="text-sm font-black leading-none mt-0.5">{format(new Date(d.date), 'dd')}</span>
                        </div>
                        <div>
                           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(d.date), 'MMMM yyyy', { locale: id })}</h4>
                           {d.status === 'LIBUR' && <span className="text-[7px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded-full uppercase mt-0.5 inline-block">Libur</span>}
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block leading-none mb-0.5">Honor Transport</span>
                        <span className="text-xs font-black text-emerald-600 tabular-nums leading-none">
                           {d.ttpValue > 0 ? `+Rp${new Intl.NumberFormat('id-ID').format(d.ttpValue)}` : 'Rp 0'}
                        </span>
                     </div>
                  </div>

                  {/* Compact Attendance Details */}
                  <div className="grid grid-cols-2 gap-4 relative">
                     <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-50/50 -translate-x-1/2"></div>
                     
                     <div className="space-y-1">
                        <div className="flex items-center gap-1">
                           <LogIn size={9} className="text-blue-500" />
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Masuk</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-slate-700 tabular-nums">{formatLogTime(d.logs?.in)}</span>
                           <span className={`text-[7px] font-bold px-1 py-0.5 rounded-md ${d.lateMinutes > 0 ? 'bg-rose-50 text-rose-500' : d.logs?.in ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                              {d.lateMinutes > 0 ? `Telat ${d.lateMinutes}m` : d.logs?.in ? 'Tepat' : 'Tap'}
                           </span>
                        </div>
                     </div>

                     <div className="space-y-1 text-right flex flex-col items-end">
                        <div className="flex items-center gap-1">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Pulang</p>
                           <LogOut size={9} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[7px] font-bold px-1 py-0.5 rounded-md ${d.earlyMinutes > 0 ? 'bg-amber-50 text-amber-500' : d.logs?.out ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                              {d.earlyMinutes > 0 ? `Dini ${d.earlyMinutes}m` : d.logs?.out ? 'Tepat' : 'Tap'}
                           </span>
                           <span className="text-sm font-black text-slate-700 tabular-nums">{formatLogTime(d.logs?.out)}</span>
                        </div>
                     </div>
                  </div>
               </div>
             ))
           ) : (
             <div className="text-center py-20 text-slate-400 font-medium italic">Tidak ada data</div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-outfit pb-24">
      {/* ULTRA COMPACT EMERALD HEADER */}
      <div className="bg-[#2ecc71] pt-6 pb-20 px-6 relative overflow-hidden rounded-b-[3.5rem] shadow-lg">
        {/* Abstract Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-10 opacity-10">
           <div className="w-32 h-32 rounded-full border-8 border-white"></div>
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-2 mb-6">
           <Fingerprint size={24} className="text-white opacity-90" />
           <span className="text-white font-black text-sm tracking-widest uppercase">Jariku Mansaba</span>
        </div>

        {/* User Greeting & Clock Area */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center">
             <p className="text-white/80 text-[11px] font-bold">Selamat Datang,</p>
             <h1 className="text-2xl font-black text-white mt-0.5 tracking-tight">{user?.username || 'Pegawai'}</h1>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
             <div className="flex items-center gap-3">
                <Bell size={18} className="text-white opacity-80" />
                <h2 className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">
                   {format(currentTime, 'HH:mm:ss')}
                </h2>
             </div>
             <p className="mt-1 text-white/80 text-[10px] font-bold">
                {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
             </p>
          </div>
        </div>
      </div>

      {/* COMPACT SCHEDULE CARD */}
      <div className="px-5 -mt-12 relative z-20">
         <div className="bg-white rounded-[2rem] p-4 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Clock size={22} />
               </div>
               <div>
                  <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mb-0.5">Jadwal Hari Ini</h4>
                  <p className="text-xl font-black text-slate-800 tracking-tight">
                     {todayData?.timetable ? `${todayData.timetable.jamMasuk} - ${todayData.timetable.jamPulang}` : 'OFF'}
                  </p>
               </div>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-200">
               <span className="text-[10px] font-black uppercase tracking-tight">
                  {todayData?.timetable?.name?.includes('-') ? todayData.timetable.name : 'SENIN - KAMIS'}
               </span>
            </div>
         </div>
      </div>

      {/* REFINED STATS GRID */}
      <div className="px-5 mt-6 space-y-4">
         <div className="grid grid-cols-2 gap-3">
            {/* SCAN MASUK */}
            <div className="bg-gradient-to-br from-[#54a0ff] to-[#2e86de] p-4 rounded-[1.5rem] text-white shadow-md relative overflow-hidden group">
               <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <LogIn size={18} strokeWidth={2.5} />
               </div>
               <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Scan Masuk</h4>
               <h3 className="text-2xl font-black tabular-nums tracking-tight">{formatLogTime(todayData?.logs?.in)}</h3>
               <div className="mt-1.5 text-[8px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-md inline-block">
                  {todayData?.lateMinutes > 0 ? `Telat ${todayData.lateMinutes}m` : todayData?.logs?.in ? 'Tepat Waktu' : 'Belum Tap'}
               </div>
            </div>

            {/* SCAN PULANG */}
            <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] p-4 rounded-[1.5rem] text-white shadow-md relative overflow-hidden group">
               <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <LogOut size={18} strokeWidth={2.5} />
               </div>
               <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Scan Pulang</h4>
               <h3 className="text-2xl font-black tabular-nums tracking-tight">{formatLogTime(todayData?.logs?.out)}</h3>
               <div className="mt-1.5 text-[8px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-md inline-block">
                  {todayData?.earlyMinutes > 0 ? `Dini ${todayData.earlyMinutes}m` : todayData?.logs?.out ? 'Sudah Pulang' : 'Belum Pulang'}
               </div>
            </div>

            {/* HARI AKTIF */}
            <div className="bg-gradient-to-br from-[#54a0ff] to-[#2e86de] p-4 rounded-[1.5rem] text-white shadow-md relative overflow-hidden">
               <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <CalendarDays size={18} strokeWidth={2.5} />
               </div>
               <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Hari Aktif</h4>
               <div className="flex items-baseline gap-1.5">
                  <h3 className="text-2xl font-black tabular-nums tracking-tight">{data?.summary?.totalDaysInPeriod || 0}</h3>
                  <span className="text-[10px] font-bold uppercase opacity-60">Hari</span>
               </div>
            </div>

            {/* JUMLAH HADIR */}
            <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] p-4 rounded-[1.5rem] text-white shadow-md relative overflow-hidden">
               <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <UserCheck size={18} strokeWidth={2.5} />
               </div>
               <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Hadir</h4>
               <div className="flex items-baseline gap-1.5">
                  <h3 className="text-2xl font-black tabular-nums tracking-tight">{data?.summary?.totalDays || 0}</h3>
                  <span className="text-[10px] font-bold uppercase opacity-60">Hari</span>
               </div>
            </div>
         </div>

         {/* HONOR BANNER - SLIMMER */}
         <div className="bg-white p-1 rounded-[1.8rem] shadow-lg border border-slate-50">
            <div className="bg-gradient-to-r from-[#2ecc71] to-[#27ae60] p-5 rounded-[1.6rem] text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-full bg-white/5 -skew-x-12 translate-x-8"></div>
               <div className="relative z-10">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Performa</h4>
                  <h3 className="text-3xl font-black tracking-tighter">{performancePercent}%</h3>
               </div>
               <div className="relative z-10 text-right pl-4 border-l border-white/20">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Est. Honor</h4>
                  <h3 className="text-xl font-black tabular-nums tracking-tight">Rp {new Intl.NumberFormat('id-ID').format(data?.summary?.netto || 0)}</h3>
                  <p className="text-[7px] font-bold opacity-70 mt-1 uppercase tracking-tighter">Netto After Voucher</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
