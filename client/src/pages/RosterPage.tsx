import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  ChevronRight, 
  Layers, 
  X as CloseIcon, 
  Calendar, 
  Edit3 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const RosterPage = () => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [patternItems, setPatternItems] = useState<any>({}); // dayNumber -> timetableId
  
  // Create Form States
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    periode: '1',
    unitPeriode: 'Minggu',
    category: 'Guru'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resP, resT] = await Promise.all([
        axios.get(`${API_URL}/patterns`),
        axios.get(`${API_URL}/timetables`)
      ]);
      setPatterns(resP.data);
      setTimetables(resT.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPattern = (p: any) => {
    const periVal = p.cycleDays >= 7 ? Math.floor(p.cycleDays / 7) : p.cycleDays;
    const unitVal = p.cycleDays >= 7 ? 'Minggu' : 'Hari';
    
    setFormData({
      id: p.id,
      name: p.name,
      startDate: p.startDate ? format(new Date(p.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      periode: String(periVal),
      unitPeriode: unitVal,
      category: p.category || 'Guru'
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cycleDays = formData.unitPeriode === 'Minggu' ? parseInt(formData.periode) * 7 : parseInt(formData.periode);
    
    try {
      await axios.put(`${API_URL}/patterns/${formData.id}`, {
        name: formData.name,
        startDate: formData.startDate,
        cycleDays: cycleDays // Optional: depends if you want to allow changing cycle length
      });
      toast.success('Shift diperbarui');
      setShowEdit(false);
      fetchData();
      if (selectedPattern?.id === formData.id) {
        setSelectedPattern({...selectedPattern, name: formData.name, startDate: formData.startDate, cycleDays});
      }
    } catch (err) {
      toast.error('Gagal update shift');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cycleDays = formData.unitPeriode === 'Minggu' ? parseInt(formData.periode) * 7 : parseInt(formData.periode);
    
    try {
      const res = await axios.post(`${API_URL}/patterns`, {
        name: formData.name,
        category: formData.category,
        cycleDays: cycleDays,
        startDate: formData.startDate
      });
      toast.success('Shift baru berhasil dibuat');
      setShowAdd(false);
      setFormData({ ...formData, name: '', startDate: format(new Date(), 'yyyy-MM-dd') });
      fetchData();
      // Auto select
      setSelectedPattern(res.data);
      setPatternItems({});
    } catch (err) {
      toast.error('Gagal membuat shift');
    }
  };

  const handleSaveItems = async () => {
    if (!selectedPattern) return;
    try {
      // Also save the pattern's startDate if it was updated in the UI
      await Promise.all([
        axios.post(`${API_URL}/patterns/${selectedPattern.id}/items`, {
          items: Object.entries(patternItems).map(([day, ttId]) => ({
            dayNumber: parseInt(day),
            timetableId: ttId ? parseInt(ttId as string) : null
          }))
        }),
        // Update general pattern info (startDate)
        axios.put(`${API_URL}/patterns/${selectedPattern.id}`, {
          name: selectedPattern.name,
          startDate: selectedPattern.startDate
        })
      ]);
      
      toast.success('Pengaturan shift berhasil disimpan');
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan jadwal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus shift ini? Seluruh urutan jam kerja di dalamnya akan ikut terhapus.")) return;
    try {
      await axios.delete(`${API_URL}/patterns/${id}`);
      toast.success('Shift dihapus');
      if (selectedPattern?.id === id) setSelectedPattern(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  const getDayLabel = (dayNum: number) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    // Logic: calculate day of week relative to startDate
    if (!selectedPattern?.startDate) return days[(dayNum - 1) % 7];
    
    const start = new Date(selectedPattern.startDate);
    // adjust to compensate for dayNum starting at 1
    const current = new Date(start);
    current.setDate(start.getDate() + (dayNum - 1));
    const dayIndex = current.getDay(); // 0 is Sunday
    const weekMap = [6, 0, 1, 2, 3, 4, 5]; // Map 0->Sunday (index 6 in our array)
    return days[weekMap[dayIndex]];
  };

  return (
    <div className="animate-in fade-in duration-700 h-full flex flex-col">
      <Toaster position="top-right" />
      
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Pengaturan Shift</h2>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Definisi rotasi mingguan dan siklus kerja</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="btn-mansaba px-8 py-3.5 !rounded-2xl shadow-xl shadow-primary/20"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Shift
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* LEFT: DAFTAR SHIFT */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Layers size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Shift</span>
          </div>
          
          <div className="table-wrapper flex-1 overflow-y-auto border border-slate-200/50 shadow-premium no-scrollbar">
            <table className="table-mansaba">
              <thead>
                <tr>
                  <th className="table-header">Nama Shift</th>
                  <th className="table-header text-center whitespace-nowrap">Tgl. Mulai</th>
                  <th className="table-header text-center">Periode</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => {
                      setSelectedPattern(p);
                      const itemsMap: any = {};
                      p.items.forEach((it: any) => itemsMap[it.dayNumber] = it.timetableId);
                      setPatternItems(itemsMap);
                    }}
                    className={`table-row cursor-pointer group ${selectedPattern?.id === p.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {selectedPattern?.id === p.id && <div className="w-1.5 h-6 bg-primary rounded-full -ml-6 absolute transition-all" />}
                        <div>
                          <p className="font-bold text-slate-700 text-sm leading-none mb-1">{p.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase">{p.category || 'UMUM'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-center text-[11px] font-bold text-slate-500 italic">
                      {p.startDate ? format(new Date(p.startDate), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="table-cell text-center">
                      <span className="px-2 py-0.5 bg-surface-100 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200/50">
                        {p.cycleDays >= 7 ? Math.floor(p.cycleDays / 7) : p.cycleDays} {p.cycleDays >= 7 ? 'Mgg' : 'Hr'}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditPattern(p); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95"
                      >
                        <Edit3 size={12} /> EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: PERIODE JAM KERJA */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode Jam Kerja</span>
            </div>
            {selectedPattern && (
              <button 
                onClick={handleSaveItems}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-[10px] font-bold uppercase rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
              >
                <Save size={12} /> Simpan Urutan
              </button>
            )}
          </div>

          <div className="flex-1 table-wrapper overflow-y-auto border border-slate-200/50 shadow-premium p-8 bg-white no-scrollbar">
            {selectedPattern ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-50">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedPattern.name}</h3>
                  <button 
                    onClick={() => handleDelete(selectedPattern.id)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* PROMINENT START DATE EDITOR */}
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
                         <Calendar size={28} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mulai Kalibrasi (Hari-1)</p>
                         <input 
                            type="date" 
                            className="bg-transparent text-xl font-black text-primary focus:outline-none cursor-pointer"
                            value={selectedPattern.startDate ? format(new Date(selectedPattern.startDate), 'yyyy-MM-dd') : ''}
                            onChange={e => setSelectedPattern({...selectedPattern, startDate: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                   <div className="text-center md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Durasi Siklus</p>
                      <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedPattern.cycleDays} Hari</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {Array.from({ length: selectedPattern.cycleDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSunday = getDayLabel(dayNum) === 'Minggu';
                    return (
                      <div key={dayNum} className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${isSunday ? 'bg-rose-50/40 border-rose-100/50' : 'bg-surface-50/50 border-slate-100 hover:border-primary/20'}`}>
                        <div className="w-24 shrink-0">
                          <p className={`text-[11px] font-bold ${isSunday ? 'text-rose-500' : 'text-slate-700'}`}>{getDayLabel(dayNum)}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Hari-{dayNum}</p>
                        </div>
                        
                        <div className="flex-1">
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%223%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat"
                            value={patternItems[dayNum] || ''}
                            onChange={(e) => setPatternItems({...patternItems, [dayNum]: e.target.value})}
                          >
                            <option value="">- LIBUR / OFF -</option>
                            {timetables.map(t => (
                              <option key={t.id} value={t.id}>[{t.category?.name || 'UMUM'}] {t.name} ({t.jamMasuk})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center opacity-30 text-center">
                <ChevronRight size={32} className="text-slate-400 mb-6" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih shift pada daftar kiri</h4>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDIT SHIFT */}
      {showEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowEdit(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <CloseIcon size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Edit Identitas Shift</h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-8 border-b border-slate-50 pb-6 uppercase tracking-widest">Ubah Tanggal Mulai atau Nama Shift</p>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Shift</label>
                <input className="input-mansaba w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Tgl. Mulai (Awal Hari-1)</label>
                <input type="date" className="input-mansaba w-full" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-mansaba w-full !py-4 shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SHIFT */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowAdd(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <CloseIcon size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Tambah Daftar Shift</h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-8 border-b border-slate-50 pb-6 uppercase tracking-widest">Definisi Siklus Kelompok Kerja</p>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Shift</label>
                <input className="input-mansaba w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: G1, Staf Normal, dll." required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Tgl. Mulai (Awal Hari-1)</label>
                <input type="date" className="input-mansaba w-full" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Nilai Periode</label>
                  <input type="number" className="input-mansaba w-full" value={formData.periode} onChange={e => setFormData({...formData, periode: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Unit Periode</label>
                  <select className="input-mansaba w-full" value={formData.unitPeriode} onChange={e => setFormData({...formData, unitPeriode: e.target.value})}>
                    <option value="Minggu">Minggu</option>
                    <option value="Hari">Hari</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-mansaba w-full !py-4 shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] font-bold">Simpan Shift Baru</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterPage;
