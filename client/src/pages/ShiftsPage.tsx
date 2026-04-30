import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

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
    { label: 'Sen', value: '1', name: 'Senin' },
    { label: 'Sel', value: '2', name: 'Selasa' },
    { label: 'Rab', value: '3', name: 'Rabu' },
    { label: 'Kam', value: '4', name: 'Kamis' },
    { label: 'Jum', value: '5', name: 'Jumat' },
    { label: 'Sab', value: '6', name: 'Sabtu' },
    { label: 'Min', value: '0', name: 'Minggu' },
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
    toast.success('Pola shift berhasil dibuat');
    fetchMasters();
    setActiveMasterId(res.data.id);
  };

  const deleteMaster = async (id: number) => {
    if (window.confirm("Yakin ingin menghapus pola shift ini beserta semua grup di dalamnya?")) {
      await axios.delete(`/api/master-schedules/${id}`);
      if (activeMasterId === id) setActiveMasterId(null);
      toast.success('Pola shift dihapus');
      fetchMasters();
    }
  };

  const addGroup = async () => {
    if (!newGroupName || !activeMasterId) return;
    await axios.post('/api/groups', { name: newGroupName, masterScheduleId: activeMasterId });
    setNewGroupName('');
    toast.success('Grup shift berhasil ditambahkan');
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
        toast.success("Shift berhasil diperbarui");
      } else {
        await axios.post('/api/shifts', {
          ...form,
          groupId: activeGroupId,
          lateTolerance: parseInt(String(form.lateTolerance)),
          earlyTolerance: parseInt(String(form.earlyTolerance)),
          workDayValue: parseFloat(String(form.workDayValue)),
          workMinuteValue: parseInt(String(form.workMinuteValue))
        });
        toast.success("Shift berhasil ditambahkan");
      }
      fetchGroups();
      setActiveGroupId(null);
      setEditingShiftId(null);
    } catch (err) { toast.error("Gagal menyimpan shift."); }
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
    <div className="space-y-6">
      <Toaster />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-semibold text-slate-800">Pola & Rolling Shift</h2>
            <p className="text-sm text-slate-500 mt-1">Konfigurasi jadwal kerja bergulir dan pembagian grup.</p>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR: MASTERS */}
        <div className="lg:col-span-1 space-y-6">
            <div className="mansaba-card space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 px-2">Master Pola Shift</h3>
              
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {masters.map(m => (
                  <div key={m.id} className="relative group">
                      <button 
                        onClick={() => setActiveMasterId(m.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-between ${activeMasterId === m.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <i className={`fa-solid fa-calendar-days ${activeMasterId === m.id ? 'text-blue-500' : 'text-slate-400'}`}></i>
                          <span className="truncate max-w-[120px]">{m.name}</span>
                        </div>
                      </button>
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-white shadow-sm border border-slate-200 rounded p-1">
                          <button onClick={(e) => { e.stopPropagation(); deleteMaster(m.id); }} className="w-6 h-6 rounded text-rose-500 hover:bg-rose-50 flex items-center justify-center">
                             <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                      </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="mansaba-card bg-slate-50 border-dashed space-y-3">
              <p className="text-sm font-medium text-slate-600">Tambah Pola Baru</p>
              <input 
                className="mansaba-input !py-1.5" 
                placeholder="Nama Pola..." 
                value={newMasterName} 
                onChange={e => setNewMasterName(e.target.value)} 
              />
              <button onClick={addMaster} className="mansaba-btn-primary w-full"> Simpan Pola </button>
           </div>
        </div>

        {/* MAIN CONTENT: GROUPS & SHIFTS */}
        <div className="lg:col-span-3">
           {!activeMasterId ? (
             <div className="mansaba-card h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                <i className="fa-solid fa-layer-group text-4xl"></i>
                <p className="text-sm font-medium">Pilih Master Pola Shift dari panel di samping.</p>
             </div>
           ) : (
             <div className="space-y-6">
                 {/* GROUP INITIALIZER HEADER */}
                 <div className="mansaba-card flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                       <h4 className="font-semibold text-slate-800 text-lg">{masters.find(m => m.id === activeMasterId)?.name}</h4>
                       <span className="text-xs text-slate-500">Daftar grup pada pola ini</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <input 
                         className="mansaba-input flex-1 sm:w-64" 
                         placeholder="Nama grup baru..." 
                         value={newGroupName} 
                         onChange={e => setNewGroupName(e.target.value)} 
                       />
                       <button onClick={addGroup} className="mansaba-btn-primary whitespace-nowrap">
                        <i className="fa-solid fa-plus"></i> Tambah Grup
                       </button>
                    </div>
                 </div>

                <div className="space-y-6">
                  {groups.map(g => (
                    <div key={g.id} className="mansaba-card-no-pad">
                       <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                             <i className="fa-solid fa-users text-slate-400"></i> {g.name}
                          </h4>
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={() => { 
                                 setEditingShiftId(null); 
                                 setForm({ name: '', startTime: '07:00', endTime: '14:30', lateTolerance: 0, earlyTolerance: 0, startScanIn: '06:00', endScanIn: '10:00', startScanOut: '13:00', endScanOut: '16:00', workDayValue: 1, workMinuteValue: 0, days: '1,2,3,4,5,6' }); 
                                 setActiveGroupId(g.id); 
                               }} 
                               className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                             >
                                Tambah Jadwal Shift
                             </button>
                             <button onClick={async () => { if (window.confirm("Hapus grup shift ini?")) { await axios.delete(`/api/groups/${g.id}`); fetchGroups(); } }} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <i className="fa-solid fa-trash-can"></i>
                             </button>
                          </div>
                       </div>
                       
                       <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 text-rose-600 animate-pulse bg-rose-50/30">
                          <i className="fa-solid fa-angles-right text-[10px]"></i>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Geser tabel ke samping</span>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="mansaba-table !mt-0 !mb-0 !border-0 rounded-none shadow-none">
                          <thead>
                             <tr>
                                <th className="mansaba-th">Nama Shift</th>
                                <th className="mansaba-th">Hari Aktif</th>
                                <th className="mansaba-th border-slate-200">Waktu Kerja</th>
                                <th className="mansaba-th text-right">Aksi</th>
                             </tr>
                          </thead>
                          <tbody>
                             {g.shifts?.map((s:any) => (
                               <tr key={s.id} className="tr-hover cursor-pointer" onClick={() => handleEditShift(s, g.id)}>
                                  <td className="mansaba-td font-medium text-slate-800">{s.name}</td>
                                  <td className="mansaba-td">
                                     <div className="flex gap-1 flex-wrap">
                                        {daysList.map(d => (
                                          <div key={d.value} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${s.days?.includes(d.value) ? 'bg-blue-100 text-blue-700' : 'text-slate-400 bg-slate-50 border border-slate-200'}`}>
                                             {d.label}
                                          </div>
                                        ))}
                                     </div>
                                  </td>
                                  <td className="mansaba-td">
                                     <span className="text-sm font-medium text-slate-700">{s.startTime} - {s.endTime}</span>
                                     <div className="text-xs text-slate-500 mt-0.5">Scan: Masuk ({s.startScanIn}-{s.endScanIn}) Pulang ({s.startScanOut}-{s.endScanOut})</div>
                                  </td>
                                  <td className="mansaba-td text-right">
                                     <button onClick={async (e) => { e.stopPropagation(); if (window.confirm("Hapus shift ini?")) { await axios.delete(`/api/shifts/${s.id}`); fetchGroups(); } }} className="w-8 h-8 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors">
                                       <i className="fa-solid fa-trash-can text-sm"></i>
                                     </button>
                                  </td>
                               </tr>
                             ))}
                             {(!g.shifts || g.shifts.length === 0) && (
                               <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">Belum ada jadwal shift untuk grup ini.</td>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setActiveGroupId(null); setEditingShiftId(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
               <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <h3 className="text-lg font-semibold text-slate-800 mb-6">{editingShiftId ? 'Edit Shift' : 'Tambah Shift'} - {groups.find(g => g.id === activeGroupId)?.name}</h3>
            
            <form onSubmit={addShift} className="space-y-6">
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Hari Aktif Shift</label>
                <div className="flex flex-wrap gap-2">
                   {daysList.map(d => (
                     <button 
                       key={d.value} 
                       type="button" 
                       onClick={() => toggleDay(d.value)} 
                       className={`px-4 py-2 rounded-md font-medium text-sm transition-colors border ${form.days.split(',').includes(d.value) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {d.name}
                      </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                     <label className="text-sm font-medium text-slate-600 mb-1">Nama Shift</label>
                     <input className="mansaba-input" placeholder="Contoh: Shift Pagi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-slate-600">Jam Masuk</label>
                         <input className="mansaba-input text-center font-semibold" type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-slate-600">Jam Pulang</label>
                         <input className="mansaba-input text-center font-semibold" type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-3">
                         <label className="text-xs font-semibold text-emerald-700">Waktu Scan Masuk</label>
                         <div className="flex items-center gap-2">
                            <input className="mansaba-input !py-1 text-xs" type="time" title="Mulai Scan In" value={form.startScanIn} onChange={e => setForm({...form, startScanIn: e.target.value})} required/>
                            <span className="text-slate-400">-</span>
                            <input className="mansaba-input !py-1 text-xs" type="time" title="Batas Scan In" value={form.endScanIn} onChange={e => setForm({...form, endScanIn: e.target.value})} required/>
                         </div>
                     </div>
                     <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 space-y-3">
                         <label className="text-xs font-semibold text-rose-700">Waktu Scan Pulang</label>
                         <div className="flex items-center gap-2">
                            <input className="mansaba-input !py-1 text-xs" type="time" title="Mulai Scan Out" value={form.startScanOut} onChange={e => setForm({...form, startScanOut: e.target.value})} required/>
                            <span className="text-slate-400">-</span>
                            <input className="mansaba-input !py-1 text-xs" type="time" title="Batas Scan Out" value={form.endScanOut} onChange={e => setForm({...form, endScanOut: e.target.value})} required/>
                         </div>
                     </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setActiveGroupId(null); setEditingShiftId(null); }} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                <button type="submit" disabled={loading} className="mansaba-btn-primary px-6">
                  {editingShiftId ? 'Simpan Perubahan' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsPage;
