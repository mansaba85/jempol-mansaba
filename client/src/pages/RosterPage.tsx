import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

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
      setPatterns(Array.isArray(resP.data) ? resP.data : []);
      setTimetables(Array.isArray(resT.data) ? resT.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data dari server');
    } finally {
      setLoading(false);
    }
  };

  const safeFormat = (dateStr: any, pattern: string) => {
    try {
      if (!dateStr) return '-';
      return format(new Date(dateStr), pattern);
    } catch (e) {
      return '-';
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
      setFormData({ ...formData, name: '', startDate: format(new Date(), 'yyyy-MM-dd'), periode: '1', unitPeriode: 'Minggu', category: 'Guru', id: null });
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
    <div className="space-y-6 font-outfit">
      <Toaster />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Pola Rotasi Kerja</h2>
           <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-semibold text-[10px]">Work Cycle & Rotation Config</p>
        </div>
        <button 
           onClick={() => setShowAdd(true)}
           className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
           <i className="fa-solid fa-plus text-[12px]"></i> Tambah Pola Rotasi
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: LIST OF PATTERNS */}
        <div className="xl:col-span-4 space-y-4">
           <div className="flex items-center justify-between bg-white px-5 py-4 border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Master Patterns</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{patterns.length} Pola</span>
           </div>
           
           <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {patterns.map(p => (
                 <div 
                    key={p.id}
                    onClick={() => {
                        setSelectedPattern(p);
                        const itemsMap: any = {};
                        if (p.items) {
                            p.items.forEach((it: any) => itemsMap[it.dayNumber] = it.timetableId);
                        }
                        setPatternItems(itemsMap);
                    }}
                    className={`bg-white border rounded-[1.5rem] p-5 cursor-pointer transition-all duration-300 shadow-sm grow-hover ${selectedPattern?.id === p.id ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-slate-200 hover:border-blue-300'}`}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${selectedPattern?.id === p.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                             <i className="fa-solid fa-rotate"></i>
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Cycle: {p.cycleDays} Days</p>
                          </div>
                       </div>
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleEditPattern(p); }}
                          className="w-10 h-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center"
                       >
                          <i className="fa-solid fa-pen-to-square"></i>
                       </button>
                    </div>
                 </div>
              ))}
              {patterns.length === 0 && !loading && (
                 <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 mt-4">
                    <i className="fa-solid fa-ghost text-4xl mb-4 opacity-20"></i>
                    <p className="text-xs font-bold uppercase tracking-widest">No rotation patterns found.</p>
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT: URUTAN JAM KERJA */}
        <div className="xl:col-span-8">
           {selectedPattern ? (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                 
                 <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-8">
                    <div>
                       <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedPattern.name}</h3>
                       <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-[0.1em]">
                          Siklus {selectedPattern.cycleDays} hari • Mulai: {safeFormat(selectedPattern.startDate, 'dd MMMM yyyy')}
                       </p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={handleSaveItems} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                          SIMPAN SUSUNAN
                       </button>
                       <button onClick={() => handleDelete(selectedPattern.id)} className="w-12 h-12 rounded-2xl border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center" title="Hapus Pola">
                          <i className="fa-solid fa-trash-can"></i>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <div className="col-span-2">Seq.</div>
                       <div className="col-span-4">Assumed Day</div>
                       <div className="col-span-6">Target Timetable</div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                       {Array.from({ length: Math.min(selectedPattern.cycleDays || 0, 100) }).map((_, i) => {
                          const dayNum = i + 1;
                          const label = getDayLabel(dayNum);
                          const isSunday = label === 'Minggu';
                          
                          return (
                             <div key={dayNum} className={`grid grid-cols-12 gap-4 items-center px-6 py-4 border rounded-[1.5rem] text-sm transition-all ${isSunday ? 'bg-rose-50/20 border-rose-100' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5'}`}>
                                <div className="col-span-2 font-bold text-slate-400">Day {dayNum}</div>
                                <div className={`col-span-4 font-bold ${isSunday ? 'text-rose-500' : 'text-slate-700'}`}>{label}</div>
                                <div className="col-span-6">
                                   <select 
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                      value={patternItems[dayNum] || ''}
                                      onChange={(e) => setPatternItems({...patternItems, [dayNum]: e.target.value})}
                                   >
                                      <option value="">-- LIBUR / LEPAS DINAS --</option>
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
              </div>
           ) : (
              <div className="h-[500px] border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-6">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center animate-bounce">
                    <i className="fa-solid fa-arrow-left text-4xl"></i>
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Select Rotation Pattern</p>
                    <p className="text-xs mt-2 text-slate-400">Choose a pattern from the left to configure daily shifts.</p>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* MODAL ADD/EDIT */}
      {(showAdd || showEdit) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
               
               <button onClick={() => { setShowAdd(false); setShowEdit(false); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors">
                  <i className="fa-solid fa-xmark text-2xl"></i>
               </button>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-8 tracking-tight">{showEdit ? 'Update Pattern' : 'Create Pattern'}</h3>
               
               <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pattern Designation</label>
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rotation Security" required />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label>
                     <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Interval Days</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-outfit" value={formData.periode} onChange={e => setFormData({...formData, periode: e.target.value})} required min="1" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none" value={formData.unitPeriode} onChange={e => setFormData({...formData, unitPeriode: e.target.value})}>
                           <option value="Minggu">Weeks</option>
                           <option value="Hari">Days</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={() => { setShowAdd(false); setShowEdit(false); }} className="px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">CANCEL</button>
                     <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-black active:scale-[0.98] transition-all">
                        {showEdit ? 'SAVE CHANGES' : 'INITIALIZE PATTERN'}
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
