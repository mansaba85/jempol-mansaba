import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { 
  Settings as SettingsIcon, 
  School, 
  Clock, 
  Save, 
  Image as ImageIcon,
  DollarSign,
  Download,
  Upload,
  Database,
  Ticket,
  Users,
  Search,
  CheckCircle2,
  Terminal,
  Activity,
  Calendar,
  Plus,
  Trash2,
  Info,
  AlertCircle
} from 'lucide-react';

const API_URL = '/api';

const SettingsPage = () => {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sertifikasiIds, setSertifikasiIds] = useState<number[]>([]);
  const [settings, setSettings] = useState({
    app_name: 'Jariku Mansaba',
    school_name: '',
    school_address: '',
    school_logo: '',
    headmaster_name: '',
    headmaster_nip: '',
    treasurer_name: '',
    treasurer_nip: '',
    penalty_late_minutes: '240',
    penalty_early_minutes: '240',
    rate_umum: '25000',
    rate_sertif: '25000',
    rate_tidak_disiplin: '10000',
    voucher_nominal: '30000'
  });

  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'holidays'>('general');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    id: '',
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isGlobal: true,
    affectedRoles: '',
    affectedPatterns: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, eRes, hRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/holidays`),
        axios.get(`${API_URL}/shift-patterns`)
      ]);
      
      const sMap: any = {};
      sRes.data.forEach((s: any) => {
        if (s.key in settings) sMap[s.key] = s.value;
      });
      setSettings(prev => ({ ...prev, ...sMap }));
      
      setEmployees(eRes.data);
      setSertifikasiIds(eRes.data.filter((e: any) => e.isSertifikasi).map((e: any) => e.id));
      setHolidays(hRes.data);
      setPatterns(pRes.data);
    } catch (err) {
      toast.error('Gagal memuat data');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await axios.post(`${API_URL}/settings`, { 
        settings: payload,
        sertifikasiIds 
      });
      await refreshSettings();
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/holidays`, holidayForm);
      toast.success(holidayForm.id ? 'Hari libur diperbarui' : 'Hari libur ditambahkan');
      setIsHolidayModalOpen(false);
      setHolidayForm({ id: '', name: '', date: format(new Date(), 'yyyy-MM-dd'), isGlobal: true, affectedRoles: '', affectedPatterns: '' });
      const res = await axios.get(`${API_URL}/holidays`);
      setHolidays(res.data);
    } catch (err) {
      toast.error('Gagal menyimpan hari libur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('Hapus hari libur ini?')) return;
    try {
      await axios.delete(`${API_URL}/holidays/${id}`);
      toast.success('Hari libur dihapus');
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (err) {
      toast.error('Gagal menghapus hari libur');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, school_logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/backup`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `backup_mansaba_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup data berhasil diunduh');
    } catch (err) {
      toast.error('Gagal melakukan backup');
    }
  };

  const handleRestore = async (file: File) => {
    if (!window.confirm('PERINGATAN: Memulihkan data akan menghapus semua data saat ini. Lanjutkan?')) return;
    
    setRestoring(true);
    const formData = new FormData();
    formData.append('backup', file);

    try {
      await axios.post(`${API_URL}/settings/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Data berhasil dipulihkan!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memulihkan data');
    } finally {
      setRestoring(false);
    }
  };

  const handlePurgeLogs = async (beforeDate: string) => {
    if (!beforeDate) return;
    if (!window.confirm(`PERINGATAN KRITIKAL: Anda akan menghapus SEMUA data presensi sebelum tanggal ${format(new Date(beforeDate), 'dd MMMM yyyy')}. Data yang dihapus TIDAK DAPAT dikembalikan. Lanjutkan?`)) return;

    setLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/logs/purge?beforeDate=${beforeDate}`);
      toast.success(`${res.data.count} data log lama berhasil dihapus`);
    } catch (err) {
      toast.error('Gagal menghapus log');
    } finally {
      setLoading(false);
    }
  };

  const toggleSertifikasi = (id: number) => {
    setSertifikasiIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    String(e.id).includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <Toaster position="top-right" />
       
       {/* LOADING OVERLAY FOR RESTORE */}
       {restoring && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
            <div className="bg-white p-10 rounded-[2.5rem] flex flex-col items-center shadow-2xl">
               <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Memulihkan Data...</h3>
               <p className="text-sm text-slate-400 font-medium mt-2">Mohon jangan tutup halaman ini.</p>
            </div>
         </div>
       )}
      
      {/* HUD HEADER */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 px-4">
         <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 border border-blue-200 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-sm">
               <SettingsIcon size={32} className="md:hidden" />
               <SettingsIcon size={40} className="hidden md:block" />
            </div>
            <div>
               <h1 className="text-base md:text-lg font-bold text-slate-800">
                 PENGATURAN <span className="text-blue-600 italic">INTI</span>
               </h1>
               <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                 <span className="text-slate-500 font-medium text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em]">Konfigurasi Sistem v4.0</span>
                 <div className="h-px w-12 md:w-20 bg-blue-50"></div>
               </div>
            </div>
         </div>
         
         <div className="flex flex-wrap items-center gap-3 md:gap-4">
           <button 
             onClick={handleBackup}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 transition-all font-bold text-[9px] md:text-[10px] tracking-widest shadow-sm"
           >
             <Download size={16} />
             <span>CADANGKAN</span>
           </button>
           
           <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-200 transition-all font-bold text-[9px] md:text-[10px] tracking-widest shadow-sm cursor-pointer">
             <Upload size={16} />
             <span>PULIHKAN</span>
             <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])} />
           </label>

           <button 
             onClick={() => handleSave()}
             disabled={loading}
             className="w-full md:w-auto mansaba-btn-primary !h-10 !px-12 flex items-center justify-center gap-3"
           >
             {loading ? (
                <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
             ) : (
                <Save size={20} />
             )}
             <span>SIMPAN PERUBAHAN</span>
           </button>
         </div>
       </div>

      {/* NAVIGATION TABS */}
       <div className="flex items-center gap-2 mb-10 px-4 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
             <School size={18} />
             <span>Identitas & Sertifikasi</span>
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'financial' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
             <DollarSign size={18} />
             <span>Tarif & Logika</span>
          </button>
          <button 
            onClick={() => setActiveTab('holidays')}
            className={`px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'holidays' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
             <Calendar size={18} />
             <span>Kalender Libur</span>
          </button>
       </div>

      <div className="px-4">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-10">
               <div className="mansaba-card !p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 text-slate-800/[0.01] transition-colors">
                     <School size={200} />
                  </div>
                  <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8 relative z-10">
                     <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center">
                        <School size={24} />
                     </div>
                     <h2 className="text-xl font-medium text-slate-800">Identitas <span className="text-blue-600">Madrasah</span></h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                     <div className="md:col-span-2 space-y-3">
                        <label className="text-[9px] font-medium text-blue-600 tracking-[0.3em] ml-2">Nama Aplikasi</label>
                        <input className="mansaba-input !py-5 font-medium text-base text-blue-600 bg-blue-50/30" value={settings.app_name} onChange={e => setSettings({...settings, app_name: e.target.value})} />
                     </div>
                     <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-12 mb-6">
                        <div className="relative logo">
                           <div className="w-40 h-40 rounded-[3rem] bg-white/[0.02] border border-slate-200 flex items-center justify-center overflow-hidden transition-colors logo:border-blue-200 shadow-sm">
                              {settings.school_logo ? <img src={settings.school_logo} alt="Logo" className="w-full h-full object-contain p-6" /> : <div className="text-slate-800"><ImageIcon size={60} /></div>}
                           </div>
                           <label className="absolute -bottom-2 -right-2 bg-primary text-slate-800 shadow-sm p-4 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors">
                              <ImageIcon size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                           </label>
                        </div>
                        <div className="flex-1 space-y-3">
                           <h3 className="text-sm font-medium text-slate-800">Logo Madrasah</h3>
                           <p className="text-[10px] font-medium text-slate-500 leading-relaxed tracking-[0.2em]">Lambat resmi yang digunakan untuk header laporan dan dokumen.</p>
                        </div>
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <label className="text-[9px] font-medium text-blue-600 tracking-[0.3em] ml-2">Nama Instansi / Madrasah</label>
                        <input className="mansaba-input !py-5 font-medium text-base" value={settings.school_name} onChange={e => setSettings({...settings, school_name: e.target.value})} />
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Alamat Lengkap</label>
                        <textarea className="mansaba-input w-full !py-5 font-medium text-sm min-h-[100px]" value={settings.school_address} onChange={e => setSettings({...settings, school_address: e.target.value})} />
                     </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Kepala Madrasah (Director General)</label>
                         <input className="mansaba-input !py-5 font-medium text-sm" value={settings.headmaster_name} onChange={e => setSettings({...settings, headmaster_name: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">NIP Director General</label>
                         <input className="mansaba-input !py-5 font-medium text-sm" value={settings.headmaster_nip} onChange={e => setSettings({...settings, headmaster_nip: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Bendahara (Compliance Officer)</label>
                         <input className="mansaba-input !py-5 font-medium text-sm" value={settings.treasurer_name} onChange={e => setSettings({...settings, treasurer_name: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">NIP Compliance Officer</label>
                         <input className="mansaba-input !py-5 font-medium text-sm" value={settings.treasurer_nip} onChange={e => setSettings({...settings, treasurer_nip: e.target.value})} />
                      </div>
                  </div>
               </div>
            </div>
            <div className="lg:col-span-5 space-y-10">
               <div className="mansaba-card !p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 border-b border-slate-200 pb-8">
                     <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center"><Users size={24} /></div><h2 className="text-xl font-medium text-slate-800">Daftar <span className="text-blue-600">Pegawai</span></h2></div>
                     <div className="relative w-full md:w-72"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input className="mansaba-input !py-3 !pl-12 text-[10px] font-medium" placeholder="CARI PEGAWAI..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto no-scrollbar space-y-3 pr-2">
                     {filteredEmployees.map(emp => {
                        const isSertif = sertifikasiIds.includes(emp.id);
                        return (
                           <div key={emp.id} onClick={() => toggleSertifikasi(emp.id)} className={`flex items-center justify-between p-5 rounded-lg border transition-colors cursor-pointer ${isSertif ? 'bg-primary border-blue-200 shadow-lg' : 'bg-white/[0.01] border-slate-200 hover:border-blue-200'}`}>
                              <div className="flex items-center gap-6">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-medium ${isSertif ? 'bg-white/20 text-slate-800' : 'bg-white/[0.03] text-slate-500 '}`}>{String(emp.id).padStart(3, '0')}</div>
                                 <div><h4 className="text-sm font-medium text-slate-800">{emp.name}</h4><p className="text-[9px] font-medium mt-1 text-slate-500">ID: {emp.id} | {emp.role}</p></div>
                              </div>
                              {isSertif ? <CheckCircle2 size={24} className="text-slate-800" /> : <div className="w-6 h-6 rounded-full border-2 border-slate-200"></div>}
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* SYSTEM MAINTENANCE SECTION */}
            <div className="lg:col-span-12">
               <div className="mansaba-card !p-12 border-l-4 border-rose-500 bg-rose-50/10">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                        <Trash2 size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-800">Pemeliharaan <span className="text-rose-600">Sistem</span></h2>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Optimasi Database & Pembersihan Log</p>
                     </div>
                  </div>

                  <div className="bg-white border border-rose-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 mb-2">Hapus Log Presensi Lama</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Bersihkan data log untuk mengoptimalkan ruang penyimpanan. Disarankan dilakukan secara berkala.</p>
                     </div>
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <input 
                          type="date" 
                          id="purge-date"
                          className="mansaba-input !py-3 text-xs" 
                          defaultValue={format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')}
                        />
                        <button 
                          onClick={() => {
                            const dateVal = (document.getElementById('purge-date') as HTMLInputElement).value;
                            handlePurgeLogs(dateVal);
                          }}
                          className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 whitespace-nowrap"
                        >
                           PURGE DATA
                        </button>
                     </div>
                  </div>
                  
                  <div className="mt-8 flex items-start gap-4 p-5 bg-rose-50 rounded-2xl border border-rose-100">
                     <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-medium text-rose-600 italic leading-relaxed">
                        Tombol di atas akan menghapus data presensi secara permanen. Pastikan Anda telah melakukan <span className="font-black underline">BACKUP DATA</span> terlebih dahulu sebelum melakukan pembersihan database.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="mansaba-card !p-10 border-l-4 border-emerald-500">
                <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center justify-center"><DollarSign size={24} /></div><h2 className="text-xl font-medium text-slate-800">Parameter <span className="text-emerald-400">Keuangan</span></h2></div>
                <div className="space-y-8">
                   {['rate_umum', 'rate_sertif', 'rate_tidak_disiplin', 'voucher_nominal'].map(key => (
                      <div key={key} className="space-y-3">
                         <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em] flex justify-between px-2"><span>{key.replace('_', ' ').toUpperCase()}</span></label>
                         <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">IDR</span><input type="number" className="mansaba-input w-full !pl-16 !py-5 font-medium text-lg" value={(settings as any)[key]} onChange={e => setSettings({...settings, [key]: e.target.value})} /></div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="mansaba-card !p-10 border-l-4 border-amber-500">
                <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8"><div className="w-12 h-12 bg-amber-50 text-amber-500 border border-amber-200 rounded-xl flex items-center justify-center"><Clock size={24} /></div><h2 className="text-xl font-medium text-slate-800">Logika <span className="text-amber-400">Kedisiplinan</span></h2></div>
                <div className="space-y-12">
                   {['penalty_late_minutes', 'penalty_early_minutes'].map(key => (
                      <div key={key} className="space-y-6">
                         <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em] uppercase">{key === 'penalty_late_minutes' ? 'Batas Toleransi Keterlambatan' : 'Batas Toleransi Pulang Cepat'}</label>
                         <div className="flex items-center gap-6"><input type="number" className="mansaba-input flex-1 !py-5 font-medium text-xl text-center" value={(settings as any)[key]} onChange={e => setSettings({...settings, [key]: e.target.value})} /><span className="text-[11px] font-medium text-slate-500">MENIT</span></div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-6">
                <div><h2 className="text-lg md:text-xl font-bold text-slate-800">Manajemen Hari Libur</h2><p className="text-xs md:text-sm text-slate-500">Atur hari libur nasional atau event khusus sekolah.</p></div>
                <button onClick={() => { setHolidayForm({ id: '', name: '', date: format(new Date(), 'yyyy-MM-dd'), isGlobal: true, affectedRoles: '', affectedPatterns: '' }); setIsHolidayModalOpen(true); }} className="w-full md:w-auto px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"><Plus size={18} /> Tambah Hari Libur</button>
             </div>
             <div className="mansaba-card overflow-hidden !p-0">
                <div className="overflow-x-auto no-scrollbar">
                   <table className="min-w-[800px] w-full border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                         <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Hari Libur</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sifat</th>
                         <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                         <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {holidays.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="py-20 text-center">
                              <div className="flex flex-col items-center opacity-20">
                                 <Calendar size={48} className="mb-4" />
                                 <p className="text-xs font-bold tracking-widest uppercase">Belum ada hari libur</p>
                              </div>
                           </td>
                        </tr>
                      ) : (
                        holidays.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-4">
                                <span className="text-sm font-bold text-slate-800">{h.name}</span>
                             </td>
                             <td className="px-8 py-4 text-center">
                                <span className="text-xs font-black text-amber-600">{format(new Date(h.date), 'dd MMM yyyy')}</span>
                             </td>
                             <td className="px-8 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black ${h.isGlobal ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                   {h.isGlobal ? 'MASSAL' : 'KHUSUS'}
                                </span>
                             </td>
                             <td className="px-8 py-4">
                                {!h.isGlobal ? (
                                   <div className="flex flex-col gap-1">
                                      {h.affectedRoles && <span className="text-[9px] font-bold text-slate-400">ROLE: {h.affectedRoles}</span>}
                                      {h.affectedPatterns && <span className="text-[9px] font-bold text-blue-500">POLA: {
                                         h.affectedPatterns.split(',').map((id: string) => {
                                            const p = patterns.find(p => String(p.id) === id);
                                            return p ? p.name : id;
                                         }).join(', ')
                                      }</span>}
                                   </div>
                                ) : <span className="text-[9px] font-black text-slate-300">SEMUA PEGAWAI</span>}
                             </td>
                             <td className="px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <button onClick={() => { setHolidayForm({...h, date: format(new Date(h.date), 'yyyy-MM-dd')}); setIsHolidayModalOpen(true); }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all">
                                      <SettingsIcon size={14} />
                                   </button>
                                   <button onClick={() => handleDeleteHoliday(h.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all">
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
      </div>

      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-amber-500 p-8 text-white relative"><div className="absolute top-0 right-0 p-8 opacity-20"><Calendar size={80} /></div><h2 className="text-2xl font-bold flex items-center gap-3"><Calendar size={28} /> {holidayForm.id ? 'Edit Hari Libur' : 'Tambah Hari Libur'}</h2></div>
              <form onSubmit={handleHolidaySubmit} className="p-8 space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Hari Libur</label><input required className="mansaba-input w-full !py-4" value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} /></div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal</label><input required type="date" className="mansaba-input w-full !py-4" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sifat Libur</label><select className="mansaba-input w-full !py-4" value={holidayForm.isGlobal ? 'true' : 'false'} onChange={e => setHolidayForm({...holidayForm, isGlobal: e.target.value === 'true'})}><option value="true">Libur Masal (Semua)</option><option value="false">Libur Khusus (Pilih Role)</option></select></div>
                 </div>
                 {!holidayForm.isGlobal && (
                    <>
                       <div className="space-y-3 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase tracking-widest mb-2"><Users size={14} /> Pilih Role Yang Diliburkan</div>
                          <div className="flex flex-wrap gap-2">
                             {['GURU', 'STAFF', 'KEAMANAN', 'KEBERSIHAN'].map(role => {
                                const roles = holidayForm.affectedRoles.split(',').filter(Boolean);
                                const isSelected = roles.includes(role);
                                return (<button key={role} type="button" onClick={() => { const newRoles = isSelected ? roles.filter(r => r !== role) : [...roles, role]; setHolidayForm({...holidayForm, affectedRoles: newRoles.join(',')}); }} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-blue-200'}`}>{role}</button>);
                             })}
                          </div>
                       </div>

                       <div className="space-y-3 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                          <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-widest mb-2"><Activity size={14} /> Pilih Pola Rotasi Yang Diliburkan</div>
                          <div className="flex flex-wrap gap-2">
                             {patterns.map(p => {
                                const patternIds = holidayForm.affectedPatterns.split(',').filter(Boolean);
                                const isSelected = patternIds.includes(String(p.id));
                                return (
                                   <button 
                                     key={p.id} 
                                     type="button" 
                                     onClick={() => { 
                                       const newIds = isSelected ? patternIds.filter(id => id !== String(p.id)) : [...patternIds, String(p.id)]; 
                                       setHolidayForm({...holidayForm, affectedPatterns: newIds.join(',')}); 
                                     }} 
                                     className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border border-amber-200'}`}
                                   >
                                      {p.name}
                                   </button>
                                );
                             })}
                          </div>
                       </div>
                    </>
                 )}
                 <div className="flex items-center gap-4 pt-4"><button type="button" onClick={() => setIsHolidayModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-500">BATAL</button><button type="submit" disabled={loading} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-100 flex items-center justify-center gap-2">{loading ? '...' : 'SIMPAN'}</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
