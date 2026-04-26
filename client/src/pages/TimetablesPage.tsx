import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const TimetablesPage = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<number | 'all'>('all');

  const [newCatName, setNewCatName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
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

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({
      name: t.name || '',
      categoryId: t.categoryId || '',
      jamMasuk: t.jamMasuk || '07:00',
      jamPulang: t.jamPulang || '14:30',
      mulaiScanIn: t.mulaiScanIn || '06:00',
      akhirScanIn: t.akhirScanIn || '10:00',
      mulaiScanOut: t.mulaiScanOut || '13:00',
      akhirScanOut: t.akhirScanOut || '16:00',
      color: t.color || '#3b82f6'
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
      if (editingId) {
        await axios.put(`${API_URL}/timetables/${editingId}`, formData);
        toast.success("Data jadwal diperbarui");
      } else {
        await axios.post(`${API_URL}/timetables`, formData);
        toast.success("Jadwal baru berhasil ditambahkan");
      }
      setShowAdd(false);
      setEditingId(null);
      setFormData({
        name: '', categoryId: '',
        jamMasuk: '07:00', jamPulang: '14:30',
        mulaiScanIn: '06:00', akhirScanIn: '10:00',
        mulaiScanOut: '13:00', akhirScanOut: '16:00',
        color: '#3b82f6'
      });
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan jadwal");
    }
  };

  const filteredData = filterCategoryId === 'all' 
    ? timetables 
    : timetables.filter(t => t.categoryId === filterCategoryId);

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-semibold text-slate-800">Master Jam Kerja</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola jam kerja, batas scan presensi, dan kategori jadwal.</p>
         </div>
         
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCatModal(true)}
              className="px-4 py-2 bg-white text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors border border-slate-200 flex items-center gap-2"
            >
              <i className="fa-solid fa-tags text-slate-400"></i> Kelola Kategori
            </button>
            <button 
              onClick={() => { setEditingId(null); setShowAdd(true); }}
              className="mansaba-btn-primary"
            >
              <i className="fa-solid fa-plus"></i> Tambah Jadwal
            </button>
         </div>
      </div>

      {/* FILTER TABS */}
      <div className="mansaba-card p-3 flex flex-wrap gap-2">
         <button 
            onClick={() => setFilterCategoryId('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterCategoryId === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
         >
            Semua Jadwal
         </button>
         <div className="w-px h-6 bg-slate-200 self-center mx-2"></div>
         {categories.map(cat => (
            <button 
               key={cat.id}
               onClick={() => setFilterCategoryId(cat.id)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterCategoryId === cat.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               {cat.name}
            </button>
         ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
           <i className="fa-solid fa-spinner fa-spin text-blue-600 text-2xl mb-4"></i>
           <p className="text-sm text-slate-500">Memuat data jadwal...</p>
        </div>
      ) : (
        <div className="mansaba-card-no-pad">
          <table className="mansaba-table">
            <thead>
              <tr>
                <th className="mansaba-th">Nama Jadwal</th>
                <th className="mansaba-th text-center">Waktu Efektif</th>
                <th className="mansaba-th">Batas Scan Masuk</th>
                <th className="mansaba-th">Batas Scan Pulang</th>
                <th className="mansaba-th text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className="tr-hover">
                  <td className="mansaba-td">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#3b82f6' }}></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 mb-0.5">{t.name}</span>
                        <span className="text-xs text-slate-500">{t.category?.name || 'Umum'}</span>
                      </div>
                    </div>
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
              ))}
              {filteredData.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-slate-500">
                     Belum ada jadwal yang terdaftar.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
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
                          <label className="text-sm font-medium text-slate-600">Nama Jadwal <span className="text-rose-500">*</span></label>
                          <input className="mansaba-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Shift Pagi" required />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Kategori <span className="text-rose-500">*</span></label>
                          <select className="mansaba-input" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                             <option value="">Pilih Kategori...</option>
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
    </div>
  );
};

export default TimetablesPage;
