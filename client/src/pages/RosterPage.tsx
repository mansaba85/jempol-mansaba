import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = '/api';

const RosterPage = () => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [patternItems, setPatternItems] = useState<any>({});
  
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
        cycleDays: cycleDays
      });
      toast.success('Pola shift diperbarui');
      setShowEdit(false);
      fetchData();
      if (selectedPattern?.id === formData.id) {
        setSelectedPattern({...selectedPattern, name: formData.name, startDate: formData.startDate, cycleDays});
      }
    } catch (err) {
      toast.error('Gagal update pola shift');
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
      toast.success('Pola shift baru dibuat');
      setShowAdd(false);
      setFormData({ ...formData, name: '', startDate: format(new Date(), 'yyyy-MM-dd') });
      fetchData();
      setSelectedPattern(res.data);
      setPatternItems({});
    } catch (err) {
      toast.error('Gagal membuat pola shift');
    }
  };

  const handleSaveItems = async () => {
    if (!selectedPattern) return;
    try {
      await axios.post(`${API_URL}/patterns/${selectedPattern.id}/items`, {
        items: Object.entries(patternItems).map(([day, ttId]) => ({
          dayNumber: parseInt(day),
          timetableId: ttId ? parseInt(ttId as string) : null
        }))
      });
      toast.success('Urutan shift harian tersimpan');
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan jadwal harian');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus pola shift ini secara permanen?")) return;
    try {
      await axios.delete(`${API_URL}/patterns/${id}`);
      toast.success('Pola shift dihapus');
      if (selectedPattern?.id === id) setSelectedPattern(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus pola');
    }
  };

  const getDayLabel = (dayNum: number) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[(dayNum - 1) % 7];
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Pola Rotasi Kerja</h2>
           <p className="text-sm text-slate-500 mt-1">Konfigurasi urutan shift harian dan siklus kerja pegawai.</p>
        </div>
        <button 
           onClick={() => setShowAdd(true)}
           className="mansaba-btn-primary"
        >
           <i className="fa-solid fa-plus"></i> Tambah Pola Rotasi
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: LIST OF PATTERNS */}
        <div className="xl:col-span-4 space-y-4">
           <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-slate-700">Daftar Pola Rotasi</span>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">{patterns.length} Pola</span>
           </div>
           
           <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {patterns.map(p => (
                 <div 
                    key={p.id}
                    onClick={() => {
                        setSelectedPattern(p);
                        const itemsMap: any = {};
                        p.items.forEach((it: any) => itemsMap[it.dayNumber] = it.timetableId);
                        setPatternItems(itemsMap);
                    }}
                    className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors shadow-sm ${selectedPattern?.id === p.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${selectedPattern?.id === p.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                             <i className="fa-solid fa-rotate"></i>
                          </div>
                          <div>
                             <h4 className="text-sm font-semibold text-slate-800">{p.name}</h4>
                             <p className="text-xs text-slate-500 mt-0.5">Siklus: {p.cycleDays} Hari</p>
                          </div>
                       </div>
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleEditPattern(p); }}
                          className="w-8 h-8 rounded text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                       >
                          <i className="fa-solid fa-pen-to-square"></i>
                       </button>
                    </div>
                 </div>
              ))}
              {patterns.length === 0 && !loading && (
                 <div className="text-center py-10 bg-white border border-slate-200 rounded-lg text-slate-500 text-sm">
                    Belum ada pola rotasi yang terdaftar.
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT: URUTAN JAM KERJA */}
        <div className="xl:col-span-8">
           {selectedPattern ? (
              <div className="mansaba-card">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                       <h3 className="text-lg font-semibold text-slate-800">{selectedPattern.name}</h3>
                       <p className="text-sm text-slate-500 mt-1">Siklus {selectedPattern.cycleDays} hari, mulai dari {selectedPattern.startDate ? format(new Date(selectedPattern.startDate), 'dd MMMM yyyy') : '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={handleSaveItems} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                          Simpan Susunan
                       </button>
                       <button onClick={() => handleDelete(selectedPattern.id)} className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center" title="Hapus Pola">
                          <i className="fa-solid fa-trash-can"></i>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-t-lg text-xs font-semibold text-slate-600">
                       <div className="col-span-2">Hari Ke-</div>
                       <div className="col-span-4">Hari Asumsi</div>
                       <div className="col-span-6">Penetapan Jadwal</div>
                    </div>
                    {Array.from({ length: selectedPattern.cycleDays }).map((_, i) => {
                       const dayNum = i + 1;
                       const label = getDayLabel(dayNum);
                       const isSunday = label === 'Minggu';
                       
                       return (
                          <div key={dayNum} className={`grid grid-cols-12 gap-4 items-center px-4 py-3 border border-slate-200 rounded text-sm transition-colors ${isSunday ? 'bg-rose-50/30' : 'bg-white hover:bg-slate-50'}`}>
                             <div className="col-span-2 font-medium text-slate-700">Hari {dayNum}</div>
                             <div className={`col-span-4 font-medium ${isSunday ? 'text-rose-600' : 'text-slate-600'}`}>{label}</div>
                             <div className="col-span-6">
                                <select 
                                   className="mansaba-input !py-1.5 w-full text-sm"
                                   value={patternItems[dayNum] || ''}
                                   onChange={(e) => setPatternItems({...patternItems, [dayNum]: e.target.value})}
                                >
                                   <option value="">-- Libur / Lepas Dinas --</option>
                                   {timetables.map(t => (
                                      <option key={t.id} value={t.id}>{t.name} ({t.jamMasuk} - {t.jamPulang})</option>
                                   ))}
                                </select>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
           ) : (
              <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-3">
                 <i className="fa-solid fa-arrow-left text-2xl"></i>
                 <p className="text-sm font-medium">Pilih pola rotasi dari daftar di sebelah kiri untuk melihat susunan hariannya.</p>
              </div>
           )}
        </div>
      </div>

      {/* MODAL ADD/EDIT */}
      {(showAdd || showEdit) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
               <button onClick={() => { setShowAdd(false); setShowEdit(false); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
               </button>
               
               <h3 className="text-lg font-semibold text-slate-800 mb-6">{showEdit ? 'Edit Pola Rotasi' : 'Pola Rotasi Baru'}</h3>
               
               <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-sm font-medium text-slate-600">Nama Pola Rotasi <span className="text-rose-500">*</span></label>
                     <input className="mansaba-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Rotasi Security A" required />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-sm font-medium text-slate-600">Tanggal Mulai (Hari 1) <span className="text-rose-500">*</span></label>
                     <input type="date" className="mansaba-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Jumlah Siklus <span className="text-rose-500">*</span></label>
                        <input type="number" className="mansaba-input" value={formData.periode} onChange={e => setFormData({...formData, periode: e.target.value})} required min="1" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Satuan Siklus</label>
                        <select className="mansaba-input" value={formData.unitPeriode} onChange={e => setFormData({...formData, unitPeriode: e.target.value})}>
                           <option value="Minggu">Minggu (x7 Hari)</option>
                           <option value="Hari">Hari</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={() => { setShowAdd(false); setShowEdit(false); }} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                     <button type="submit" className="mansaba-btn-primary px-6">
                        {showEdit ? 'Simpan Pola' : 'Buat Pola'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default RosterPage;
