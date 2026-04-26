import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShiftsPage = () => {
  const [masters, setMasters] = useState<any[]>([]);
  const [activeMasterId, setActiveMasterId] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterStart, setNewMasterStart] = useState('');
  const [newMasterEnd, setNewMasterEnd] = useState('');
  const [newMasterActive, setNewMasterActive] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    startTime: '07:00',
    endTime: '14:30',
    lateTolerance: 0,
    earlyTolerance: 0,
    startScanIn: '06:00',
    endScanIn: '10:00',
    startScanOut: '13:00',
    endScanOut: '16:00',
    workDayValue: 1,
    workMinuteValue: 0,
    days: '1,2,3,4,5,6' 
  });

  const daysList = [
    { label: 'S', value: '1', name: 'Senin' },
    { label: 'S', value: '2', name: 'Selasa' },
    { label: 'R', value: '3', name: 'Rabu' },
    { label: 'K', value: '4', name: 'Kamis' },
    { label: 'J', value: '5', name: 'Jumat' },
    { label: 'S', value: '6', name: 'Sabtu' },
    { label: 'M', value: '0', name: 'Minggu' },
  ];

  const fetchMasters = async () => {
    const res = await axios.get('/api/master-schedules');
    setMasters(res.data);
    if (res.data.length > 0 && !activeMasterId) {
      setActiveMasterId(res.data[0].id);
    }
  };

  const fetchGroups = async () => {
    if (!activeMasterId) return;
    const res = await axios.get('/api/groups', { params: { masterId: activeMasterId } });
    setGroups(res.data);
  };

  const addMaster = async () => {
    if (!newMasterName) return;
    const res = await axios.post('/api/master-schedules', { 
      name: newMasterName,
      startDate: newMasterStart || null,
      endDate: newMasterEnd || null,
      isActive: newMasterActive
    });
    setNewMasterName('');
    setNewMasterStart('');
    setNewMasterEnd('');
    setNewMasterActive(false);
    fetchMasters();
    setActiveMasterId(res.data.id);
  };

  const toggleMasterActive = async (id: number, currentStatus: boolean, name: string) => {
    await axios.put(`/api/master-schedules/${id}`, { isActive: !currentStatus, name });
    fetchMasters();
  };

  const deleteMaster = async (id: number) => {
    if (window.confirm("Hapus seluruh folder jadwal ini beserta isinya?")) {
      await axios.delete(`/api/master-schedules/${id}`);
      if (activeMasterId === id) setActiveMasterId(null);
      fetchMasters();
    }
  };

  const addGroup = async () => {
    if (!newGroupName || !activeMasterId) return;
    await axios.post('/api/groups', { name: newGroupName, masterScheduleId: activeMasterId });
    setNewGroupName('');
    fetchGroups();
  };

  const handleEditShift = (shift: any, groupId: number) => {
    setEditingShiftId(shift.id);
    setActiveGroupId(groupId);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTolerance: shift.lateTolerance,
      earlyTolerance: shift.earlyTolerance,
      startScanIn: shift.startScanIn,
      endScanIn: shift.endScanIn,
      startScanOut: shift.startScanOut,
      endScanOut: shift.endScanOut,
      workDayValue: shift.workDayValue,
      workMinuteValue: shift.workMinuteValue,
      days: shift.days || '1,2,3,4,5,6'
    });
  };

  const addShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    setLoading(true);
    try {
      if (editingShiftId) {
        await axios.put(`/api/shifts/${editingShiftId}`, {
          ...form,
          lateTolerance: parseInt(String(form.lateTolerance)),
          earlyTolerance: parseInt(String(form.earlyTolerance)),
          workDayValue: parseFloat(String(form.workDayValue)),
          workMinuteValue: parseInt(String(form.workMinuteValue))
        });
      } else {
        await axios.post('/api/shifts', {
          ...form,
          groupId: activeGroupId,
          lateTolerance: parseInt(String(form.lateTolerance)),
          earlyTolerance: parseInt(String(form.earlyTolerance)),
          workDayValue: parseFloat(String(form.workDayValue)),
          workMinuteValue: parseInt(String(form.workMinuteValue))
        });
      }
      fetchGroups();
      setActiveGroupId(null);
      setEditingShiftId(null);
    } catch (err) { alert("Gagal menyimpan"); }
    setLoading(false);
  };

  const toggleDay = (val: string) => {
    const current = form.days.split(',').filter(d => d !== '');
    let next;
    if (current.includes(val)) next = current.filter(d => d !== val);
    else next = [...current, val];
    setForm({ ...form, days: next.sort().join(',') });
  };

  useEffect(() => { fetchMasters(); }, []);
  useEffect(() => { fetchGroups(); }, [activeMasterId]);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100">
         <div className="flex flex-col">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Aturan Shift Kerja</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Definisikan jam masuk, pulang, dan rentang scan mesin</p>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 border-r border-slate-100 pr-6">
            <div className="space-y-3 mb-10 overflow-y-auto max-h-[60vh] no-scrollbar px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Kategori Master</h3>
              {masters.map(m => (
                <div key={m.id} className="relative group">
                    <button 
                    onClick={() => setActiveMasterId(m.id)}
                    className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-xs flex flex-col gap-1 ${activeMasterId === m.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent bg-white shadow-sm'}`}
                    >
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                      {m.name}
                    </div>
                    {m.startDate && (
                      <span className={`text-[8px] font-black opacity-70 ml-6 ${activeMasterId === m.id ? 'text-white' : 'text-slate-400'}`}>
                        {new Date(m.startDate).toLocaleDateString()} — {new Date(m.endDate).toLocaleDateString()}
                      </span>
                    )}
                    </button>
                    <div className="absolute right-2 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); toggleMasterActive(m.id, m.isActive, m.name); }} className={`p-1.5 rounded-lg ${activeMasterId === m.id ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'}`}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteMaster(m.id); }} className={`p-1.5 rounded-lg ${activeMasterId === m.id ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'}`}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
              ))}
           </div>

           <div className="p-6 bg-surface-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Buat Baru</p>
              <input className="input-mansaba w-full mb-3 bg-white !text-xs" placeholder="Nama..." value={newMasterName} onChange={e => setNewMasterName(e.target.value)} />
              <button onClick={addMaster} className="w-full btn-mansaba !py-2.5 !text-[9px] uppercase tracking-widest font-black">Simpan Master</button>
           </div>
        </div>

        <div className="lg:col-span-3">
           {!activeMasterId ? (
             <div className="h-96 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Pilih Kategori Jadwal</p>
             </div>
           ) : (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="bg-surface-100 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border border-slate-200/50 shadow-inner">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                       <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">Kontainer: {masters.find(m => m.id === activeMasterId)?.name}</h4>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <input className="input-mansaba flex-1 sm:w-44 bg-white" placeholder="Nama Kontainer..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                       <button onClick={addGroup} className="btn-mansaba !py-2 !text-[10px] uppercase tracking-widest">+ Grup</button>
                    </div>
                 </div>

                <div className="space-y-12">
                  {groups.map(group => (
                    <div key={group.id} className="card-mansaba !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/20">
                       <div className="px-8 py-5 bg-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
                             <h4 className="text-white font-black text-[11px] uppercase tracking-[0.2em]">{group.name}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                             <button onClick={() => { setEditingShiftId(null); setForm({ name: '', startTime: '07:00', endTime: '14:30', lateTolerance: 0, earlyTolerance: 0, startScanIn: '06:00', endScanIn: '10:00', startScanOut: '13:00', endScanOut: '16:00', workDayValue: 1, workMinuteValue: 0, days: '1,2,3,4,5,6' }); setActiveGroupId(group.id); }} className="text-[10px] font-black tracking-widest text-primary bg-white px-5 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all uppercase">Tambah Jadwal</button>
                             <button onClick={async () => { if (window.confirm("Hapus kontainer?")) { await axios.delete(`/api/groups/${group.id}`); fetchGroups(); } }} className="text-white/20 hover:text-rose-500 transition-colors p-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>
                          </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-slate-50">
                                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Jadwal / Shift</th>
                                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Hari Aktif</th>
                                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Waktu Utama</th>
                                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Scan In</th>
                                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Scan Out</th>
                                  <th className="px-8 py-4 text-right border-b border-slate-100"></th>
                               </tr>
                            </thead>
                            <tbody>
                               {group.shifts.map((s:any) => (
                                 <tr key={s.id} className="hover:bg-slate-50 transition-colors group/row cursor-pointer" onClick={() => handleEditShift(s, group.id)}>
                                    <td className="px-8 py-5 border-b border-slate-50">
                                       <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{s.name}</span>
                                    </td>
                                    <td className="px-8 py-5 border-b border-slate-50">
                                       <div className="flex gap-1">
                                          {daysList.map(d => (
                                            <div key={d.value} className={`w-4 h-4 rounded-[4px] flex items-center justify-center text-[7px] font-black ${s.days?.includes(d.value) ? 'bg-primary text-white' : 'text-slate-200 border border-slate-100'}`}>
                                               {d.label}
                                            </div>
                                          ))}
                                       </div>
                                    </td>
                                    <td className="px-8 py-5 border-b border-slate-50">
                                       <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                          <span className="text-xs font-black text-slate-600">{s.startTime} — {s.endTime}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-5 border-b border-slate-50">
                                       <span className="text-[10px] font-bold text-slate-400">{s.startScanIn} - {s.endScanIn}</span>
                                    </td>
                                    <td className="px-8 py-5 border-b border-slate-50">
                                       <span className="text-[10px] font-bold text-slate-400">{s.startScanOut} - {s.endScanOut}</span>
                                    </td>
                                    <td className="px-8 py-5 border-b border-slate-50 text-right">
                                       <button onClick={async (e) => { e.stopPropagation(); if (window.confirm("Hapus shift?")) { await axios.delete(`/api/shifts/${s.id}`); fetchGroups(); } }} className="text-slate-100 group-hover/row:text-rose-500 transition-all p-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                                    </td>
                                 </tr>
                               ))}
                               {group.shifts.length === 0 && (
                                 <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[9px] italic opacity-40">Belum ada data</td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>

      {activeGroupId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative border border-white/20">
            <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{editingShiftId ? 'Edit Konfigurasi' : 'Konfigurasi Baru'}</h3>
            <p className="text-[10px] font-black text-slate-400 mb-10 border-b border-slate-50 pb-6 uppercase tracking-widest">Grup: {groups.find(g => g.id === activeGroupId)?.name}</p>
            
            <form onSubmit={addShift} className="space-y-10">
              <div className="bg-surface-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center mb-6">Hari Operasional Active</label>
                <div className="flex justify-center gap-2.5">
                   {daysList.map(d => (
                     <button key={d.value} type="button" onClick={() => toggleDay(d.value)} className={`w-10 h-10 rounded-2xl font-black transition-all duration-300 ${form.days.split(',').includes(d.value) ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white text-slate-300 border border-slate-200 hover:border-primary/30'}`}>{d.label}</button>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Identitas</label>
                        <input className="input-mansaba w-full !py-4 font-black" placeholder="Contoh: Senin - Kamis" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-3 px-1">Jam Masuk</label>
                            <input className="input-mansaba w-full text-center font-mono !py-4 !text-base" type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 px-1">Jam Pulang</label>
                            <input className="input-mansaba w-full text-center font-mono !py-4 !text-base" type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-surface-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner space-y-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Rentang Scan</p>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="time" className="input-mansaba w-full !bg-white text-center !py-3 !text-xs" value={form.startScanIn} onChange={e => setForm({...form, startScanIn: e.target.value})} />
                            <input type="time" className="input-mansaba w-full !bg-white text-center !py-3 !text-xs" value={form.endScanIn} onChange={e => setForm({...form, endScanIn: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="time" className="input-mansaba w-full !bg-white text-center !py-3 !text-xs" value={form.startScanOut} onChange={e => setForm({...form, startScanOut: e.target.value})} />
                            <input type="time" className="input-mansaba w-full !bg-white text-center !py-3 !text-xs" value={form.endScanOut} onChange={e => setForm({...form, endScanOut: e.target.value})} />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-10 border-t border-slate-50">
                <button type="button" onClick={() => { setActiveGroupId(null); setEditingShiftId(null); }} className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={loading} className="flex-[3] btn-mansaba !py-5 rounded-[2rem] shadow-2xl shadow-primary/30 uppercase tracking-[0.3em] font-black">{editingShiftId ? 'Simpan Perubahan' : 'Daftarkan Jadwal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsPage;
