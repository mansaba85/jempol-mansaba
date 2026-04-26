import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const DevicesPage = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [newDevice, setNewDevice] = useState({ name: '', ipAddress: '', port: '4370', password: '' });
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  const fetchDevices = async () => {
    try {
      const res = await axios.get('/api/devices');
      setDevices(res.data || []);
    } catch (err) { console.error("Gagal ambil daftar mesin"); }
  };

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/devices', newDevice);
      setNewDevice({ name: '', ipAddress: '', port: '4370', password: '' });
      toast.success('Mesin biometrik berhasil didaftarkan');
      fetchDevices();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal menambah mesin.";
      toast.error(msg);
    }
    setLoading(false);
  };

  const deleteDevice = async (id: number) => {
    if (!window.confirm("Hapus mesin ini dari konfigurasi?")) return;
    try {
      await axios.delete(`/api/devices/${id}`);
      toast.success('Konfigurasi mesin dihapus');
      fetchDevices();
    } catch (err) {
      toast.error('Gagal menghapus mesin');
    }
  };

  const testConnection = async (id: number) => {
    setTestResults({ ...testResults, [id]: { status: 'Testing...' } });
    try {
      const res = await axios.get(`/api/machine/status/${id}`);
      setTestResults({ ...testResults, [id]: res.data });
      if (res.data.status === 'Connected') {
        toast.success(`Koneksi Mesin ID.${id} Stabil`);
      } else {
        toast.error(`Mesin ID.${id} Gagal Terhubung`);
      }
    } catch (err) {
      setTestResults({ ...testResults, [id]: { status: 'Error' } });
      toast.error('Kesalahan Jaringan / Timeout');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12 pb-8 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Perangkat Biometrik</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Integrasi dan monitoring mesin fingerprint institusi</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start text-slate-800">
        {/* Form Tambah (Tetap di samping untuk efisiensi flow) */}
        <div className="lg:col-span-4 card-mansaba shadow-2xl shadow-slate-200/50">
          <h3 className="text-xs font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 uppercase tracking-[0.2em]">Registrasi Mesin</h3>
          <form onSubmit={addDevice} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Lokasi Mesin</label>
              <input 
                className="input-mansaba w-full !py-3.5 font-black"
                type="text" placeholder="Gedung Utama" required
                value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">IP Address</label>
                 <input 
                   className="input-mansaba w-full !py-3.5 font-mono text-sm"
                   type="text" placeholder="192.168.1.1" required
                   value={newDevice.ipAddress} onChange={e => setNewDevice({...newDevice, ipAddress: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Port</label>
                 <input 
                   className="input-mansaba w-full !py-3.5 text-center"
                   type="number" placeholder="4370" required
                   value={newDevice.port} onChange={e => setNewDevice({...newDevice, port: e.target.value})}
                 />
               </div>
            </div>
            <button 
              type="submit" disabled={loading}
              className="btn-mansaba w-full !py-4 shadow-xl shadow-primary/20 uppercase tracking-[0.2em] font-black mt-2"
            >
              Simpan Koneksi
            </button>
          </form>
        </div>

        {/* Daftar Mesin (Tabel untuk Efisiensi) */}
        <div className="lg:col-span-8">
           <div className="table-wrapper">
             <table className="table-mansaba">
               <thead>
                 <tr>
                   <th className="table-header">Lokasi / Detail Mesin</th>
                   <th className="table-header text-center">Status</th>
                   <th className="table-header">Info Memori</th>
                   <th className="table-header text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {devices.map(dev => (
                   <tr key={dev.id} className="table-row group">
                     <td className="table-cell">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" /></svg>
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-sm">{dev.name}</span>
                              <code className="text-[10px] text-slate-400 font-mono">{dev.ipAddress}:{dev.port}</code>
                           </div>
                        </div>
                     </td>
                     <td className="table-cell text-center">
                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 border transition-all ${
                          testResults[dev.id]?.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          (testResults[dev.id]?.status === 'Error' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-surface-50 text-slate-400 border-slate-200')
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            testResults[dev.id]?.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 
                            (testResults[dev.id]?.status === 'Error' ? 'bg-rose-500' : 'bg-slate-300')
                          }`}></div>
                          {testResults[dev.id]?.status || 'BELUM DICEK'}
                        </div>
                     </td>
                     <td className="table-cell">
                        {testResults[dev.id]?.info ? (
                          <div className="flex gap-4">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LOG</span>
                                <span className="text-xs font-black text-slate-700">{testResults[dev.id].info.logCount}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">USER</span>
                                <span className="text-xs font-black text-slate-700">{testResults[dev.id].info.userCount}</span>
                             </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No Data</span>
                        )}
                     </td>
                     <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button 
                             onClick={() => testConnection(dev.id)}
                             className="p-3 bg-white border border-slate-200 rounded-xl text-primary hover:border-primary transition-all shadow-sm"
                             title="Tes Koneksi"
                           >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                           </button>
                           <button 
                             onClick={() => deleteDevice(dev.id)}
                             className="p-3 bg-rose-50 text-rose-300 hover:text-rose-500 rounded-xl border border-transparent hover:border-rose-100 transition-all shadow-sm"
                             title="Hapus"
                           >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {devices.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic">Belum ada mesin terdaftar</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default DevicesPage;
