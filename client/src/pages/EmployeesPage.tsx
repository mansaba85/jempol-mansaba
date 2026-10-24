import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, differenceInCalendarDays, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

// ---------- Riwayat Shift (helper murni) ----------
const dayStart = (d: any) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Periode urut kronologis (data API datang urut terbaru dulu).
const sortedPeriods = (emp: any) =>
  [...(emp?.assignedPatterns || [])].sort(
    (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime() || a.id - b.id
  );

// Periode aktif = yang belum berakhir; bila ada lebih dari satu, yang startDate-nya paling akhir menang.
const activePeriod = (emp: any) => {
  const open = (emp?.assignedPatterns || []).filter((p: any) => !p.endDate);
  open.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || b.id - a.id);
  return open[0] || null;
};

const periodDays = (p: any, today: Date) =>
  differenceInCalendarDays(dayStart(p.endDate || today), dayStart(p.startDate)) + 1;

// Pola yang berlaku pada satu bulan: irisan tiap periode dengan bulan itu.
// Periode aktif dihitung s.d. hari ini (bukan s.d. akhir bulan).
const patternsInMonth = (periods: any[], monthStr: string, today: Date) => {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return [];
  const [y, m] = monthStr.split('-').map(Number);
  const mStart = startOfMonth(new Date(y, m - 1, 1));
  const mEnd = endOfMonth(new Date(y, m - 1, 1));
  const out: any[] = [];
  for (const p of periods) {
    const pStart = dayStart(p.startDate);
    const pEnd = dayStart(p.endDate || today);
    const from = pStart > mStart ? pStart : mStart;
    const to = pEnd < mEnd ? pEnd : mEnd;
    if (from <= to) {
      out.push({ period: p, from, to, days: differenceInCalendarDays(to, from) + 1 });
    }
  }
  return out.sort((a: any, b: any) => a.from.getTime() - b.from.getTime());
};

const monthLabel = (monthStr: string) => {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return '';
  return format(new Date(`${monthStr}-02`), 'MMMM yyyy', { locale: localeId });
};

// Label bulan-bulan yang direntang satu periode, mis. "Agustus–September 2026".
const periodMonthsLabel = (p: any) => {
  const s = new Date(p.startDate);
  const e = p.endDate ? new Date(p.endDate) : new Date();
  const sLabel = format(s, 'MMMM yyyy', { locale: localeId });
  const eLabel = format(e, 'MMMM yyyy', { locale: localeId });
  if (sLabel === eLabel) return sLabel;
  return `${format(s, 'MMMM', { locale: localeId })}–${eLabel}`;
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Custom Delete Confirmation State
  const [deleteData, setDeleteData] = useState<{id: number, name: string} | null>(null);
  const [bulkDeleteActive, setBulkDeleteActive] = useState(false);

  const [form, setForm] = useState({ 
    id: '', 
    name: '', 
    nip: '', 
    role: 'GURU', 
    category: 'UMUM',
    transportRate: 0,
    pin: ''
  });

  const [rosterForm, setRosterForm] = useState({
    patternId: '',
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Panel Riwayat Shift
  const [historyEmp, setHistoryEmp] = useState<any | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [lookupMonth, setLookupMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [correctPatternId, setCorrectPatternId] = useState('');
  const [correctConfirm, setCorrectConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, patRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/patterns`)
      ]);
      setEmployees(empRes.data);
      setPatterns(patRes.data);
    } catch (err) {
      toast.error('Gagal memuat data pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ step: '', percent: 0 });

  const handleSyncEmployees = () => {
    setIsSyncing(true);
    setSyncProgress({ step: 'Memulai...', percent: 0 });
    
    const token = localStorage.getItem('mansaba_token');
    const eventSource = new EventSource(`${API_URL}/machine/sync-employees?token=${token}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSyncProgress({ step: data.step, percent: data.percent });
      
      if (data.percent === 100) {
        eventSource.close();
        setIsSyncing(false);
        toast.success('Sinkronisasi pegawai selesai!');
        fetchData();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsSyncing(false);
      toast.error('Gagal terhubung ke mesin');
    };
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.nip && e.nip.includes(search)) ||
    (e.pin && e.pin.includes(search)) ||
    (String(e.id).includes(search))
  );
  
  const toggleAll = () => {
    if (selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredEmployees.map(e => e.id));
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'id') { valA = parseInt(valA); valB = parseInt(valB); }
    else { valA = String(valA || '').toLowerCase(); valB = String(valB || '').toLowerCase(); }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const currentItemsPerPage = itemsPerPage === 'all' ? sortedEmployees.length : itemsPerPage;
  const paginated = sortedEmployees.slice((currentPage - 1) * currentItemsPerPage, currentPage * currentItemsPerPage);
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedEmployees.length / itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/employees/${editingId}`, form);
        toast.success('Data pegawai diperbarui');
      } else {
        await axios.post(`${API_URL}/employees`, form);
        toast.success('Pegawai baru didaftarkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan data pegawai');
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    try {
      await axios.post(`${API_URL}/employees/bulk-pattern`, {
        employeeIds: selectedIds,
        patternId: parseInt(rosterForm.patternId),
        startDate: rosterForm.startDate
      });
      toast.success(`${selectedIds.length} pegawai berhasil di-plot`);
      setIsBulkModalOpen(false);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error('Gagal memproses plotting massal');
    }
  };

  const openHistory = (emp: any) => {
    setHistoryEmp(emp);
    const active = activePeriod(emp);
    const periods = sortedPeriods(emp);
    setSelectedPeriodId(active ? active.id : (periods.length > 0 ? periods[periods.length - 1].id : null));
    setLookupMonth(format(new Date(), 'yyyy-MM'));
    setCorrectPatternId('');
    setCorrectConfirm(false);
  };

  const closeHistory = () => {
    setHistoryEmp(null);
    setSelectedPeriodId(null);
    setCorrectPatternId('');
    setCorrectConfirm(false);
  };

  const handleCorrectPeriod = async () => {
    if (!historyEmp || !selectedPeriodId || !correctPatternId) return;
    try {
      await axios.put(`${API_URL}/employees/${historyEmp.id}/patterns/${selectedPeriodId}`, {
        patternId: parseInt(correctPatternId)
      });
      toast.success('Periode shift berhasil dikoreksi');
      const res = await axios.get(`${API_URL}/employees`);
      setEmployees(res.data);
      const fresh = res.data.find((e: any) => e.id === historyEmp.id);
      if (fresh) setHistoryEmp(fresh);
      setCorrectPatternId('');
      setCorrectConfirm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal mengoreksi periode shift');
    }
  };

  const confirmDelete = async () => {
    if (bulkDeleteActive) {
      const loadingToast = toast.loading(`Menghapus ${selectedIds.length} pegawai...`);
      try {
        await axios.post(`${API_URL}/employees/bulk-delete`, { ids: selectedIds });
        toast.success(`${selectedIds.length} pegawai berhasil dihapus`, { id: loadingToast });
        setSelectedIds([]);
        setBulkDeleteActive(false);
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus pegawai massal', { id: loadingToast });
      }
    } else if (deleteData) {
      const loadingToast = toast.loading(`Menghapus ${deleteData.name}...`);
      try {
        await axios.delete(`${API_URL}/employees/${deleteData.id}`);
        toast.success('Pegawai berhasil dihapus', { id: loadingToast });
        setDeleteData(null);
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus pegawai', { id: loadingToast });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Data Pegawai</h2>
           <p className="text-sm text-slate-500 mt-1">Kelola data presensi, NIP, penjadwalan, dan jabatan pegawai.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           {selectedIds.length > 0 && (
             <div className="flex flex-wrap items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-full sm:w-auto">
               <span className="text-xs font-bold text-blue-700 mr-1">{selectedIds.length} terpilih</span>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => {
                     setRosterForm({patternId: '', startDate: format(new Date(), 'yyyy-MM-dd')});
                     setIsBulkModalOpen(true);
                   }}
                   className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-md transition-colors whitespace-nowrap"
                 >
                   <i className="fa-solid fa-calendar-alt mr-1"></i> Plotting
                 </button>
                 <button 
                   onClick={() => setBulkDeleteActive(true)}
                   className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md transition-colors whitespace-nowrap"
                 >
                   <i className="fa-solid fa-trash mr-1"></i> Hapus
                 </button>
               </div>
             </div>
           )}

           <div className="hidden xl:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Total Pegawai</span>
              <span className="text-base font-bold text-slate-800">{employees.length} <span className="text-[10px] font-normal text-slate-500">Orang</span></span>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
               onClick={handleSyncEmployees}
               disabled={isSyncing}
               className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-sm"
             >
               <i className={`fa-solid fa-rotate ${isSyncing ? 'fa-spin' : ''}`}></i>
               {isSyncing ? '...' : 'Sync'}
             </button>

             <button 
               onClick={() => { setEditingId(null); setForm({id: '', name:'', nip:'', role:'GURU', category: 'UMUM', transportRate:0, pin: ''}); setIsModalOpen(true); }}
               className="flex-1 sm:flex-none mansaba-btn-primary !py-2.5 shadow-lg shadow-blue-600/20"
             >
               <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Tambah</span> Pegawai
             </button>
           </div>
        </div>
      </div>

      {/* SYNC PROGRESS BAR (Hanya muncul saat sync) */}
      {isSyncing && (
        <div className="mansaba-card bg-blue-50 border-blue-100 animate-in fade-in slide-in-from-top duration-300">
           <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-blue-700">{syncProgress.step}</span>
              <span className="text-sm font-black text-blue-700">{syncProgress.percent}%</span>
           </div>
           <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${syncProgress.percent}%` }}></div>
           </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="mansaba-card flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full md:w-80">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              className="mansaba-input pl-10" 
              placeholder="Cari nama, NIP, PIN..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
         </div>
         
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Urut:</span>
                <select className="mansaba-input !py-1.5 w-full sm:w-auto text-xs" value={sortField} onChange={e => handleSort(e.target.value)}>
                   <option value="id">ID MESIN</option>
                   <option value="name">NAMA</option>
                   <option value="role">JABATAN</option>
                </select>
             </div>
             <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Limit:</span>
                <select className="mansaba-input !py-1.5 w-full sm:w-auto text-xs" value={itemsPerPage} onChange={e => {setItemsPerPage(e.target.value as any); setCurrentPage(1);}}>
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                   <option value="all">ALL</option>
                </select>
             </div>
          </div>
      </div>

      {/* DATA TABLE */}
      <div className="mansaba-card-no-pad">
         <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 text-rose-600 animate-pulse bg-rose-50/30">
            <i className="fa-solid fa-angles-right text-[10px]"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Geser tabel ke samping untuk melihat detail</span>
         </div>
         <div className="overflow-x-auto">
            <table className="mansaba-table">
            <thead>
               <tr>
               <th className="mansaba-th text-center w-12 cursor-pointer" onClick={toggleAll}>
                  <i className={`fa-solid ${selectedIds.length > 0 && selectedIds.length === filteredEmployees.length ? 'fa-check-square text-blue-600 text-base' : 'fa-square text-slate-300 text-base hover:text-slate-400'}`}></i>
               </th>
               <th className="mansaba-th text-center w-24">ID MESIN</th>
               <th className="mansaba-th">PEGAWAI</th>
               <th className="mansaba-th text-center w-32">PIN PORTAL</th>
               <th className="mansaba-th text-center">JABATAN</th>
               <th className="mansaba-th">POLA SHIFT</th>
               <th className="mansaba-th text-right">AKSI</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr>
                     <td colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2">
                           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-sm text-slate-500">Memuat data...</span>
                        </div>
                     </td>
                  </tr>
               ) : paginated.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="text-center py-10 text-slate-500">Data pegawai tidak ditemukan</td>
                  </tr>
               ) : paginated.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(emp.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="mansaba-td text-center" onClick={() => toggleSelection(emp.id)}>
                     <i className={`fa-solid ${selectedIds.includes(emp.id) ? 'fa-check-square text-blue-600 text-base' : 'fa-square text-slate-300 text-base hover:text-slate-400'} cursor-pointer`}></i>
                  </td>
                  <td className="mansaba-td text-center font-bold text-slate-700">{emp.id}</td>
                  <td className="mansaba-td">
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{emp.name}</span>
                        <span className="text-xs text-slate-500 font-medium">NIP: {emp.nip || '-'}</span>
                     </div>
                  </td>
                  <td className="mansaba-td text-center">
                     {emp.pin ? (
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-mono font-bold tracking-widest text-slate-700">{emp.pin}</span>
                           <span className="text-[9px] text-emerald-500 font-bold uppercase mt-0.5">Aktif</span>
                        </div>
                     ) : (
                        <span className="text-xs text-slate-400 italic">Belum Atur</span>
                     )}
                  </td>
                  <td className="mansaba-td text-center">
                     <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.role === 'GURU' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {emp.role}
                        </span>
                        {(() => {
                           const cat = String(emp.category || (emp.isSertifikasi ? 'SERTIFIKASI' : 'UMUM')).toUpperCase();
                           let catBg = 'bg-slate-100 text-slate-600';
                           if (cat === 'SERTIFIKASI') catBg = 'bg-blue-100 text-blue-700';
                           if (cat === 'ASN') catBg = 'bg-emerald-100 text-emerald-700 font-black';
                           return (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${catBg}`}>
                                 {cat}
                              </span>
                           );
                        })()}
                     </div>
                  </td>
                  <td className="mansaba-td">
                     {(() => {
                        const periods = emp.assignedPatterns || [];
                        const active = activePeriod(emp);
                        return (
                           <div className="flex flex-col gap-1.5 min-w-[160px]">
                              {active ? (
                                 <div className="flex flex-col p-2 rounded-lg border bg-blue-50 border-blue-200">
                                    <span className="text-xs font-semibold text-blue-700">{active.pattern.name}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-slate-400">
                                       {format(new Date(active.startDate), 'dd MMM yy')} - Aktif
                                    </span>
                                 </div>
                              ) : (
                                 <span className="text-xs text-rose-400 italic font-semibold">Belum dipasang pola</span>
                              )}
                              {periods.length > 0 && (
                                 <button
                                    onClick={() => openHistory(emp)}
                                    className="text-left text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                 >
                                    <i className="fa-solid fa-clock-rotate-left mr-1"></i> Riwayat ({periods.length} periode)
                                 </button>
                              )}
                           </div>
                        );
                     })()}
                  </td>
                  <td className="mansaba-td text-right">
                     <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                             setEditingId(emp.id);
                              setForm({
                                 id: String(emp.id),
                                 name: emp.name,
                                 nip: emp.nip || '',
                                 role: emp.role || 'GURU',
                                 category: emp.category || (emp.isSertifikasi ? 'SERTIFIKASI' : 'UMUM'),
                                 transportRate: emp.transportRate || 0,
                                 pin: emp.pin || ''
                              });
                             setIsModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                           <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                          onClick={() => setDeleteData({id: emp.id, name: emp.name})}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                           <i className="fa-solid fa-trash"></i>
                        </button>
                     </div>
                  </td>
                  </tr>
               ))}
            </tbody>
         </table>
         </div>
      </div>

      {/* PAGINATION */}
      {itemsPerPage !== 'all' && totalPages > 1 && (
         <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all"><i className="fa-solid fa-chevron-left"></i></button>
            {Array.from({ length: totalPages }).map((_, i) => (
               <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
               >
                  {i + 1}
               </button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all"><i className="fa-solid fa-chevron-right"></i></button>
         </div>
      )}

      {/* MODAL PLOTTING MASSAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8 relative">
              <button onClick={() => setIsBulkModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                 <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i className="fa-solid fa-calendar-check text-xl"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Plotting Massal</h3>
                    <p className="text-sm text-slate-500">Memasang jadwal untuk {selectedIds.length} pegawai terpilih</p>
                 </div>
              </div>

              <form onSubmit={handleBulkAssign} className="space-y-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Pilih Pola Shift Kerja</label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {patterns.length === 0 ? (
                          <div className="text-sm text-slate-500 italic py-4 text-center">Data Master Jam belum ada. Silakan atur terlebih dahulu.</div>
                       ) : patterns.map(p => (
                          <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${rosterForm.patternId === String(p.id) ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                             <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                                  checked={rosterForm.patternId === String(p.id)} 
                                  onChange={() => setRosterForm({
                                    patternId: String(p.id),
                                    startDate: p.startDate ? format(new Date(p.startDate), 'yyyy-MM-dd') : rosterForm.startDate
                                  })} 
                                />
                                <div className="flex flex-col">
                                   <span className="text-sm font-semibold">{p.name}</span>
                                   <span className="text-xs opacity-70">Siklus {p.cycleDays} Hari</span>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white rounded-md border border-slate-200/50">{p.category}</span>
                          </label>
                       ))}
                    </div>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Mulai Berlaku</p>
                       <p className="text-xs text-slate-400">Dimulai saat siklus pola hari 1</p>
                    </div>
                    <input type="date" className="mansaba-input w-40" value={rosterForm.startDate} onChange={e => setRosterForm({...rosterForm, startDate: e.target.value})} required />
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                    <button type="submit" className="mansaba-btn-primary px-6 py-2.5" disabled={!rosterForm.patternId}>
                       Pasang Pola
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL FORM EDIT/TAMBAH PEGAWAI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                 <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">PIN Mesin <span className="text-rose-500">*</span></label>
                        <input type="number" className="mansaba-input" value={form.id} onChange={e => setForm({...form, id: e.target.value})} disabled={!!editingId} required placeholder="Contoh: 1" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">NIP</label>
                        <input className="mansaba-input" value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} placeholder="Opsional" />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input className="mansaba-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Contoh: Budi Santoso, S.Pd" />
                  </div>
                 
                 <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-2">
                         <label className="text-sm font-semibold text-slate-700">Jabatan <span className="text-rose-500">*</span></label>
                         <select className="mansaba-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                            <option value="GURU">GURU</option>
                            <option value="STAFF">STAFF</option>
                            <option value="SECURITY">SECURITY</option>
                            <option value="CLEANING">CLEANING</option>
                         </select>
                     </div>
                     <div className="space-y-2">
                         <label className="text-sm font-semibold text-slate-700">Kategori Pegawai <span className="text-rose-500">*</span></label>
                         <select className="mansaba-input font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            <option value="UMUM">UMUM (Non-Sertif / Honor)</option>
                            <option value="SERTIFIKASI">SERTIFIKASI (Guru Sertifikasi)</option>
                            <option value="ASN">ASN (PNS / PPPK)</option>
                         </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Portal PIN (6 Digit)</label>
                     <input 
                        type="text" 
                        className="mansaba-input" 
                        maxLength={6} 
                        value={form.pin} 
                        onChange={e => setForm({...form, pin: e.target.value})} 
                        placeholder="Untuk akses mandiri" 
                     />
                  </div>

                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tunjangan Transport (TTP) per Hari</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                       <input 
                          type="number" 
                          className="mansaba-input pl-12" 
                          value={form.transportRate} 
                          onChange={e => setForm({...form, transportRate: parseInt(e.target.value) || 0})} 
                          placeholder="Contoh: 25000" 
                       />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Kosongkan/set 0 untuk menggunakan tarif default sistem.</p>
                 </div>

                 <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                    <button type="submit" className="mansaba-btn-primary px-8 cursor-pointer">
                       {editingId ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {(deleteData || bulkDeleteActive) && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
               <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
               <p className="text-slate-500 mb-8">
                  {bulkDeleteActive 
                    ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} pegawai terpilih secara permanen? Data presensi dan honor juga akan hilang.` 
                    : `Hapus data "${deleteData?.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`
                  }
               </p>
               <div className="flex gap-3">
                  <button onClick={() => { setDeleteData(null); setBulkDeleteActive(false); }} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all">Ya, Hapus!</button>
               </div>
            </div>
         </div>
      )}

      {/* MODAL RIWAYAT SHIFT */}
      {historyEmp && (() => {
         const periods = sortedPeriods(historyEmp);
         const active = activePeriod(historyEmp);
         const today = new Date();
         const totalDays = periods.reduce((acc: number, p: any) => acc + periodDays(p, today), 0);
         const selected = periods.find((p: any) => p.id === selectedPeriodId) || null;
         const lookup = patternsInMonth(periods, lookupMonth, today);
         const correctPattern = patterns.find((p: any) => String(p.id) === correctPatternId);
         return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
               <button onClick={closeHistory} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
               </button>

               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 pr-8">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                     <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">Riwayat Shift</h3>
                     <p className="text-sm text-slate-500">{historyEmp.name} • ID {historyEmp.id} • {historyEmp.role}</p>
                  </div>
               </div>

               {active ? (
                  <div className="flex flex-wrap items-center gap-2 mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                     <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Berlaku hari ini</span>
                     <span className="text-sm font-bold text-blue-800">{active.pattern.name}</span>
                     <span className="text-xs text-blue-600">sejak {format(new Date(active.startDate), 'dd MMM yyyy', { locale: localeId })}</span>
                  </div>
               ) : (
                  <div className="mb-6 text-sm text-rose-500 italic font-semibold">Belum dipasang pola</div>
               )}

               {/* LINIMASA */}
               {periods.length > 0 && (
                  <div className="mb-6">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Linimasa Periode</p>
                     <div className="flex w-full gap-1">
                        {periods.map((p: any) => {
                           const days = periodDays(p, today);
                           const pct = totalDays > 0 ? (days / totalDays) * 100 : 0;
                           const isSel = p.id === selectedPeriodId;
                           return (
                              <button
                                 key={p.id}
                                 onClick={() => setSelectedPeriodId(p.id)}
                                 title={`${p.pattern.name} • ${format(new Date(p.startDate), 'dd MMM yyyy', { locale: localeId })}${p.endDate ? ` – ${format(new Date(p.endDate), 'dd MMM yyyy', { locale: localeId })}` : ' – Aktif'} • ${days} hari`}
                                 className={`rounded-lg px-2 py-2 text-left transition-all min-w-0 ${!p.endDate ? 'bg-blue-600 text-white' : isSel ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                 style={{ width: `${Math.max(pct, 12)}%` }}
                              >
                                 <span className="block text-[11px] font-bold truncate">{p.pattern.name}</span>
                                 <span className="block text-[9px] opacity-80 truncate">{days} hari</span>
                              </button>
                           );
                        })}
                     </div>
                     {selected && (
                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                           <span className="font-bold text-slate-800">{selected.pattern.name}</span>
                           <span className="text-slate-500"> • {format(new Date(selected.startDate), 'dd MMM yyyy', { locale: localeId })} – {selected.endDate ? format(new Date(selected.endDate), 'dd MMM yyyy', { locale: localeId }) : 'Aktif'}</span>
                           <span className="text-slate-500"> • {periodDays(selected, today)} hari</span>
                           {!selected.endDate && <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">Aktif sekarang</span>}
                        </div>
                     )}
                  </div>
               )}

               {/* LOOKUP BULAN */}
               <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shift pada bulan</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                     <input type="month" className="mansaba-input sm:w-48" value={lookupMonth} onChange={e => setLookupMonth(e.target.value)} />
                     <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                        {lookup.length === 0 ? (
                           <span className="text-sm text-slate-500 italic">Tidak ada pola pada {monthLabel(lookupMonth) || 'bulan tersebut'}</span>
                        ) : (
                           <div className="space-y-1">
                              {lookup.map((row: any, i: number) => (
                                 <div key={i} className="text-sm">
                                    <span className="font-bold text-slate-800">{row.period.pattern.name}</span>
                                    <span className="text-slate-500"> • {format(row.from, 'dd MMM yyyy', { locale: localeId })} – {format(row.to, 'dd MMM yyyy', { locale: localeId })} ({row.days} hari)</span>
                                    {!row.period.endDate && <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">Berjalan</span>}
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* KOREKSI PERIODE */}
               {selected && (
                  <div className="border-t border-slate-100 pt-6">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Koreksi periode lampau</p>
                     <p className="text-xs text-slate-500 mb-3">
                        Mengganti pola pada periode <span className="font-bold text-slate-700">{selected.pattern.name}</span> ({format(new Date(selected.startDate), 'dd MMM yyyy', { locale: localeId })} – {selected.endDate ? format(new Date(selected.endDate), 'dd MMM yyyy', { locale: localeId }) : 'Aktif'}).
                        Tanggal periode tidak berubah; hanya isinya yang ditukar.
                     </p>
                     <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <select className="mansaba-input flex-1" value={correctPatternId} onChange={e => { setCorrectPatternId(e.target.value); setCorrectConfirm(false); }}>
                           <option value="">Pilih pola pengganti…</option>
                           {patterns.map((p: any) => (
                              <option key={p.id} value={String(p.id)}>{p.name} (Siklus {p.cycleDays} hari)</option>
                           ))}
                        </select>
                     </div>
                     {correctPattern && correctPattern.id !== selected.patternId && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3 text-sm">
                           <p className="text-slate-700">
                              <span className="font-bold">{selected.pattern.name}</span> → <span className="font-bold">{correctPattern.name}</span>
                              <span className="text-slate-500"> • {format(new Date(selected.startDate), 'dd MMM yyyy', { locale: localeId })} – {selected.endDate ? format(new Date(selected.endDate), 'dd MMM yyyy', { locale: localeId }) : 'Aktif'} (tanggal tidak berubah)</span>
                           </p>
                           <p className="text-amber-700 font-semibold mt-1">
                              Perhatian: rekap &amp; honor {periodMonthsLabel(selected)} akan berubah saat dihitung ulang.
                           </p>
                           <label className="flex items-start gap-2 mt-2 cursor-pointer">
                              <input type="checkbox" className="mt-0.5" checked={correctConfirm} onChange={e => setCorrectConfirm(e.target.checked)} />
                              <span className="text-xs text-slate-600">Saya mengerti dampaknya dan ingin mengganti pola periode ini.</span>
                           </label>
                        </div>
                     )}
                     <div className="flex justify-end gap-3">
                        <button type="button" onClick={closeHistory} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Tutup</button>
                        <button
                           type="button"
                           onClick={handleCorrectPeriod}
                           disabled={!correctPattern || correctPattern.id === selected.patternId || !correctConfirm}
                           className="mansaba-btn-primary px-6 py-2.5 disabled:opacity-50"
                        >
                           Ganti Pola Periode
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
         );
      })}
    </div>
  );
};

export default EmployeesPage;
