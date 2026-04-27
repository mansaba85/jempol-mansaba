import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const ReportsPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportMode, setReportMode] = useState<'summary' | 'detailed'>('detailed');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchEmp, setSearchEmp] = useState('');
  const [showEmpList, setShowEmpList] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});

  const [editingCell, setEditingCell] = useState<{ date: string, type: 'IN' | 'OUT' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/settings`)
      ]);
      setEmployees(eRes.data);
      const cMap: any = {};
      cRes.data.forEach((s: any) => cMap[s.key] = s.value);
      setConfig(cMap);
    } catch (err) {
      toast.error('Gagal memuat data pegawai');
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
          year: new Date(startDate).getFullYear(),
          _t: Date.now()
        }
      });
      setReportData(res.data);
    } catch (err) {
      toast.error("Gagal menyusun laporan");
    } finally {
      setLoading(false);
    }
  }, [reportMode, selectedEmployeeId, startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => { generateReport(); }, 300);
    return () => clearTimeout(timer);
  }, [generateReport]);

  const startEdit = (dateStr: string, type: 'IN' | 'OUT', currentValue: string) => {
    setEditingCell({ date: dateStr, type });
    setEditValue(currentValue === '-' ? '' : currentValue.replace(':', '.'));
  };

  const saveManual = async (dateStr: string, type: 'IN' | 'OUT') => {
    const val = editValue.trim();
    setEditingCell(null);

    // Jika kosong, hapus data presensi manual yang ada
    if (val === "" || val === "-") {
      try {
          const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
          const formattedDate = format(parsedDate, 'yyyy-MM-dd');
          await axios.delete(`${API_URL}/attendance/manual`, {
              params: { employeeId: selectedEmployeeId, date: formattedDate, type }
          });
          toast.success("Presensi berhasil dikosongkan");
          generateReport(); 
      } catch (err) {
          toast.error('Gagal mengosongkan presensi');
      }
      return; 
    }

    if (!val.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3])[:.][0-5][0-9]$/)) {
        toast.error('Format waktu tidak valid (Contoh yang benar: 07.30)');
        return;
    }

    try {
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        const formattedDate = format(parsedDate, 'yyyy-MM-dd');
        
        let safeTime = val.replace('.', ':');
        if (safeTime.length === 4) safeTime = '0' + safeTime; 

        await axios.post(`${API_URL}/attendance/manual`, {
            employeeId: selectedEmployeeId,
            date: formattedDate,
            time: safeTime,
            type: type
        });
        toast.success("Input manual berhasil disimpan");
        generateReport(); 
    } catch (err: any) {
        toast.error('Gagal menyimpan presensi manual');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Toaster />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Laporan Presensi</h2>
           <p className="text-sm text-slate-500 mt-1">Lihat, cetak, dan kelola laporan detail per individu maupun rekap global institusi.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setReportMode('detailed')} 
             className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${reportMode === 'detailed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Laporan Detail (Per Pegawai)
           </button>
           <button 
             onClick={() => setReportMode('summary')} 
             className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${reportMode === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Laporan Bulanan Global
           </button>
        </div>
      </header>

      <div className="mansaba-card p-4 flex flex-col md:flex-row items-center gap-4 sticky top-4 z-40 bg-white/80 backdrop-blur-md">
         {/* Filter Rentang Tanggal */}
         <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 w-full md:w-auto bg-white">
            <i className="fa-regular fa-calendar text-slate-400"></i>
            <input type="date" className="bg-transparent text-sm font-medium text-slate-800 outline-none w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-300">|</span>
            <input type="date" className="bg-transparent text-sm font-medium text-slate-800 outline-none w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
         </div>

         {/* Filter Pegawai */}
         <div className="relative flex-1 w-full max-w-sm">
            <div className="border border-slate-200 bg-white px-4 py-2 rounded-lg flex items-center gap-3 cursor-text focus-within:border-blue-400 transition-colors">
               <i className="fa-solid fa-user-magnifying-glass text-slate-400"></i>
               <input 
                 className="bg-transparent text-sm font-medium text-slate-800 w-full outline-none placeholder-slate-400" 
                 placeholder={employees.find(e => String(e.id) === selectedEmployeeId)?.name || "Ketik nama pegawai..."}
                 value={searchEmp} onChange={e => { setSearchEmp(e.target.value); setShowEmpList(true); }} onFocus={() => setShowEmpList(true)}
               />
               <i className="fa-solid fa-chevron-down text-slate-400 text-xs"></i>
            </div>
            {showEmpList && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 p-2 fade-in">
                 <div className="max-h-64 overflow-y-auto no-scrollbar flex flex-col py-1">
                    {reportMode === 'summary' && (
                      <button onClick={() => { setSelectedEmployeeId('all'); setShowEmpList(false); setSearchEmp(''); }} className="text-left px-4 py-3 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 mb-2 flex items-center gap-2 transition-colors">
                         <i className="fa-solid fa-users"></i> Tarik Data Semua Pegawai
                      </button>
                    )}
                    {employees.filter(e => e.name.toLowerCase().includes(searchEmp.toLowerCase())).map(e => (
                      <button key={e.id} onClick={() => { setSelectedEmployeeId(String(e.id)); setShowEmpList(false); setSearchEmp(''); }} className={`text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${String(e.id) === selectedEmployeeId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                         <span>{e.name}</span>
                         <span className="text-xs text-slate-400 font-normal">ID: {e.id}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}
            {showEmpList && <div className="fixed inset-0 z-40" onClick={() => setShowEmpList(false)}></div>}
         </div>

         {/* Aksi Tambahan */}
         <div className="flex gap-2 w-full md:w-auto justify-end">
            <button onClick={() => window.print()} disabled={reportData.length === 0} className="w-10 h-10 bg-white text-slate-600 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 tooltip" title="Cetak Laporan">
               <i className="fa-solid fa-print"></i>
            </button>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border  transition-colors ${loading ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
               {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
            </div>
         </div>
      </div>

      <div className="mansaba-card !p-0 overflow-hidden min-h-[500px]">
         {reportData.length > 0 ? (
           <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto">
                 <table className="mansaba-table">
                    <thead>
                       <tr>
                          {reportMode === 'detailed' ? (
                            <>
                               <th className="w-20 text-center">Hari</th>
                               <th>Tanggal Masuk</th>
                               <th className="text-center">Jadwal Shift</th>
                               <th className="text-center bg-emerald-50">Scan Datang</th>
                               <th className="text-center text-rose-500">Terlambat</th>
                               <th className="text-center bg-orange-50">Scan Pulang</th>
                               <th className="text-center text-orange-500">Plg Cepat</th>
                            </>
                          ) : (
                            <>
                               <th>Nama Pegawai</th>
                               <th className="text-center">Total Hari Hadir</th>
                               <th className="text-right">Estimasi Transport</th>
                            </>
                          )}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {reportMode === 'detailed' ? (
                         reportData.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="text-center">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${row.hari === 'Minggu' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {format(parse(row.tanggal, 'dd/MM/yyyy', new Date()), 'EEE')}
                                </span>
                              </td>
                              <td className="whitespace-nowrap text-sm font-semibold text-slate-800">{row.tanggal}</td>
                              <td className="text-center">
                                 {row.jamMasuk && row.jamPulang ? (
                                   <span className="text-xs font-medium text-slate-500">{row.jamMasuk} - {row.jamPulang}</span>
                                 ) : (
                                   <span className="text-xs font-medium text-slate-300">Libur / Tidak Ada Shift</span>
                                 )}
                              </td>
                              
                              <td className="p-0 bg-emerald-50/50 border-x border-slate-100" onClick={e => e.stopPropagation()}>
                                 {editingCell?.date === row.tanggal && editingCell?.type === 'IN' ? (
                                   <input autoFocus className="w-full h-[3.25rem] text-center bg-white text-emerald-700 outline-none font-bold text-sm shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] border-2 border-emerald-400" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveManual(row.tanggal, 'IN')} onKeyDown={e => { if(e.key === 'Enter'){ e.currentTarget.blur(); } }} />
                                 ) : (
                                   <div onClick={() => startEdit(row.tanggal, 'IN', row.scanMasuk)} className="group w-full h-[3.25rem] text-center font-bold text-emerald-700 cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-100">
                                      <span className={row.scanMasuk === '-' ? 'text-slate-300 font-normal' : ''}>{row.scanMasuk || '-'}</span>
                                      <i className="fa-solid fa-pen text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500"></i>
                                   </div>
                                 )}
                              </td>

                              <td className="text-center">
                                 {row.terlambat && (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold">
                                      <i className="fa-solid fa-clock-rotate-left text-[10px]"></i> {row.terlambat}
                                   </span>
                                 )}
                              </td>

                              <td className="p-0 bg-orange-50/50 border-x border-slate-100" onClick={e => e.stopPropagation()}>
                                 {editingCell?.date === row.tanggal && editingCell?.type === 'OUT' ? (
                                   <input autoFocus className="w-full h-[3.25rem] text-center bg-white text-orange-700 outline-none font-bold text-sm shadow-[inset_0_0_10px_rgba(249,115,22,0.1)] border-2 border-orange-400" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveManual(row.tanggal, 'OUT')} onKeyDown={e => { if(e.key === 'Enter'){ e.currentTarget.blur(); } }} />
                                 ) : (
                                   <div onClick={() => startEdit(row.tanggal, 'OUT', row.scanKeluar)} className="group w-full h-[3.25rem] text-center font-bold text-orange-700 cursor-pointer flex items-center justify-center gap-2 hover:bg-orange-100">
                                      <span className={row.scanKeluar === '-' ? 'text-slate-300 font-normal' : ''}>{row.scanKeluar || '-'}</span>
                                      <i className="fa-solid fa-pen text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-orange-500"></i>
                                   </div>
                                 )}
                              </td>

                              <td className="text-center">
                                 {row.plgCpt && (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs font-bold">
                                      <i className="fa-solid fa-person-running text-[10px]"></i> {row.plgCpt}
                                   </span>
                                 )}
                              </td>
                           </tr>
                         ))
                       ) : (
                         reportData.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-800">{row.employeeName}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 flex rounded">ID {row.employeeId}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="text-center">
                                 <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 text-sm">
                                   {row.totalDays} <span className="font-normal text-xs ml-1 text-slate-500">hari</span>
                                 </span>
                              </td>
                              <td className="text-right">
                                 <span className="text-sm font-bold text-emerald-600">Rp {row.totalAmount.toLocaleString()}</span>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
              
              {/* Ringkasan Bawah Detail */}
              {reportMode === 'detailed' && (
                <div className="bg-slate-50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200 mt-auto">
                   <div className="flex gap-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
                           <i className="fa-solid fa-calendar-check text-xl"></i>
                        </div>
                        <div>
                           <p className="text-xs font-semibold text-slate-500 mb-0.5">Total Kehadiran</p>
                           <h4 className="text-xl font-bold text-slate-800">{reportData.filter(r => r.scanMasuk !== '-' && r.scanMasuk).length} <span className="text-xs font-medium text-slate-400">Hari aktif</span></h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-rose-500">
                           <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                        </div>
                        <div>
                           <p className="text-xs font-semibold text-slate-500 mb-0.5">Akumulasi Telat</p>
                           <h4 className="text-xl font-bold text-rose-600">
                              {reportData.reduce((acc, r) => { if (!r.terlambat || r.terlambat === '-') return acc; const [h, m] = r.terlambat.split(':').map(Number); return acc + (h * 60 + m); }, 0)} <span className="text-xs font-medium text-rose-400">Menit</span>
                           </h4>
                        </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-300">
                 <i className="fa-solid fa-magnifying-glass text-4xl"></i>
              </div>
              <div className="text-center">
                 <h3 className="text-base font-semibold text-slate-800 mb-1">Belum Ada Data Terpilih</h3>
                 <p className="text-sm font-medium text-slate-500">Pilih rentang tanggal dan nama pegawai di atas lalu tunggu sejenak untuk memuat laporan.</p>
              </div>
           </div>
         )}
      </div>

      <style>{`
        @media print {
          title { display: none; }
          @page { size: A4; margin: 15mm; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          #root > div > main { margin: 0 !important; padding: 0 !important; }
          div:not(.print\:block), header, nav, aside, footer { display: none !important; }
          .print\:block { display: block !important; position: static !important; }
          table { width: 100% !important; border-collapse: collapse !important; margin-top: 20pt !important; }
          th { background: #f8fafc !important; color: #334155 !important; font-weight: bold !important; border: 1px solid #e2e8f0 !important; font-size: 10pt !important; padding: 8pt !important; }
          td { border: 1px solid #e2e8f0 !important; color: #1e293b !important; padding: 8pt !important; font-size: 10pt !important; }
          .mansaba-td.bg-primary\/5 { background: transparent !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
