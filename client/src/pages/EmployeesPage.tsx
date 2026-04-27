import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

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
    transportRate: 0,
    pin: ''
  });

  const [rosterForm, setRosterForm] = useState({
    patternId: '',
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

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
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const eventSource = new EventSource(`${protocol}//${hostname}:3001${API_URL}/machine/sync-employees`);
    
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
        
        <div className="flex items-center gap-4">
           {selectedIds.length > 0 && (
             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
               <span className="text-sm font-medium text-blue-700 mr-2">{selectedIds.length} data terpilih</span>
               <button 
                 onClick={() => {
                   setRosterForm({patternId: '', startDate: format(new Date(), 'yyyy-MM-dd')});
                   setIsBulkModalOpen(true);
                 }}
                 className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
               >
                 <i className="fa-solid fa-calendar-alt mr-1.5"></i> Plotting Masal
               </button>
               <button 
                 onClick={() => setBulkDeleteActive(true)}
                 className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition-colors"
               >
                 <i className="fa-solid fa-trash mr-1.5"></i> Hapus
               </button>
             </div>
           )}

           <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-xs text-slate-500 mb-1">Total Pegawai</span>
              <span className="text-lg font-semibold text-slate-800">{employees.length} <span className="text-xs font-normal text-slate-500">Orang</span></span>
           </div>
           
           <button 
             onClick={handleSyncEmployees}
             disabled={isSyncing}
             className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             <i className={`fa-solid fa-rotate ${isSyncing ? 'fa-spin' : ''}`}></i>
             {isSyncing ? 'Proses...' : 'Sinkron Mesin'}
           </button>

           <button 
             onClick={() => { setEditingId(null); setForm({id: '', name:'', nip:'', role:'GURU', transportRate:0, pin: ''}); setIsModalOpen(true); }}
             className="mansaba-btn-primary"
           >
             <i className="fa-solid fa-plus"></i> Tambah Pegawai
           </button>
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
         
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-500">Urutkan:</span>
               <select className="mansaba-input !py-1.5 w-auto" value={sortField} onChange={e => handleSort(e.target.value)}>
                  <option value="id">PIN Mesin</option>
                  <option value="name">Nama Pegawai</option>
                  <option value="role">Jabatan</option>
               </select>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-500">Tampil:</span>
               <select className="mansaba-input !py-1.5 w-auto" value={itemsPerPage} onChange={e => {setItemsPerPage(e.target.value as any); setCurrentPage(1);}}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value="all">Semua</option>
               </select>
            </div>
         </div>
      </div>

      {/* DATA TABLE */}
      <div className="mansaba-card-no-pad">
         <table className="mansaba-table">
            <thead>
               <tr>
               <th className="mansaba-th text-center w-12 cursor-pointer" onClick={toggleAll}>
                  <i className={`fa-solid ${selectedIds.length > 0 && selectedIds.length === filteredEmployees.length ? 'fa-check-square text-blue-600 text-base' : 'fa-square text-slate-300 text-base hover:text-slate-400'}`}></i>
               </th>
               <th className="mansaba-th text-center w-24">PIN</th>
               <th className="mansaba-th">Pegawai</th>
               <th className="mansaba-th text-center">Jabatan</th>
               <th className="mansaba-th">Pola Shift</th>
               <th className="mansaba-th text-right">Aksi</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr>
                     <td colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2">
                           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-sm text-slate-500">Memuat data...</span>
                        </div>
                     </td>
                  </tr>
               ) : paginated.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="text-center py-10 text-slate-500">Data pegawai tidak ditemukan</td>
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
                        <span className="text-xs text-slate-500 font-medium">NIP: {emp.nip || '-'} • Portal: {emp.pin ? 'Kunci Aktif' : 'Belum Atur'}</span>
                     </div>
                  </td>
                  <td className="mansaba-td text-center">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.role === 'GURU' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {emp.role}
                     </span>
                  </td>
                  <td className="mansaba-td">
                     <div className="flex items-center gap-2">
                        {emp.assignedPatterns && emp.assignedPatterns.length > 0 ? (
                           <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">{emp.assignedPatterns[0].pattern.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium italic">Mulai: {format(new Date(emp.assignedPatterns[0].startDate), 'dd/MM/yy')}</span>
                           </div>
                        ) : (
                           <span className="text-xs text-rose-400 italic font-semibold">Belum dipasang pola</span>
                        )}
                     </div>
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
    </div>
  );
};

export default EmployeesPage;
