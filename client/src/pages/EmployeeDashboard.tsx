import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Hash,
  RefreshCcw,
  TrendingUp,
  History,
  FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isHistoryView = location.pathname === '/history';

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

  // Cari data hari ini untuk header
  const today = new Date();
  const todayData = data?.days?.find((d: any) => isSameDay(new Date(d.date), today));

  const formatLogTime = (timeStr: any) => {
    if (!timeStr) return '--:--';
    return format(new Date(timeStr), 'HH:mm');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-['Open_Sans'] text-slate-700">
      
      {/* HEADER SECTION */}
      <div className="bg-[#0f172a] text-white relative h-56 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
        
        <div className="w-full px-2 md:px-4 pt-14 relative z-10">
          <div className="flex items-center gap-5 mb-6">
             <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                {isHistoryView ? <History size={22} className="text-blue-400" /> : <TrendingUp size={22} className="text-emerald-400" />}
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight">
                   {isHistoryView ? 'Arsip Riwayat Presensi' : `Selamat Datang, ${data?.employee?.name || 'Loading...'}`}
                </h1>
                <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.15em] mt-1 opacity-80">
                   {!isHistoryView ? format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id }) : 'Pantau detail kehadiran bulanan Anda'}
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 md:px-4 -mt-16 space-y-6 relative z-20 pb-20">
        
        {!isHistoryView ? (
           <>
             {/* TODAY'S STATUS BAR */}
             <div className="space-y-4">
                {/* JAM JADWAL - Full Width */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                         <Clock size={20} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Jadwal Hari Ini</span>
                         <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none mt-0.5">
                            {todayData?.timetable ? `${todayData.timetable.jamMasuk} - ${todayData.timetable.jamPulang}` : 'LIBUR'}
                         </h3>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md">{todayData?.timetable?.name || 'TIDAK ADA JADWAL'}</span>
                   </div>
                </div>

                {/* SCAN LOGS - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={14} />
                         </div>
                         <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Scan Masuk</span>
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                            {formatLogTime(todayData?.logs?.in)}
                         </h3>
                         <div className="mt-1 text-[9px] font-bold uppercase truncate">
                            {todayData?.lateMinutes > 0 ? (
                               <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Telat {todayData.lateMinutes}m</span>
                            ) : todayData?.logs?.in ? (
                               <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Tepat Waktu</span>
                            ) : (
                               <span className="text-slate-300 italic font-medium">Belum Tap</span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                            <LogOut size={14} className="rotate-180" />
                         </div>
                         <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Scan Pulang</span>
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                            {formatLogTime(todayData?.logs?.out)}
                         </h3>
                         <div className="mt-1 text-[9px] font-bold uppercase truncate">
                            {todayData?.earlyMinutes > 0 ? (
                               <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Dini {todayData.earlyMinutes}m</span>
                            ) : todayData?.logs?.out ? (
                               <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Sudah Pulang</span>
                            ) : (
                               <span className="text-slate-300 italic font-medium">Belum Tap</span>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* STATS SUMMARY */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-1">
                   <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hari Aktif</h4>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-800">{data?.summary?.totalDaysInPeriod || 0}</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">Hari</span>
                   </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-1">
                   <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Hadir</h4>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-emerald-600">{data?.summary?.totalDays || 0}</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">Hadir</span>
                   </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                   <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Performa Kehadiran</h4>
                   <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                         {data?.summary?.totalDaysInPeriod > 0 
                           ? Math.round((data.summary.totalDays / data.summary.totalDaysInPeriod) * 100) 
                           : 0}%
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">Persentase</span>
                   </div>
                </div>
             </div>
             
             {/* HONOR RECAP */}
             <div className="bg-[#0f172a] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-5 mb-5 md:mb-0">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <FileText size={28} className="text-emerald-400" />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-white leading-tight">Akumulasi Honor Transport</h3>
                      <p className="text-emerald-400/70 text-[11px] font-medium uppercase tracking-widest mt-1">Estimasi bulan {format(currentMonth, 'MMMM', { locale: id })}</p>
                   </div>
                </div>
                <div className="text-center md:text-right">
                   <div className="flex flex-col items-end">
                      <span className="text-3xl font-bold text-emerald-400 tabular-nums">Rp {new Intl.NumberFormat('id-ID').format(data?.summary?.netto || 0)}</span>
                      {data?.summary?.voucherNominal > 0 && (
                         <span className="text-[10px] text-white/40 font-medium">Sudah potong voucher Rp{new Intl.NumberFormat('id-ID').format(data.summary.voucherNominal)}</span>
                      )}
                   </div>
                </div>
             </div>
           </>
        ) : (
           /* HISTORY VIEW */
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-7 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                       <Calendar size={22} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-800 tracking-tight">Detail Presensi Bulanan</h3>
                       <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Filter riwayat per bulan</p>
                       <div className="md:hidden flex items-center gap-1.5 mt-2 text-rose-600 animate-pulse">
                          <ChevronRight size={10} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Geser ke kanan untuk detail</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
                    <button onClick={() => changeMonth(-1)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"><ChevronLeft size={18}/></button>
                    <span className="px-5 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
                    <button onClick={() => changeMonth(1)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"><ChevronRight size={18}/></button>
                 </div>
              </div>

              <div className="overflow-x-auto scrollbar-hide">
                 <table className="border-collapse table-auto w-px min-w-0">
                    <thead>
                       <tr className="bg-slate-50/50">
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Hari / Tanggal</th>
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Scan In</th>
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status In</th>
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Scan Out</th>
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status Out</th>
                          <th className="px-1 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Jml TTP</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr>
                             <td colSpan={6} className="px-8 py-20 text-center">
                                <RefreshCcw size={28} className="animate-spin text-slate-200 mx-auto" />
                             </td>
                          </tr>
                       ) : data?.days?.length > 0 ? (
                          data.days.map((d: any, idx: number) => (
                             <tr key={idx} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-100/50 ${isSameDay(new Date(d.date), today) ? 'bg-blue-50/40' : ''}`}>
                                <td className="px-1 py-3 whitespace-nowrap">
                                   <div className="flex flex-col">
                                      <span className="font-bold text-slate-700 text-[11px]">{format(new Date(d.date), 'EEEE', { locale: id })}</span>
                                      <span className="text-[8px] font-medium text-slate-400 mt-0.5">{format(new Date(d.date), 'dd MMM yyyy')}</span>
                                    </div>
                                </td>
                                <td className="px-1 py-3 font-semibold text-slate-700 text-[11px] tabular-nums whitespace-nowrap">{formatLogTime(d.logs?.in)}</td>
                                <td className="px-1 py-3 whitespace-nowrap">
                                   {d.status === 'LIBUR' ? (
                                      <span className="text-slate-300 font-medium italic text-[8px] uppercase tracking-wider">LIBUR</span>
                                   ) : d.lateMinutes > 0 ? (
                                      <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-rose-100">Telat {d.lateMinutes}m</span>
                                   ) : d.logs?.in ? (
                                      <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-emerald-100">Tepat</span>
                                   ) : <span className="text-slate-300 text-[9px]">--</span>}
                                </td>
                                <td className="px-1 py-3 font-semibold text-slate-700 text-[11px] tabular-nums whitespace-nowrap">{formatLogTime(d.logs?.out)}</td>
                                <td className="px-1 py-3 whitespace-nowrap">
                                   {d.status === 'LIBUR' ? (
                                      <span className="text-slate-300 font-medium italic text-[8px] uppercase tracking-wider">LIBUR</span>
                                   ) : d.earlyMinutes > 0 ? (
                                      <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-amber-100">Dini {d.earlyMinutes}m</span>
                                   ) : d.logs?.out ? (
                                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-blue-100">OK</span>
                                   ) : <span className="text-slate-300 text-[9px]">--</span>}
                                </td>
                                <td className="px-1 py-3 font-bold text-slate-700 text-[11px] tabular-nums italic whitespace-nowrap">
                                   {d.ttpValue > 0 ? `Rp${new Intl.NumberFormat('id-ID').format(d.ttpValue)}` : '-'}
                                </td>
                             </tr>
                          ))
                       ) : (
                          <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">Tidak ada data untuk periode ini</td></tr>
                       )}
                    </tbody>
                    {!loading && data?.summary && (
                       <tfoot className="bg-[#0f172a] text-white border-t border-white/5">
                          {data.summary.voucherNominal > 0 && (
                             <tr className="border-b border-white/5">
                                <td colSpan={5} className="px-8 py-3 font-semibold text-[10px] tracking-widest uppercase text-right opacity-60 italic">Potongan Voucher :</td>
                                <td className="px-8 py-3 text-right font-bold text-base text-rose-400 tabular-nums">
                                   - Rp {new Intl.NumberFormat('id-ID').format(data.summary.voucherNominal)}
                                </td>
                             </tr>
                          )}
                          <tr>
                             <td colSpan={5} className="px-8 py-6 font-semibold text-xs tracking-widest uppercase text-right opacity-80">Total Terima Bersih :</td>
                             <td className="px-8 py-6 text-right font-bold text-xl text-emerald-400 tabular-nums italic">
                                Rp {new Intl.NumberFormat('id-ID').format(data.summary.netto)}
                             </td>
                          </tr>
                       </tfoot>
                    )}
                 </table>
              </div>
           </div>
        )}

        <div className="text-center pt-8 opacity-20">
           <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">Jariku Mansaba Digital Ecosystem • v4.0</p>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
