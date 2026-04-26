import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({ 
    id: '', 
    name: '', 
    nip: '', 
    role: 'GURU', 
    transportRate: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empRes = await axios.get(`${API_URL}/employees`);
      setEmployees(empRes.data);
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

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.nip && e.nip.includes(search)) ||
    (String(e.id).includes(search))
  );

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
      await axios.post(`${API_URL}/employees`, form);
      toast.success(editingId ? 'Data pegawai diperbarui' : 'Pegawai baru didaftarkan');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan data pegawai');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Data Pegawai</h2>
           <p className="text-sm text-slate-500 mt-1">Kelola data presensi, NIP, dan jabatan pegawai.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-xs text-slate-500 mb-1">Total Pegawai</span>
              <span className="text-lg font-semibold text-slate-800">{employees.length} <span className="text-xs font-normal text-slate-500">Orang</span></span>
           </div>
           <button 
             onClick={() => { setEditingId(null); setForm({id: '', name:'', nip:'', role:'GURU', transportRate:0}); setIsModalOpen(true); }}
             className="mansaba-btn-primary"
           >
             <i className="fa-solid fa-plus"></i> Tambah Pegawai
           </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mansaba-card flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full md:w-80">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              className="mansaba-input pl-10" 
              placeholder="Cari nama atau PIN..." 
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
                     <td colSpan={5} className="py-12 text-center text-slate-500">
                        <i className="fa-solid fa-spinner fa-spin text-xl text-blue-600 mb-2 block"></i> Memuat data...
                     </td>
                  </tr>
               ) : paginated.length > 0 ? paginated.map((emp) => {
               const activePattern = emp.assignedPatterns?.[0]?.pattern;
               return (
                  <tr key={emp.id} className="tr-hover">
                     <td className="mansaba-td text-center font-medium">#{String(emp.id).padStart(4, '0')}</td>
                     <td className="mansaba-td">
                        <div className="flex flex-col">
                           <span className="text-sm font-semibold text-slate-800">{emp.name}</span>
                           <span className="text-xs text-slate-500">{emp.nip || 'Tidak ada NIP'}</span>
                        </div>
                     </td>
                     <td className="mansaba-td text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${emp.role === 'GURU' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                           {emp.role}
                        </span>
                     </td>
                     <td className="mansaba-td">
                        {activePattern ? (
                           <span className="text-sm text-slate-700">{activePattern.name}</span>
                        ) : (
                           <span className="text-xs text-slate-400 italic">Belum diatur</span>
                        )}
                     </td>
                     <td className="mansaba-td text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => {
                                setEditingId(emp.id);
                                setForm({ id: String(emp.id), name: emp.name, nip: emp.nip || '', role: emp.role, transportRate: emp.transportRate || 0 });
                                setIsModalOpen(true);
                             }}
                             className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                             title="Edit Pegawai"
                           >
                              <i className="fa-solid fa-pen-to-square"></i>
                           </button>
                           <button 
                             onClick={async () => { if (window.confirm('Yakin ingin menghapus pegawai ini?')) { await axios.delete(`${API_URL}/employees/${emp.id}`); fetchData(); } }}
                             className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                             title="Hapus Pegawai"
                           >
                              <i className="fa-solid fa-trash-can"></i>
                           </button>
                        </div>
                     </td>
                  </tr>
               );
               }) : (
               <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                     Belum ada data pegawai yang terdaftar.
                  </td>
               </tr>
               )}
            </tbody>
         </table>

         {/* PAGINATION */}
         {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
               <span className="text-sm text-slate-500">
                  Halaman <span className="font-medium text-slate-800">{currentPage}</span> dari {totalPages}
               </span>
               <div className="flex items-center gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Sebelumnya</button>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Selanjutnya</button>
               </div>
            </div>
         )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                 <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              <h3 className="text-lg font-semibold text-slate-800 mb-6">{editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">PIN Mesin <span className="text-rose-500">*</span></label>
                        <input type="number" className="mansaba-input" value={form.id} onChange={e => setForm({...form, id: e.target.value})} disabled={!!editingId} required placeholder="Contoh: 1" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">NIP</label>
                        <input className="mansaba-input" value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} placeholder="Opsional" />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input className="mansaba-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Contoh: Budi Santoso, S.Pd" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Jabatan <span className="text-rose-500">*</span></label>
                        <select className="mansaba-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                           <option value="GURU">Guru</option>
                           <option value="STAF">Staf / Karyawan</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                    <button type="submit" className="mansaba-btn-primary px-6">Simpan Pegawai</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
