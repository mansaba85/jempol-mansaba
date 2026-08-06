import React, { useState, useEffect, useMemo } from 'react';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWeekTab, setActiveWeekTab] = useState<number>(0); // 0 = Semua, 1 = Minggu 1, 2 = Minggu 2, etc.
  
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [quickFillTtId, setQuickFillTtId] = useState<string>('');

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
      const patternData = Array.isArray(resP.data) ? resP.data : [];
      setPatterns(patternData);
      setTimetables(Array.isArray(resT.data) ? resT.data : []);

      // Auto-select first pattern if none selected
      if (patternData.length > 0 && !selectedPattern) {
        selectPattern(patternData[0]);
      } else if (selectedPattern) {
        const refreshed = patternData.find((p: any) => p.id === selectedPattern.id);
        if (refreshed) {
          selectPattern(refreshed);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data dari server');
    } finally {
      setLoading(false);
    }
  };

  const selectPattern = (p: any) => {
    setSelectedPattern(p);
    const itemsMap: any = {};
    if (p.items) {
      p.items.forEach((it: any) => itemsMap[it.dayNumber] = String(it.timetableId));
    }
    setPatternItems(itemsMap);
    setHasUnsavedChanges(false);
    setActiveWeekTab(0);
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
    const periVal = p.cycleDays >= 7 && p.cycleDays % 7 === 0 ? Math.floor(p.cycleDays / 7) : p.cycleDays;
    const unitVal = p.cycleDays >= 7 && p.cycleDays % 7 === 0 ? 'Minggu' : 'Hari';
    
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
        cycleDays: cycleDays,
        category: formData.category
      });
      toast.success('Pola shift diperbarui');
      setShowEdit(false);
      fetchData();
      if (selectedPattern?.id === formData.id) {
        setSelectedPattern({...selectedPattern, name: formData.name, startDate: formData.startDate, cycleDays, category: formData.category});
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
      selectPattern(res.data);
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
      toast.success('Urutan shift harian berhasil disimpan!');
      setHasUnsavedChanges(false);
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
      if (selectedPattern?.id === id) {
        const remaining = patterns.filter(p => p.id !== id);
        if (remaining.length > 0) selectPattern(remaining[0]);
        else {
          setSelectedPattern(null);
          setPatternItems({});
        }
      }
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus pola');
    }
  };

  const getDayLabel = (dayNum: number) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[(dayNum - 1) % 7];
  };

  const handleItemChange = (dayNum: number, value: string) => {
    setPatternItems((prev: any) => ({
      ...prev,
      [dayNum]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Quick Batch Fill Actions
  const applyQuickBatch = (type: string, timetableId?: string) => {
    if (!selectedPattern) return;
    const totalDays = selectedPattern.cycleDays || 7;
    const newItems = { ...patternItems };

    for (let i = 1; i <= totalDays; i++) {
      const dayLabel = getDayLabel(i);
      if (type === 'workdays') {
        // Senin s/d Sabtu
        if (dayLabel !== 'Minggu') {
          if (timetableId) newItems[i] = timetableId;
        } else {
          newItems[i] = ''; // Minggu libur
        }
      } else if (type === 'mon_thu') {
        // Senin s/d Kamis
        if (['Senin', 'Selasa', 'Rabu', 'Kamis'].includes(dayLabel) && timetableId) {
          newItems[i] = timetableId;
        }
      } else if (type === 'sunday_off') {
        if (dayLabel === 'Minggu') newItems[i] = '';
      } else if (type === 'clear_all') {
        newItems[i] = '';
      } else if (type === 'copy_week_1' && i > 7) {
        const sourceDay = ((i - 1) % 7) + 1;
        newItems[i] = newItems[sourceDay] || '';
      }
    }

    setPatternItems(newItems);
    setHasUnsavedChanges(true);
    setShowQuickFill(false);
    toast.success('Pola shift berhasil diisi otomatis!');
  };

  // Filtered patterns by search query
  const filteredPatterns = useMemo(() => {
    return patterns.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [patterns, searchQuery]);

  // Weeks breakdown for multi-week cycles
  const totalWeeks = useMemo(() => {
    if (!selectedPattern?.cycleDays) return 1;
    return Math.ceil(selectedPattern.cycleDays / 7);
  }, [selectedPattern]);

  // Timetable map for quick lookup
  const timetableMap = useMemo(() => {
    const map = new Map();
    timetables.forEach(t => map.set(String(t.id), t));
    return map;
  }, [timetables]);

  return (
    <div className="space-y-5 font-outfit">
      <Toaster position="top-right" />
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <i className="fa-solid fa-rotate text-sm"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pola Rotasi Kerja</h2>
              <p className="text-xs text-slate-500 font-medium">Pengaturan Siklus & Jam Kerja Roster Pegawai</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setFormData({ id: null, name: '', startDate: format(new Date(), 'yyyy-MM-dd'), periode: '1', unitPeriode: 'Minggu', category: 'Guru' });
              setShowAdd(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-plus text-xs"></i> Tambah Pola Rotasi
          </button>
        </div>
      </header>

      {/* MAIN CONTENT: 2-COLUMN BALANCED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: MASTER PATTERNS (COMPACT & SEARCHABLE) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Header & Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Pola</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {filteredPatterns.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Klik untuk edit susunan</span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pola rotasi..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Scrollable Compact Pattern List */}
            <div className="space-y-2 max-h-[calc(100vh-280px)] min-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredPatterns.map(p => {
                const isSelected = selectedPattern?.id === p.id;
                const assignedDays = p.items ? p.items.filter((it: any) => it.timetableId).length : 0;
                const weeksCount = p.cycleDays >= 7 && p.cycleDays % 7 === 0 ? p.cycleDays / 7 : null;

                return (
                  <div 
                    key={p.id}
                    onClick={() => selectPattern(p)}
                    className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/20' 
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                          isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                        }`}>
                          <i className="fa-solid fa-rotate text-xs"></i>
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {p.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500">
                              {p.cycleDays} Hari {weeksCount ? `(${weeksCount} Mgg)` : ''}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className={`text-[10px] font-semibold ${assignedDays > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {assignedDays} Shift Terisi
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditPattern(p); }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white flex items-center justify-center transition-colors border border-transparent hover:border-slate-200"
                          title="Edit Info Pola"
                        >
                          <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPatterns.length === 0 && !loading && (
                <div className="text-center py-10 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <i className="fa-solid fa-filter-circle-xmark text-2xl mb-2 opacity-40"></i>
                  <p className="text-xs font-semibold">Pola rotasi tidak ditemukan</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Coba kata kunci pencarian lain</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE SHIFT SEQUENCE MATRIX */}
        <div className="lg:col-span-8">
          {selectedPattern ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Pattern Header Card */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{selectedPattern.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100/80 text-blue-700 rounded-md">
                        {selectedPattern.cycleDays} Hari Siklus
                      </span>
                      {hasUnsavedChanges && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md animate-pulse">
                          ● Belum Disimpan
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Mulai Siklus: <span className="font-semibold text-slate-700">{safeFormat(selectedPattern.startDate, 'dd MMMM yyyy')}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowQuickFill(!showQuickFill)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Pengisian Cepat Batch"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-blue-600 text-xs"></i>
                      <span>Isi Otomatis</span>
                    </button>

                    <button 
                      onClick={handleSaveItems} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                        hasUnsavedChanges 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 ring-2 ring-blue-500/50 active:scale-95' 
                          : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/10'
                      }`}
                    >
                      <i className="fa-solid fa-floppy-disk text-xs"></i>
                      <span>Simpan Susunan</span>
                    </button>

                    <button 
                      onClick={() => handleDelete(selectedPattern.id)} 
                      className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer" 
                      title="Hapus Pola"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Quick Batch Fill Drawer */}
                {showQuickFill && (
                  <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <i className="fa-solid fa-bolt text-amber-500"></i> Alat Pengisian Cepat Shift
                      </span>
                      <button onClick={() => setShowQuickFill(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Pilih Jam Kerja Default:
                        </label>
                        <select 
                          value={quickFillTtId}
                          onChange={e => setQuickFillTtId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">-- Pilih Jam Kerja --</option>
                          {timetables.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.jamMasuk} - {t.jamPulang})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-4 sm:pt-0">
                        <button 
                          disabled={!quickFillTtId}
                          onClick={() => applyQuickBatch('workdays', quickFillTtId)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Senin - Sabtu
                        </button>
                        <button 
                          disabled={!quickFillTtId}
                          onClick={() => applyQuickBatch('mon_thu', quickFillTtId)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Senin - Kamis
                        </button>
                        <button 
                          onClick={() => applyQuickBatch('sunday_off')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Set Minggu Libur
                        </button>
                        {totalWeeks > 1 && (
                          <button 
                            onClick={() => applyQuickBatch('copy_week_1')}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-all"
                          >
                            Salin Mgg 1 ke Mgg 2/3
                          </button>
                        )}
                        <button 
                          onClick={() => applyQuickBatch('clear_all')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Reset Semua Libur
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Week Tabs for Multi-week Cycles (14/21/28 days) */}
                {totalWeeks > 1 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 overflow-x-auto pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
                      Tampilan Minggu:
                    </span>
                    <button
                      onClick={() => setActiveWeekTab(0)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                        activeWeekTab === 0
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Semua Hari ({selectedPattern.cycleDays})
                    </button>
                    {Array.from({ length: totalWeeks }).map((_, wIdx) => {
                      const weekNum = wIdx + 1;
                      const startDay = (weekNum - 1) * 7 + 1;
                      const endDay = Math.min(weekNum * 7, selectedPattern.cycleDays);

                      return (
                        <button
                          key={weekNum}
                          onClick={() => setActiveWeekTab(weekNum)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                            activeWeekTab === weekNum
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Minggu {weekNum} (H{startDay}-{endDay})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Day Cards Matrix (High-Density Responsive Grid) */}
              <div className="p-5 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: Math.min(selectedPattern.cycleDays || 0, 100) }).map((_, i) => {
                    const dayNum = i + 1;
                    const weekOfThisDay = Math.ceil(dayNum / 7);

                    // If a specific week tab is active, filter other weeks
                    if (activeWeekTab !== 0 && weekOfThisDay !== activeWeekTab) {
                      return null;
                    }

                    const label = getDayLabel(dayNum);
                    const isSunday = label === 'Minggu';
                    const selectedTtId = patternItems[dayNum] || '';
                    const selectedTt = selectedTtId ? timetableMap.get(String(selectedTtId)) : null;

                    return (
                      <div 
                        key={dayNum} 
                        className={`p-3.5 rounded-xl border transition-all duration-150 ${
                          isSunday 
                            ? 'bg-rose-50/25 border-rose-200/70 hover:border-rose-300' 
                            : selectedTt 
                              ? 'bg-white border-blue-200/80 hover:border-blue-300 shadow-xs' 
                              : 'bg-slate-50/60 border-slate-200/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                              Day {dayNum}
                            </span>
                            <span className={`text-xs font-bold ${isSunday ? 'text-rose-600' : 'text-slate-800'}`}>
                              {label}
                            </span>
                          </div>

                          <div>
                            {selectedTt ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md">
                                {selectedTt.jamMasuk} - {selectedTt.jamPulang}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isSunday ? 'bg-rose-100/60 text-rose-600' : 'bg-slate-200/60 text-slate-500'}`}>
                                Libur / Off
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timetable Dropdown */}
                        <div className="relative">
                          <select 
                            className={`w-full border rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer ${
                              selectedTt 
                                ? 'bg-blue-50/40 border-blue-200 text-slate-800' 
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                            value={selectedTtId}
                            onChange={(e) => handleItemChange(dayNum, e.target.value)}
                          >
                            <option value="">-- LIBUR / LEPAS DINAS --</option>
                            {timetables.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.jamMasuk} - {t.jamPulang})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Sticky Save Bar (if unsaved) */}
              {hasUnsavedChanges && (
                <div className="p-3.5 bg-blue-50 border-t border-blue-200 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <i className="fa-solid fa-circle-exclamation text-blue-600"></i>
                    <span>Ada perubahan susunan yang belum disimpan!</span>
                  </div>
                  <button 
                    onClick={handleSaveItems}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Simpan Sekarang
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-lg">
                <i className="fa-solid fa-arrow-left"></i>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Pilih Pola Rotasi</p>
                <p className="text-xs text-slate-400 mt-1">Pilih salah satu pola di sebelah kiri untuk mengatur susunan jam kerja harian.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ADD / EDIT PATTERN */}
      {(showAdd || showEdit) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <i className={showEdit ? "fa-solid fa-pen-to-square" : "fa-solid fa-plus"}></i>
                </div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  {showEdit ? 'Edit Pola Rotasi' : 'Tambah Pola Rotasi Baru'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAdd(false); setShowEdit(false); }} 
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nama Pola Rotasi</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Guru, Penjaga_pagi, Shift Security" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tanggal Mulai Siklus</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Durasi Siklus</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-outfit" 
                    value={formData.periode} 
                    onChange={e => setFormData({...formData, periode: e.target.value})} 
                    required 
                    min="1" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Satuan</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" 
                    value={formData.unitPeriode} 
                    onChange={e => setFormData({...formData, unitPeriode: e.target.value})}
                  >
                    <option value="Minggu">Minggu (x 7 Hari)</option>
                    <option value="Hari">Hari</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setShowAdd(false); setShowEdit(false); }} 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  {showEdit ? 'Simpan Perubahan' : 'Buat Pola'}
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

