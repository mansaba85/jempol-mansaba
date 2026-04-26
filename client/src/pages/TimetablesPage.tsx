import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit2,
  Tag,
  X,
  Settings2,
  Clock
} from 'lucide-react';
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
    color: '#086862'
  });

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/timetables`);
      setTimetables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal ambil data:", err);
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
      toast.success("Kategori ditambahkan");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal tambah kategori");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm("Hapus kategori ini? Data jam kerja terkait mungkin akan kehilangan labelnya.")) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      fetchCategories();
      fetchData();
      toast.success("Kategori dihapus");
    } catch (err) { toast.error("Gagal hapus"); }
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
      color: t.color || '#086862'
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus master jam kerja ini?")) return;
    try {
      await axios.delete(`${API_URL}/timetables/${id}`);
      toast.success("Jam kerja dihapus");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal menghapus";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/timetables/${editingId}`, formData);
        toast.success("Jam kerja diperbarui");
      } else {
        await axios.post(`${API_URL}/timetables`, formData);
        toast.success("Jam kerja ditambahkan");
      }
      setShowAdd(false);
      setEditingId(null);
      setFormData({
        name: '', categoryId: '',
        jamMasuk: '07:00', jamPulang: '14:30',
        mulaiScanIn: '06:00', akhirScanIn: '10:00',
        mulaiScanOut: '13:00', akhirScanOut: '16:00',
        color: '#086862'
      });
      fetchData();
    } catch (err) {
      toast.error("Gagal simpan data");
    }
  };

  const filteredData = filterCategoryId === 'all' 
    ? timetables 
    : timetables.filter(t => t.categoryId === filterCategoryId);

  return (
    <div className="animate-in fade-in duration-700">
      <Toaster position="top-right" />
      
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Master Jam Kerja</h2>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Konfigurasi jadwal kehadiran institusi</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-surface-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-surface-200 transition-all border border-slate-200/50"
          >
            <Tag size={18} /> Kelola Kategori
          </button>
          <button 
            onClick={() => { setEditingId(null); setShowAdd(true); }}
            className="btn-mansaba px-8 py-3.5 !rounded-2xl shadow-xl shadow-primary/20"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Jam Kerja
          </button>
        </div>
      </header>

      {/* FILTER CATEGORIES */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-8">
           <div className="flex bg-surface-100 p-1 rounded-2xl border border-slate-200/50 overflow-x-auto max-w-full no-scrollbar">
              <button 
                onClick={() => setFilterCategoryId('all')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${filterCategoryId === 'all' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setFilterCategoryId(cat.id)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${filterCategoryId === cat.id ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {cat.name}
                </button>
              ))}
           </div>
           <div className="ml-auto pr-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
              Total Entitas: <span className="text-primary ml-1">{filteredData.length}</span>
           </div>
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center opacity-30 font-medium">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] uppercase tracking-widest">SINKRONISASI DATA...</p>
        </div>
      ) : (
        <div className="table-wrapper border border-slate-200/50 shadow-premium">
          <table className="table-mansaba">
            <thead>
              <tr>
                <th className="table-header">Label & Info</th>
                <th className="table-header text-center">Jadwal Utama (In - Out)</th>
                <th className="table-header">Konfigurasi Scan Mandiri</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: t.color || '#086862' }}
                      >
                        {t.category?.name?.[0] || 'J'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm tracking-tight">{t.name}</span>
                        {t.category?.name && <span className="text-[10px] font-semibold text-slate-400 uppercase">{t.category.name}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-base font-black border border-emerald-100 italic">
                        {t.jamMasuk}
                      </div>
                      <span className="text-slate-300 font-bold">sampai</span>
                      <div className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-base font-black border border-rose-100 italic">
                        {t.jamPulang}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-300 uppercase w-6">IN</span>
                        <span className="text-[10px] font-semibold text-slate-500">{t.mulaiScanIn} - {t.akhirScanIn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-300 uppercase w-6">OUT</span>
                        <span className="text-[10px] font-semibold text-slate-500">{t.mulaiScanOut} - {t.akhirScanOut}</span>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="p-2.5 bg-surface-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-slate-100 hover:border-primary/10 shadow-sm"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2.5 bg-surface-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 hover:border-rose-100 shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                       <Settings2 size={40} className="mb-4 text-slate-400" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum Ada Jadwal Diatur</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showCatModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative border border-white/20">
            <button onClick={() => setShowCatModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Kelola Kategori</h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-8 uppercase tracking-widest">Daftar peran pegawai yang tersedia</p>
            
            <div className="flex gap-2 mb-8">
              <input 
                className="input-mansaba flex-1 !py-3 !rounded-xl" 
                placeholder="Nama kategori baru..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addCategory()}
              />
              <button 
                onClick={addCategory}
                className="p-3.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-2xl border border-slate-100 group">
                  <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Kategori Kosong</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM JAM KERJA */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl relative border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">{editingId ? 'Edit Master Jadwal' : 'Tambah Master Jadwal'}</h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-10 border-b border-slate-50 pb-6 uppercase tracking-widest">DETAIL KONFIGURASI OPERASIONAL HARIAN</p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Label Identitas</label>
                  <input className="input-mansaba w-full !py-4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: Shift A" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori Peran</label>
                  <select 
                    className="input-mansaba w-full !py-4 appearance-none" 
                    value={formData.categoryId} 
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-8 bg-surface-50 p-8 rounded-[2rem] border border-slate-100/50">
                 <div className="space-y-5">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center gap-2">
                       <Clock size={12} /> Jadwal Masuk
                    </p>
                    <input type="time" className="input-mansaba w-full !bg-white font-bold !text-base text-center" value={formData.jamMasuk} onChange={e => setFormData({...formData, jamMasuk: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                       <input type="time" className="input-mansaba w-full !bg-white !p-2.5 !text-[10px] text-center" value={formData.mulaiScanIn} onChange={e => setFormData({...formData, mulaiScanIn: e.target.value})} />
                       <input type="time" className="input-mansaba w-full !bg-white !p-2.5 !text-[10px] text-center" value={formData.akhirScanIn} onChange={e => setFormData({...formData, akhirScanIn: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-5">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest border-b border-rose-500/10 pb-2 flex items-center gap-2">
                       <Clock size={12} /> Jadwal Pulang
                    </p>
                    <input type="time" className="input-mansaba w-full !bg-white font-bold !text-base text-center" value={formData.jamPulang} onChange={e => setFormData({...formData, jamPulang: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                       <input type="time" className="input-mansaba w-full !bg-white !p-2.5 !text-[10px] text-center" value={formData.mulaiScanOut} onChange={e => setFormData({...formData, mulaiScanOut: e.target.value})} />
                       <input type="time" className="input-mansaba w-full !bg-white !p-2.5 !text-[10px] text-center" value={formData.akhirScanOut} onChange={e => setFormData({...formData, akhirScanOut: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 text-[11px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">Batal</button>
                <button type="submit" className="flex-[3] btn-mansaba !py-4 shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] font-bold">
                   {editingId ? 'Simpan Perubahan' : 'Daftarkan Master'}
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
