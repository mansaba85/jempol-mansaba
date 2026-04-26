import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import { 
  Calendar, 
  User, 
  Printer, 
  FileText, 
  Layers,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Edit2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const ReportsPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [reportMode, setReportMode] = useState<'summary' | 'detailed'>('detailed');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [reportData, setReportData] = useState<any[]>([]);

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ date: string, type: 'IN' | 'OUT' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/employees`);
      setEmployees(res.data);
    } catch (err) {
      toast.error('Gagal memuat daftar pegawai');
    }
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedEmployeeId || (reportMode === 'detailed' && selectedEmployeeId === 'all')) {
      setReportData([]);
      return;
    }

    setLoading(true);
    try {
      const endpoint = reportMode === 'summary' ? '/reports/monthly' : '/reports/detailed';
      const res = await axios.get(`${API_URL}${endpoint}`, {
        params: {
          employeeId: selectedEmployeeId,
          startDate,
          endDate,
          month: new Date(startDate).getMonth() + 1,
          year: new Date(startDate).getFullYear()
        }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reportMode, selectedEmployeeId, startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
        generateReport();
    }, 300);
    return () => clearTimeout(timer);
  }, [generateReport]);

  const startEdit = (dateStr: string, type: 'IN' | 'OUT', currentValue: string) => {
    setEditingCell({ date: dateStr, type });
    setEditValue(currentValue === '-' ? '' : currentValue.replace(':', '.'));
  };

  const saveManual = async (dateStr: string, type: 'IN' | 'OUT') => {
    const val = editValue.trim();
    
    // Jika tidak ada perubahan atau batal (bisa juga Esc dikembangkan)
    // Tapi kita kirim apa adanya ke server, biar server yang handle hapus vs update
    
    if (val !== "" && val !== "-" && !val.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3])[:.][0-5][0-9]$/)) {
        toast.error('Format jam salah! (Contoh: 07.30)');
        setEditingCell(null);
        return;
    }

    try {
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        const formattedDate = format(parsedDate, 'yyyy-MM-dd');
        
        await axios.post(`${API_URL}/attendance/manual`, {
            employeeId: selectedEmployeeId,
            date: formattedDate,
            time: val,
            type: type
        });

        if (val === "" || val === "-") {
            toast.success(`Data manual dihapus`);
        } else {
            toast.success(`Tersimpan: ${val}`);
        }
        
        setEditingCell(null);
        generateReport(); 
    } catch (err: any) {
        toast.error('Gagal memproses data');
        setEditingCell(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 h-full flex flex-col max-w-[99%] mx-auto">
      <Toaster position="top-right" />
      
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-3">
           <div className="w-1 h-6 bg-primary rounded-full"></div>
           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Laporan <span className="text-primary/40 font-semibold ml-1">Absensi</span></h2>
        </div>
        <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 shadow-sm">
           <button 
             onClick={() => setReportMode('detailed')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${reportMode === 'detailed' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <FileText size={12} /> Rincian
           </button>
           <button 
             onClick={() => setReportMode('summary')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${reportMode === 'summary' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Layers size={12} /> Ringkasan
           </button>
        </div>
      </header>

      {/* HORIZONTAL FILTER BAR */}
      <div className="card-mansaba !p-3 bg-white shadow-lg shadow-slate-100/30 border border-slate-100 mb-4 sticky top-0 z-30">
        <div className="flex flex-col xl:flex-row items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="p-2 bg-primary/5 text-primary rounded-lg">
                <Calendar size={18} />
              </div>
              <div className="flex items-center gap-2">
                <input type="date" className="input-mansaba !py-2 !px-3 text-xs font-bold min-w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <ArrowRight size={14} className="text-slate-300" />
                <input type="date" className="input-mansaba !py-2 !px-3 text-xs font-bold min-w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-2"></div>

            <div className="flex items-center gap-2 w-full md:flex-1">
              <div className="p-2 bg-primary/5 text-primary rounded-lg">
                <User size={18} />
              </div>
              <div className="relative flex-1">
                 <select className="input-mansaba w-full !py-2 !pl-4 !pr-10 appearance-none font-bold text-xs uppercase" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                    <option value="">-- Pilih Pegawai --</option>
                    {reportMode === 'summary' && <option value="all">SEMUA PEGAWAI</option>}
                    {employees.map(e => (
                       <option key={e.id} value={e.id}>{e.name} (#{e.id})</option>
                    ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto print:hidden">
            {reportData.length > 0 && (
              <button 
                onClick={() => window.print()}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 px-6 text-[10px] font-bold uppercase tracking-widest"
              >
                <Printer size={16} /> <span className="hidden md:inline">CETAK LAPORAN</span>
              </button>
            )}
            {loading && (
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest ml-4">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-premium overflow-hidden flex flex-col min-h-0">
         {/* KOP SURAT */}
         {reportData.length > 0 && (
           <div className="hidden print:block p-8 border-b-4 border-double border-slate-900 mb-6">
              <div className="flex items-center gap-8">
                 <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-4xl border-2 border-slate-200">🏯</div>
                 <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight uppercase">Laporan Absensi Harian Pegawai/Guru</h1>
                    <h2 className="text-xl font-bold text-slate-800">KANTOR KEMENTERIAN AGAMA KAB. BATANG</h2>
                    <p className="text-sm font-medium text-slate-500 italic">MA NU 01 BANYUPUTIH - SISTEM ABSENSI DIGITAL MANSABA</p>
                 </div>
              </div>
              <div className="mt-8 flex justify-between items-end border-t pt-6">
                 <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                    <span className="font-bold">No. ID</span> <span className="font-medium">: {selectedEmployeeId}</span>
                    <span className="font-bold">NIP</span> <span className="font-medium">: {employees.find(e => String(e.id) === selectedEmployeeId)?.nip || '-'}</span>
                    <span className="font-bold">Nama</span> <span className="font-bold text-slate-900">: {employees.find(e => String(e.id) === selectedEmployeeId)?.name}</span>
                    <span className="font-bold">Tempat Tugas</span> <span className="font-medium">: MA NU 01 Banyuputih</span>
                 </div>
                 <div className="text-right text-sm">
                    <p className="font-bold uppercase text-slate-400 text-[10px] tracking-widest mb-1">Periode Waktu</p>
                    <p className="font-bold text-slate-800">Dari {format(new Date(startDate), 'dd MMM')} s/d {format(new Date(endDate), 'dd MMM yyyy')}</p>
                 </div>
              </div>
           </div>
         )}

         {reportData.length > 0 ? (
           <div className="flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto no-scrollbar flex-1">
                 <table className="table-mansaba !w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-white border-b border-slate-100">
                       {reportMode === 'detailed' ? (
                         <tr>
                            <th className="table-header w-12 text-center !bg-slate-50/50">HARI</th>
                            <th className="table-header w-28 !bg-slate-50/50">TANGGAL</th>
                            <th className="table-header text-center whitespace-nowrap">JAM MASUK</th>
                            <th className="table-header text-center bg-primary/5 !text-primary whitespace-nowrap">SCAN MASUK</th>
                            <th className="table-header text-center text-rose-500 bg-rose-50/30 whitespace-nowrap">TERLAMBAT</th>
                            <th className="table-header text-center whitespace-nowrap">JAM PULANG</th>
                            <th className="table-header text-center bg-primary/5 !text-primary whitespace-nowrap">SCAN KELUAR</th>
                            <th className="table-header text-center text-emerald-500 bg-emerald-50/30 whitespace-nowrap">PLG CPT</th>
                            <th className="table-header text-center">LEMBUR</th>
                            <th className="table-header text-center font-bold">JAM KERJA</th>
                            <th className="table-header text-center !bg-slate-50/50">JML HADIR</th>
                         </tr>
                       ) : (
                         <tr>
                            <th className="table-header">PEGAWAI</th>
                            <th className="table-header text-center">HARI HADIR</th>
                            <th className="table-header text-right">TARIF TRANSPORT</th>
                            <th className="table-header text-right">TOTAL DINYATAKAN</th>
                         </tr>
                       )}
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {reportMode === 'detailed' ? (
                         reportData.map((row, idx) => (
                            <tr key={idx} className="table-row group hover:bg-slate-50/20 transition-colors">
                               <td className="table-cell text-center font-bold text-slate-400 text-[10px] tracking-widest">{row.hari}</td>
                               <td className="table-cell font-bold text-slate-600 text-xs tracking-tighter">{row.tanggal}</td>
                               <td className="table-cell text-center text-slate-400 font-bold text-xs">{row.jamMasuk || '-'}</td>
                               
                               {/* EDITABLE SCAN MASUK */}
                               <td className="table-cell text-center bg-primary/5 font-bold text-slate-800 text-xs cursor-pointer hover:bg-primary/10 transition-colors p-0">
                                  {editingCell?.date === row.tanggal && editingCell?.type === 'IN' ? (
                                    <input 
                                      autoFocus
                                      className="w-full h-full text-center bg-white border-2 border-primary outline-none py-2"
                                      value={editValue}
                                      placeholder="00.00"
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={() => saveManual(row.tanggal, 'IN')}
                                      onKeyDown={e => e.key === 'Enter' && saveManual(row.tanggal, 'IN')}
                                    />
                                  ) : (
                                    <div className="w-full h-full py-3 flex items-center justify-center gap-1" onClick={() => startEdit(row.tanggal, 'IN', row.scanMasuk)}>
                                      {row.scanMasuk || '-'}
                                      <Edit2 size={8} className="opacity-0 group-hover:opacity-30 ml-1" />
                                    </div>
                                  )}
                               </td>

                               <td className="table-cell text-center font-bold text-rose-500 text-xs">
                                 {row.terlambat && <span className="bg-rose-100/50 px-2.5 py-1 rounded-lg">{row.terlambat}</span>}
                               </td>
                               <td className="table-cell text-center text-slate-400 font-bold text-xs">{row.jamPulang || '-'}</td>

                               {/* EDITABLE SCAN KELUAR */}
                               <td className="table-cell text-center bg-primary/5 font-bold text-slate-800 text-xs cursor-pointer hover:bg-primary/10 transition-colors p-0">
                                  {editingCell?.date === row.tanggal && editingCell?.type === 'OUT' ? (
                                    <input 
                                      autoFocus
                                      className="w-full h-full text-center bg-white border-2 border-primary outline-none py-2"
                                      value={editValue}
                                      placeholder="00.00"
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={() => saveManual(row.tanggal, 'OUT')}
                                      onKeyDown={e => e.key === 'Enter' && saveManual(row.tanggal, 'OUT')}
                                    />
                                  ) : (
                                    <div className="w-full h-full py-3 flex items-center justify-center gap-1" onClick={() => startEdit(row.tanggal, 'OUT', row.scanKeluar)}>
                                      {row.scanKeluar || '-'}
                                      <Edit2 size={8} className="opacity-0 group-hover:opacity-30 ml-1" />
                                    </div>
                                  )}
                               </td>

                               <td className="table-cell text-center font-bold text-emerald-500 text-xs">
                                 {row.plgCpt && <span className="bg-emerald-100/50 px-2.5 py-1 rounded-lg">{row.plgCpt}</span>}
                               </td>
                               <td className="table-cell text-center text-slate-400 italic text-xs">{row.lembur || '-'}</td>
                               <td className="table-cell text-center font-bold text-slate-700 text-xs">{row.jamKerja || '-'}</td>
                               <td className="table-cell text-center font-bold text-primary text-xs !bg-slate-50/20">{row.jmlHadir || '-'}</td>
                            </tr>
                         ))
                       ) : (
                          reportData.map((row, idx) => (
                             <tr key={idx} className="table-row">
                                <td className="table-cell">
                                   <div className="font-bold text-slate-800 text-sm tracking-tight">{row.employeeName}</div>
                                   <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">ID: {row.employeeId} | {row.role}</div>
                                </td>
                                <td className="table-cell text-center">
                                   <span className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mx-auto font-bold text-sm">{row.totalDays}</span>
                                </td>
                                <td className="table-cell text-right">
                                   <span className="text-[10px] font-bold text-slate-300 mr-1 uppercase tracking-widest">Rp</span>
                                   <span className="text-sm font-bold text-slate-700">{row.rate.toLocaleString()}</span>
                                </td>
                                <td className="table-cell text-right">
                                   <div className="bg-emerald-50 px-5 py-2.5 rounded-xl inline-block border border-emerald-100">
                                      <span className="text-base font-bold text-emerald-700 tracking-tighter">Rp {row.totalAmount.toLocaleString()}</span>
                                   </div>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>

              {/* FOOTER SUMMARY */}
              {reportMode === 'detailed' && (
                <div className="p-6 bg-slate-50 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-6 print:hidden">
                   <div className="flex flex-wrap gap-8">
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                         <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl"><Clock size={20} /></div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Total Terlambat</p>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tighter">
                               {reportData.reduce((acc, r) => {
                                 if (!r.terlambat) return acc;
                                 const [h, m] = r.terlambat.split(':').map(Number);
                                 return acc + (h * 60 + m);
                               }, 0)} <span className="text-[10px] text-slate-400 uppercase ml-1">Menit</span>
                            </h4>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                         <div className="p-2.5 bg-primary/5 text-primary rounded-xl"><TrendingUp size={20} /></div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Hari Kehadiran</p>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tighter">
                               {reportData.filter(r => r.scanMasuk).length} <span className="text-[10px] text-slate-400 uppercase ml-1">Hari</span>
                            </h4>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 bg-emerald-500/5 px-6 py-3 rounded-2xl border border-emerald-500/10">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] leading-none">Laporan Terverifikasi Digital</p>
                        <p className="text-[8px] text-slate-400 mt-1">* Klik sel jam untuk edit | Kosongkan untuk hapus manual</p>
                      </div>
                   </div>
                </div>
              )}
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-20 gap-8 animate-in fade-in duration-1000">
              <div className="w-40 h-40 bg-slate-50 rounded-[4rem] flex items-center justify-center rotate-12 relative group hover:rotate-0 transition-all duration-700 shadow-inner border border-slate-100">
                 <span className="text-7xl group-hover:scale-110 transition-transform">📄</span>
              </div>
              <div className="text-center space-y-3">
                 <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-[0.3em]">Siap Proses Data</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-sm leading-relaxed px-6">
                    Pilih pegawai dan rentang tanggal di atas untuk menampilkan rincian absensi harian secara lengkap.
                 </p>
              </div>
           </div>
         )}
      </div>

      <style>{`
        @media print {
          @page { size: auto; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          .flex-1.bg-white, .flex-1.bg-white * { visibility: visible; }
          .flex-1.bg-white { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; overflow: visible !important; }
          .table-header { background-color: #f8fafc !important; color: #1e293b !important; border: 1px solid #e2e8f0 !important; -webkit-print-color-adjust: exact; padding: 12px 8px !important; }
          .table-cell { border: 1px solid #f1f5f9 !important; padding: 10px 8px !important; font-size: 11px !important; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          header, .card-mansaba, .print\\:hidden, .p-6.bg-slate-50 { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
