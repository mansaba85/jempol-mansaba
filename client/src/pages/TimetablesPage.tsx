import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const TimetablesPage = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'REGULER' | 'SPECIAL' | 'ALL'>('REGULER');
  const [showAdd, setShowAdd] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<number | 'all'>('all');

  const [regularTabLabel, setRegularTabLabel] = useState(() => localStorage.getItem('mansaba_regular_tab_label') || 'Jadwal Reguler');
  const [specialTabLabel, setSpecialTabLabel] = useState(() => localStorage.getItem('mansaba_special_tab_label') || 'Jadwal Khusus / Ramadhan');
  const [renameTabType, setRenameTabType] = useState<'REGULER' | 'SPECIAL' | null>(null);
  const [customTabInput, setCustomTabInput] = useState('');

  const [newCatName, setNewCatName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    scheduleType: 'REGULER',
    categoryId: '',
    jamMasuk: '07:00',
    jamPulang: '14:30',
    mulaiScanIn: '06:00',
    akhirScanIn: '10:00',
    mulaiScanOut: '13:00',
    akhirScanOut: '16:00',
    color: '#3b82f6'
  });

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const handleOpenRenameModal = (type: 'REGULER' | 'SPECIAL') => {
    setRenameTabType(type);
    setCustomTabInput(type === 'REGULER' ? regularTabLabel : specialTabLabel);
  };

  const handleSaveTabName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTabInput.trim()) return;

    if (renameTabType === 'REGULER') {
      setRegularTabLabel(customTabInput.trim());
      localStorage.setItem('mansaba_regular_tab_label', customTabInput.trim());
      toast.success("Nama tab reguler diperbarui");
    } else if (renameTabType === 'SPECIAL') {
      setSpecialTabLabel(customTabInput.trim());
      localStorage.setItem('mansaba_special_tab_label', customTabInput.trim());
      toast.success("Nama tab khusus diperbarui");
    }
    setRenameTabType(null);
  };

  const handleResetTabName = () => {
    if (renameTabType === 'REGULER') {
      setRegularTabLabel('Jadwal Reguler');
      localStorage.removeItem('mansaba_regular_tab_label');
      toast.success("Nama tab dikembalikan ke default");
    } else if (renameTabType === 'SPECIAL') {
      setSpecialTabLabel('Jadwal Khusus / Ramadhan');
      localStorage.removeItem('mansaba_special_tab_label');
      toast.success("Nama tab dikembalikan ke default");
    }
    setRenameTabType(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/timetables`);
      setTimetables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal mengambil data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const addCategory = async () => {
    if (!newCatName) return;
    try {
      await axios.post(`${API_URL}/categories`, { name: newCatName });
      setNewCatName('');
      toast.success("Kategori berhasil ditambahkan");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menambah kategori");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm("Hapus kategori ini? Jadwal yang terkait akan kehilangan kategorinya.")) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      fetchCategories();
      fetchData();
      toast.success("Kategori berhasil dihapus");
    } catch (err) { toast.error("Gagal menghapus kategori"); }
  };

  const isSpecialTimetable = (t: any) => {
    const catName = (t.category?.name || t.categoryName || '').toLowerCase();
    const name = (t.name || '').toLowerCase();
    return catName.includes('ramadhan') || catName.includes('khusus') || catName.includes('insidental') || catName.includes('puasa') ||
           name.includes('ramadhan') || name.includes('khusus') || name.includes('insidental') || name.includes('puasa');
  };

  const regularTimetables = useMemo(() => timetables.filter(t => !isSpecialTimetable(t)), [timetables]);
  const specialTimetables = useMemo(() => timetables.filter(t => isSpecialTimetable(t)), [timetables]);

  const handleOpenAdd = (type: 'REGULER' | 'SPECIAL' = 'REGULER') => {
    setEditingId(null);
    setFormData({
      name: '',
      scheduleType: type,
      categoryId: '',
      jamMasuk: type === 'SPECIAL' ? '07:30' : '07:00',
      jamPulang: type === 'SPECIAL' ? '13:00' : '14:30',
      mulaiScanIn: type === 'SPECIAL' ? '06:30' : '06:00',
      akhirScanIn: '10:00',
      mulaiScanOut: type === 'SPECIAL' ? '12:30' : '13:00',
      akhirScanOut: '16:00',
      color: type === 'SPECIAL' ? '#8b5cf6' : '#3b82f6'
    });
    setShowAdd(true);
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    const isSpecial = isSpecialTimetable(t);
    setFormData({
      name: t.name || '',
      scheduleType: isSpecial ? 'SPECIAL' : 'REGULER',
      categoryId: t.categoryId || '',
      jamMasuk: t.jamMasuk || '07:00',
      jamPulang: t.jamPulang || '14:30',
      mulaiScanIn: t.mulaiScanIn || '06:00',
      akhirScanIn: t.akhirScanIn || '10:00',
      mulaiScanOut: t.mulaiScanOut || '13:00',
      akhirScanOut: t.akhirScanOut || '16:00',
      color: t.color || (isSpecial ? '#8b5cf6' : '#3b82f6')
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    try {
      await axios.delete(`${API_URL}/timetables/${id}`);
      toast.success("Jadwal terhapus");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal menghapus jadwal";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCategoryId = formData.categoryId ? Number(formData.categoryId) : null;

      // If marked as special and no category is selected or selected category doesn't indicate Ramadhan, auto handle category
      if (formData.scheduleType === 'SPECIAL' && !finalCategoryId) {
        let ramadhanCat = categories.find(c => c.name.toLowerCase().includes('ramadhan') || c.name.toLowerCase().includes('khusus'));
        if (!ramadhanCat) {
          const res = await axios.post(`${API_URL}/categories`, { name: 'Ramadhan / Khusus' });
          ramadhanCat = res.data;
          await fetchCategories();
        }
        if (ramadhanCat) finalCategoryId = ramadhanCat.id;
      }

      const payload = {
        name: formData.name,
        categoryId: finalCategoryId,
        jamMasuk: formData.jamMasuk,
        jamPulang: formData.jamPulang,
        mulaiScanIn: formData.mulaiScanIn,
        akhirScanIn: formData.akhirScanIn,
        mulaiScanOut: formData.mulaiScanOut,
        akhirScanOut: formData.akhirScanOut,
        color: formData.color
      };

      if (editingId) {
        await axios.put(`${API_URL}/timetables/${editingId}`, payload);
        toast.success("Data jadwal diperbarui");
      } else {
        await axios.post(`${API_URL}/timetables`, payload);
        toast.success("Jadwal baru berhasil ditambahkan");
      }
      setShowAdd(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan jadwal");
    }
  };

  const tabFilteredData = useMemo(() => {
    let baseList = timetables;
    if (activeTab === 'REGULER') baseList = regularTimetables;
    else if (activeTab === 'SPECIAL') baseList = specialTimetables;

    if (filterCategoryId === 'all') return baseList;
    return baseList.filter(t => t.categoryId === filterCategoryId);
  }, [activeTab, filterCategoryId, timetables, regularTimetables, specialTimetables]);

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-semibold text-slate-800">Master Jam Kerja</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola jam kerja, batas scan presensi, dan kategori jadwal terpisah antara reguler dan insidental.</p>
         </div>
         
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCatModal(true)}
              className="px-4 py-2 bg-white text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors border border-slate-200 flex items-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-tags text-slate-400"></i> Kelola Kategori
            </button>
            <button 
              onClick={() => handleOpenAdd(activeTab === 'SPECIAL' ? 'SPECIAL' : 'REGULER')}
              className="mansaba-btn-primary"
            >
              <i className="fa-solid fa-plus"></i> {activeTab === 'SPECIAL' ? 'Tambah Jam Khusus' : 'Tambah Jam Kerja'}
            </button>
         </div>
      </div>

      {/* TOP-LEVEL MODE SWITCHER TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-2">
         <div className="flex bg-slate-100 p-1 rounded-xl items-center">
            {/* Tab Reguler */}
            <div className="relative group/tab">
              <button 
                onClick={() => { setActiveTab('REGULER'); setFilterCategoryId('all'); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'REGULER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                 <span>☀️ {regularTabLabel}</span>
                 <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                   activeTab === 'REGULER' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'
                 }`}>
                   {regularTimetables.length}
                 </span>
                 <button
                   type="button"
                   onClick={(e) => { e.stopPropagation(); handleOpenRenameModal('REGULER'); }}
                   className="opacity-0 group-hover/tab:opacity-100 hover:text-blue-700 text-slate-400 p-1 rounded hover:bg-slate-100 transition-all text-xs ml-0.5"
                   title="Ubah nama tab ini"
                 >
                   <i className="fa-solid fa-pen text-[10px]"></i>
                 </button>
              </button>
            </div>

            {/* Tab Khusus / Ramadhan */}
            <div className="relative group/tab">
              <button 
                onClick={() => { setActiveTab('SPECIAL'); setFilterCategoryId('all'); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'SPECIAL' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                 <span>🌙 {specialTabLabel}</span>
                 <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                   activeTab === 'SPECIAL' ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-600'
                 }`}>
                   {specialTimetables.length}
                 </span>
                 <button
                   type="button"
                   onClick={(e) => { e.stopPropagation(); handleOpenRenameModal('SPECIAL'); }}
                   className="opacity-60 group-hover/tab:opacity-100 hover:text-purple-700 text-slate-400 p-1 rounded hover:bg-purple-50 transition-all text-xs ml-0.5"
                   title="Ubah nama tab ini"
                 >
                   <i className="fa-solid fa-pen text-[10px]"></i>
                 </button>
              </button>
            </div>

            {/* Tab Semua */}
            <button 
              onClick={() => { setActiveTab('ALL'); setFilterCategoryId('all'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
               Semua ({timetables.length})
            </button>
         </div>

         {/* SUB CATEGORY PILLS */}
         {categories.length > 0 && (
           <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">Filter Kategori:</span>
              <button 
                 onClick={() => setFilterCategoryId('all')}
                 className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                   filterCategoryId === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                 }`}
              >
                 Semua
              </button>
              {categories.map(cat => (
                 <button 
                    key={cat.id}
                    onClick={() => setFilterCategoryId(cat.id)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      filterCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                 >
                    {cat.name}
                 </button>
              ))}
           </div>
         )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
           <i className="fa-solid fa-spinner fa-spin text-blue-600 text-2xl mb-4"></i>
           <p className="text-sm text-slate-500">Memuat data jadwal...</p>
        </div>
      ) : activeTab === 'SPECIAL' && specialTimetables.length === 0 ? (
        /* EMPTY STATE KHUSUS / RAMADHAN */
        <div className="mansaba-card p-10 flex flex-col items-center justify-center text-center border-dashed border-2 border-purple-200 bg-purple-50/20">
           <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
              <i className="fa-solid fa-moon"></i>
           </div>
           <h3 className="text-lg font-bold text-slate-800 mb-1">Kontainer Jadwal Khusus / Ramadhan</h3>
           <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Jadwal reguler tetap aman dan terpisah. Saat menjelang bulan Ramadhan atau kegiatan khusus lainnya, tambahkan jam kerja khusus di sini agar tidak bercampur dengan jadwal normal.
           </p>
           <button 
             onClick={() => handleOpenAdd('SPECIAL')}
             className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
           >
              <i className="fa-solid fa-plus"></i> Tambah Jam Kerja Ramadhan / Khusus
           </button>
        </div>
      ) : (
        <div className="mansaba-card-no-pad">
          <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 text-rose-600 animate-pulse bg-rose-50/30">
            <i className="fa-solid fa-angles-right text-[10px]"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Geser ke samping untuk melihat jam</span>
          </div>
          <div className="overflow-x-auto">
          <table className="mansaba-table">
            <thead>
              <tr>
                <th className="mansaba-th">Nama Jadwal</th>
                <th className="mansaba-th text-center">Tipe / Kategori</th>
                <th className="mansaba-th text-center">Waktu Efektif</th>
                <th className="mansaba-th">Batas Scan Masuk</th>
                <th className="mansaba-th">Batas Scan Pulang</th>
                <th className="mansaba-th text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tabFilteredData.map(t => {
                const isSpecial = isSpecialTimetable(t);
                return (
                  <tr key={t.id} className="tr-hover">
                    <td className="mansaba-td">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || (isSpecial ? '#8b5cf6' : '#3b82f6') }}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 mb-0.5">{t.name}</span>
                          <span className="text-xs text-slate-400">{t.category?.name || 'Umum'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mansaba-td text-center">
                      {isSpecial ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-bold">
                          <i className="fa-solid fa-moon text-[10px]"></i> Khusus / Ramadhan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold">
                          <i className="fa-solid fa-sun text-[10px]"></i> Reguler
                        </span>
                      )}
                    </td>
                    <td className="mansaba-td text-center">
                      <div className="inline-flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-medium">MASUK</span>
                          <span className="text-sm font-semibold text-emerald-600">{t.jamMasuk}</span>
                        </div>
                        <i className="fa-solid fa-arrow-right text-slate-400 text-xs"></i>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-medium">PULANG</span>
                          <span className="text-sm font-semibold text-rose-600">{t.jamPulang}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mansaba-td">
                      <span className="text-sm text-slate-700">{t.mulaiScanIn} <span className="text-slate-400 mx-1">-</span> {t.akhirScanIn}</span>
                    </td>
                    <td className="mansaba-td">
                      <span className="text-sm text-slate-700">{t.mulaiScanOut} <span className="text-slate-400 mx-1">-</span> {t.akhirScanOut}</span>
                    </td>
                    <td className="mansaba-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="w-8 h-8 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                          title="Edit Jadwal"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="w-8 h-8 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                          title="Hapus Jadwal"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tabFilteredData.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-slate-500">
                     Belum ada jadwal yang sesuai kriteria filter.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
              <button onClick={() => setShowCatModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Kelola Kategori</h3>
              
              <div className="flex gap-2 mb-6">
                 <input className="mansaba-input flex-1" placeholder="Nama kategori baru..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} />
                 <button onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                  Tambah
                 </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                 {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                       <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                       <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                        <i className="fa-solid fa-trash-can"></i>
                       </button>
                    </div>
                 ))}
                 {categories.length === 0 && <p className="text-center text-sm text-slate-500 py-4">Belum ada kategori.</p>}
              </div>
           </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              <h3 className="text-lg font-semibold text-slate-800 mb-6">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Identitas Jadwal</h4>
                       
                       <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Tipe Jadwal <span className="text-rose-500">*</span></label>
                          <div className="grid grid-cols-2 gap-2">
                             <button
                               type="button"
                               onClick={() => setFormData({ ...formData, scheduleType: 'REGULER', color: '#3b82f6' })}
                               className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                 formData.scheduleType === 'REGULER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                               }`}
                             >
                                ☀️ Reguler (Standar)
                             </button>
                             <button
                               type="button"
                               onClick={() => setFormData({ ...formData, scheduleType: 'SPECIAL', color: '#8b5cf6' })}
                               className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                 formData.scheduleType === 'SPECIAL' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                               }`}
                             >
                                🌙 Khusus / Ramadhan
                             </button>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Nama Jadwal <span className="text-rose-500">*</span></label>
                          <input 
                            className="mansaba-input" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder={formData.scheduleType === 'SPECIAL' ? 'Contoh: Ramadhan Guru Pagi' : 'Contoh: Shift Guru Pagi'} 
                            required 
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Kategori Sub</label>
                          <select className="mansaba-input" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                             <option value="">(Opsional) Pilih Kategori...</option>
                             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>

                       <div className="space-y-1.5 flex flex-col">
                          <label className="text-sm font-medium text-slate-600">Warna Penanda</label>
                          <input type="color" className="w-12 h-10 border border-slate-300 rounded cursor-pointer" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Ketentuan Jam Scan</h4>
                       
                       <div className="space-y-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <div className="font-medium text-emerald-700 text-sm mb-1">Scan Masuk</div>
                          <div className="flex gap-2 items-center">
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Jam Masuk</label>
                                <input type="time" className="mansaba-input !py-1 text-sm font-semibold" value={formData.jamMasuk} onChange={e => setFormData({...formData, jamMasuk: e.target.value})} required />
                             </div>
                          </div>
                          <div className="flex gap-2 items-center">
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Mulai Scan</label>
                                <input type="time" className="mansaba-input !py-1 text-sm" value={formData.mulaiScanIn} onChange={e => setFormData({...formData, mulaiScanIn: e.target.value})} required />
                             </div>
                             <span className="text-slate-400 mt-5">-</span>
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Batas Scan</label>
                                <input type="time" className="mansaba-input !py-1 text-sm" value={formData.akhirScanIn} onChange={e => setFormData({...formData, akhirScanIn: e.target.value})} required />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3 bg-rose-50 p-3 rounded-lg border border-rose-100">
                          <div className="font-medium text-rose-700 text-sm mb-1">Scan Pulang</div>
                          <div className="flex gap-2 items-center">
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Jam Pulang</label>
                                <input type="time" className="mansaba-input !py-1 text-sm font-semibold" value={formData.jamPulang} onChange={e => setFormData({...formData, jamPulang: e.target.value})} required />
                             </div>
                          </div>
                          <div className="flex gap-2 items-center">
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Mulai Scan</label>
                                <input type="time" className="mansaba-input !py-1 text-sm" value={formData.mulaiScanOut} onChange={e => setFormData({...formData, mulaiScanOut: e.target.value})} required />
                             </div>
                             <span className="text-slate-400 mt-5">-</span>
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-500 block">Batas Scan</label>
                                <input type="time" className="mansaba-input !py-1 text-sm" value={formData.akhirScanOut} onChange={e => setFormData({...formData, akhirScanOut: e.target.value})} required />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-200">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                    <button type="submit" className="mansaba-btn-primary px-6">
                       {editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL EDIT NAMA TAB */}
      {renameTabType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className={`absolute top-0 left-0 w-full h-1 ${renameTabType === 'SPECIAL' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  renameTabType === 'SPECIAL' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">
                    Ubah Nama Tab {renameTabType === 'SPECIAL' ? 'Khusus' : 'Reguler'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Sesuaikan judul tab sesuai keperluan acara / musim</p>
                </div>
              </div>
              <button 
                onClick={() => setRenameTabType(null)} 
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveTabName} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nama Tampilan Tab</label>
                <input 
                  type="text" 
                  value={customTabInput}
                  onChange={e => setCustomTabInput(e.target.value)}
                  placeholder="Ketik nama tab..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              {/* Rekomendasi Nama Cepat */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contoh Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {renameTabType === 'SPECIAL' ? (
                    <>
                      {['Jadwal Khusus / Ramadhan', 'Jadwal Ramadhan 1447 H', 'Jadwal Bulan Puasa', 'Jadwal Ujian PTS/PAS', 'Jadwal Insidental'].map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setCustomTabInput(suggestion)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {['Jadwal Reguler', 'Jadwal Normal', 'Jadwal Standar', 'Jadwal Harian'].map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setCustomTabInput(suggestion)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-5">
                <button 
                  type="button" 
                  onClick={handleResetTabName} 
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  Reset Default
                </button>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setRenameTabType(null)} 
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${
                      renameTabType === 'SPECIAL' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    }`}
                  >
                    Simpan Nama
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablesPage;
