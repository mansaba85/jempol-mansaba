import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const DevicesPage = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [newDevice, setNewDevice] = useState({ name: '', ipAddress: '', port: '4370', password: '' });
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_URL}/devices`);
      setDevices(res.data || []);
    } catch (err) { console.error("Gagal mendapatkan data mesin"); }
  };

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/devices`, newDevice);
      setNewDevice({ name: '', ipAddress: '', port: '4370', password: '' });
      toast.success('Mesin berhasil ditambahkan');
      fetchDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menambahkan mesin.");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (id: number) => {
    setTestResults({ ...testResults, [id]: { status: 'Syncing...' } });
    try {
      const res = await axios.get(`${API_URL}/machine/status/${id}`);
      setTestResults({ ...testResults, [id]: res.data });
      if (res.data.status === 'Connected') toast.success('Koneksi berhasil');
      else toast.error('Koneksi terputus');
    } catch (err) {
      setTestResults({ ...testResults, [id]: { status: 'Fault' } });
      toast.error('Timeout koneksi');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="space-y-6">
      <Toaster />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-semibold text-slate-800">Terminal Mesin</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola dan pantau mesin presensi sidik jari yang terhubung.</p>
         </div>
         <div className="flex items-center gap-4 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <i className="fa-solid fa-server text-emerald-500"></i>
              <span className="text-sm text-slate-500">Total Mesin: <span className="text-slate-800 font-semibold">{devices.length}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <i className="fa-solid fa-wifi text-blue-500"></i> Local Network
            </div>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD DEVICE FORM */}
        <div className="lg:col-span-1">
          <div className="mansaba-card h-full">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">
               Tambah Mesin Baru
            </h3>
            <form onSubmit={addDevice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Nama Mesin</label>
                <input 
                  className="mansaba-input"
                  type="text" placeholder="Contoh: Mesin Gedung A" required
                  value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Alamat IP / IP Address</label>
                  <input 
                    className="mansaba-input"
                    type="text" placeholder="192.168.1.201" required
                    value={newDevice.ipAddress} onChange={e => setNewDevice({...newDevice, ipAddress: e.target.value})}
                  />
              </div>
              <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Port</label>
                  <input 
                    className="mansaba-input"
                    type="number" placeholder="4370" required
                    value={newDevice.port} onChange={e => setNewDevice({...newDevice, port: e.target.value})}
                  />
              </div>

              <div className="pt-2">
                 <button 
                   type="submit" disabled={loading}
                   className="mansaba-btn-primary w-full"
                 >
                   {loading ? (
                     <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                   ) : (
                     <><i className="fa-solid fa-plus"></i> Simpan Mesin</>
                   )}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* DEVICES LIST */}
        <div className="lg:col-span-2">
           <div className="mansaba-card-no-pad">
              <table className="mansaba-table">
                 <thead>
                   <tr>
                     <th className="mansaba-th">Identitas Mesin</th>
                     <th className="mansaba-th text-center">Status Koneksi</th>
                     <th className="mansaba-th">Kapasitas Log</th>
                     <th className="mansaba-th text-right">Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {devices.map(dev => (
                     <tr key={dev.id} className="tr-hover">
                       <td className="mansaba-td py-4">
                          <div className="flex flex-col">
                             <span className="text-sm font-semibold text-slate-800 mb-0.5">{dev.name}</span>
                             <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <i className="fa-solid fa-network-wired text-slate-400"></i> {dev.ipAddress}:{dev.port}
                             </div>
                          </div>
                       </td>
                       <td className="mansaba-td text-center">
                          {testResults[dev.id]?.status === 'Connected' ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Terhubung
                             </span>
                          ) : testResults[dev.id]?.status === 'Fault' ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Gagal
                             </span>
                          ) : testResults[dev.id]?.status === 'Syncing...' ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                                <i className="fa-solid fa-spinner fa-spin"></i> Ping...
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Standby
                             </span>
                          )}
                       </td>
                       <td className="mansaba-td">
                          {testResults[dev.id]?.info ? (
                             <div className="flex flex-col gap-1 text-xs">
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                   <span className="text-slate-500">User:</span>
                                   <span className="font-semibold text-slate-800">{testResults[dev.id].info.userCount}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                   <span className="text-slate-500">Log:</span>
                                   <span className="font-semibold text-slate-800">{testResults[dev.id].info.logCount}</span>
                                </div>
                             </div>
                          ) : (
                             <span className="text-xs text-slate-400 italic">Klik Ping untuk melihat kapasitas</span>
                          )}
                       </td>
                       <td className="mansaba-td text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={() => testConnection(dev.id)}
                               className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
                               title="Test Koneksi (Ping)"
                             >
                               <i className="fa-solid fa-bolt"></i>
                             </button>
                             <button 
                               onClick={async () => { if (window.confirm("Yakin ingin menghapus mesin ini?")) { await axios.delete(`${API_URL}/devices/${dev.id}`); fetchDevices(); } }}
                               className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center border border-slate-200"
                               title="Hapus Mesin"
                             >
                               <i className="fa-solid fa-trash-can"></i>
                             </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                   {devices.length === 0 && (
                     <tr>
                        <td colSpan={4} className="py-12 text-center">
                           <i className="fa-solid fa-fax text-3xl text-slate-300 mb-3 block"></i>
                           <p className="text-sm font-medium text-slate-500">Belum ada mesin yang ditambahkan.</p>
                        </td>
                     </tr>
                   )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesPage;
