import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Activity
} from 'lucide-react';

const API_URL = '/api';

const SettingsPage = () => {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sertifikasiIds, setSertifikasiIds] = useState<number[]>([]);
  const [settings, setSettings] = useState({
    app_name: 'Jariku Mansaba',
    school_name: '',
    school_address: '',
    school_logo: '',
    headmaster_name: '',
    treasurer_name: '',
    penalty_late_minutes: '240',
    penalty_early_minutes: '240',
    rate_umum: '25000',
    rate_sertif: '25000',
    rate_tidak_disiplin: '10000',
    voucher_nominal: '30000'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/employees`)
      ]);
      
      const sMap: any = {};
      sRes.data.forEach((s: any) => {
        if (s.key in settings) sMap[s.key] = s.value;
      });
      setSettings(prev => ({ ...prev, ...sMap }));
      
      setEmployees(eRes.data);
      setSertifikasiIds(eRes.data.filter((e: any) => e.isSertifikasi).map((e: any) => e.id));
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

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('PERINGATAN: Mengembalikan data akan menimpa data yang ada saat ini secara permanen. Lanjutkan?')) return;

    const formData = new FormData();
    formData.append('backup', file);
    try {
      await axios.post(`${API_URL}/settings/restore`, formData);
      toast.success('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error('Gagal memulihkan data');
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
      <Toaster />
      
      {/* HUD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 px-4">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-blue-50 border border-blue-200 rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <SettingsIcon size={40} />
           </div>
           <div>
              <h1 className="text-lg font-medium font-semibold font-medium text-slate-800">
                CORE <span className="text-blue-600 italic">CONFIG</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-slate-500 font-medium text-[10px] tracking-[0.4em]">System Architecture v4.0</span>
                <div className="h-px w-20 bg-blue-50"></div>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={handleBackup}
            title="Download System Backup"
            className="w-10 h-10 bg-white/[0.02] text-slate-500 hover:text-emerald-400 rounded-lg border border-slate-200 hover:border-emerald-500/30 transition-colors flex items-center justify-center"
          >
            <Download size={24} className="transition-transform" />
          </button>
          <button 
            onClick={() => handleSave()}
            disabled={loading}
            className="mansaba-btn-primary !h-10 !px-12"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full"></div>
            ) : (
               <Save size={20} className="mr-3" />
            )}
            <span>COMMIT CHANGES</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        
        {/* LEFT COLUMN: IDENTITY & EMPLOYEES */}
        <div className="lg:col-span-7 space-y-10">
           
           {/* INSTITUTION SECTION */}
           <div className="mansaba-card !p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 text-slate-800/[0.01] transition-colors">
                 <School size={200} />
              </div>
              
              <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8 relative z-10">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center">
                    <School size={24} />
                 </div>
                 <h2 className="text-xl font-medium text-slate-800">Institution <span className="text-blue-600">Identity</span></h2>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                 <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-medium text-blue-600 tracking-[0.3em] ml-2">Application Name</label>
                    <input 
                       className="mansaba-input !py-5 font-medium text-base text-blue-600 bg-blue-50/30" 
                       placeholder="e.g. Jariku Mansaba"
                       value={settings.app_name}
                       onChange={e => setSettings({...settings, app_name: e.target.value})}
                    />
                 </div>
                 <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-12 mb-6">
                    <div className="relative logo">
                       <div className="w-40 h-40 rounded-[3rem] bg-white/[0.02] border border-slate-200 flex items-center justify-center overflow-hidden transition-colors logo:border-blue-200 shadow-sm">
                          {settings.school_logo ? (
                             <img src={settings.school_logo} alt="Logo" className="w-full h-full object-contain p-6" />
                          ) : (
                             <div className="text-slate-800">
                                <ImageIcon size={60} />
                             </div>
                          )}
                       </div>
                       <label className="absolute -bottom-2 -right-2 bg-primary text-slate-800 shadow-sm p-4 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors logo: active:">
                          <ImageIcon size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                       </label>
                    </div>
                    <div className="flex-1 space-y-3">
                       <h3 className="text-sm font-medium text-slate-800">Institutional Sigil</h3>
                       <p className="text-[10px] font-medium text-slate-500 leading-relaxed tracking-[0.2em]">Official insignia used for cryptographic reporting and document headers.</p>
                       <div className="flex items-center gap-2 mt-4 text-emerald-500/60 text-[9px]">
                          <Activity size={10} />
                          <span>IMAGE_BUFFER_ACTIVE</span>
                       </div>
                    </div>
                 </div>
 
                 <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-medium text-blue-600 tracking-[0.3em] ml-2">Official Designation</label>
                    <input 
                       className="mansaba-input !py-5 font-medium text-base" 
                       placeholder="e.g. MA NU 01 Banyuputih"
                       value={settings.school_name}
                       onChange={e => setSettings({...settings, school_name: e.target.value})}
                    />
                 </div>
 
                 <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Physical Location</label>
                    <textarea 
                       className="mansaba-input w-full !py-5 font-medium text-sm min-h-[100px]" 
                       placeholder="Enter full institutional address..."
                       value={settings.school_address}
                       onChange={e => setSettings({...settings, school_address: e.target.value})}
                    />
                 </div>
 
                 <div className="space-y-3">
                    <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Director General</label>
                    <input 
                       className="mansaba-input !py-5 font-medium text-sm" 
                       placeholder="Full Identity Name"
                       value={settings.headmaster_name}
                       onChange={e => setSettings({...settings, headmaster_name: e.target.value})}
                    />
                 </div>
 
                 <div className="space-y-3">
                    <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] ml-2">Compliance Officer</label>
                    <input 
                       className="mansaba-input !py-5 font-medium text-sm" 
                       placeholder="Treasurer Full Name"
                       value={settings.treasurer_name}
                       onChange={e => setSettings({...settings, treasurer_name: e.target.value})}
                    />
                 </div>
              </div>
           </div>
 
           {/* PERSONNEL CLASSIFICATION */}
           <div className="mansaba-card !p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 border-b border-slate-200 pb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center">
                       <Users size={24} />
                    </div>
                    <h2 className="text-xl font-medium text-slate-800">Personnel <span className="text-blue-600">Registry</span></h2>
                 </div>
                 <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                       className="mansaba-input !py-3 !pl-12 text-[10px] font-medium"
                       placeholder="IDENTITY SCAN..."
                       value={search}
                       onChange={e => setSearch(e.target.value)}
                    />
                 </div>
              </div>
 
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-10 flex gap-4 items-center">
                 <Terminal size={20} className="text-blue-600 shrink-0" />
                 <p className="text-[10px] font-medium text-blue-600 tracking-[0.2em] leading-relaxed">Map personnel to Certification protocols. Unmapped entities default to Standard categorization.</p>
              </div>
 
              <div className="max-h-[500px] overflow-y-auto no-scrollbar space-y-3 pr-2">
                 {filteredEmployees.map(emp => {
                    const isSertif = sertifikasiIds.includes(emp.id);
                    return (
                       <div 
                         key={emp.id}
                         onClick={() => toggleSertifikasi(emp.id)}
                         className={`
                           flex items-center justify-between p-5 rounded-lg border transition-colors cursor-pointer 
                           ${isSertif ? 'bg-primary border-blue-200 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'bg-white/[0.01] border-slate-200 hover:border-blue-200'}
                         `}
                       >
                          <div className="flex items-center gap-6">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center  text-[11px] font-medium ${isSertif ? 'bg-white/20 text-slate-800' : 'bg-white/[0.03] text-slate-500 '}`}>
                                {String(emp.id).padStart(3, '0')}
                             </div>
                             <div>
                                <h4 className={`text-sm font-medium   ${isSertif ? 'text-slate-800' : 'text-slate-800'}`}>{emp.name}</h4>
                                <p className={`text-[9px] font-medium   mt-1 ${isSertif ? 'text-slate-800' : 'text-slate-500'}`}>PROTO_ID: {emp.id} | {emp.role}</p>
                             </div>
                          </div>
                          {isSertif ? (
                             <CheckCircle2 size={24} className="text-slate-800" />
                          ) : (
                             <div className="w-6 h-6 rounded-full border-2 border-slate-200 transition-colors"></div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
 
        {/* RIGHT COLUMN: PENALTIES & RATES */}
        <div className="lg:col-span-5 space-y-10">
           
           {/* REVENUE & TRANSPORT PROTOCOLS */}
           <div className="mansaba-card !p-10 border-l-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
              <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8">
                 <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} />
                 </div>
                 <h2 className="text-xl font-medium text-slate-800">Revenue <span className="text-emerald-400">Nodes</span></h2>
              </div>
 
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em] flex justify-between px-2">
                       <span>Standard Protocol</span>
                       <span className="text-emerald-400 italic">Daily_Yield</span>
                    </label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-500/40">IDR</span>
                       <input 
                          type="number"
                          className="mansaba-input w-full !pl-16 !py-5 font-medium text-lg font-medium text-slate-800 /40" 
                          value={settings.rate_umum}
                          onChange={e => setSettings({...settings, rate_umum: e.target.value})}
                       />
                    </div>
                 </div>
 
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em] flex justify-between px-2">
                       <span>Certified Protocol</span>
                       <span className="text-emerald-400 italic">Daily_Yield</span>
                    </label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-500/40">IDR</span>
                       <input 
                          type="number"
                          className="mansaba-input w-full !pl-16 !py-5 font-medium text-lg font-medium text-slate-800 /40" 
                          value={settings.rate_sertif}
                          onChange={e => setSettings({...settings, rate_sertif: e.target.value})}
                       />
                    </div>
                 </div>
 
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em] flex justify-between px-2">
                       <span>Anomaly Deduction</span>
                       <span className="text-rose-400 italic">Static_Yield</span>
                    </label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium text-rose-500/40">IDR</span>
                       <input 
                          type="number"
                          className="mansaba-input w-full !pl-16 !py-5 font-medium text-lg font-medium text-rose-400 !bg-rose-500/5 !border-rose-500/20 /40" 
                          value={settings.rate_tidak_disiplin}
                          onChange={e => setSettings({...settings, rate_tidak_disiplin: e.target.value})}
                       />
                    </div>
                 </div>
 
                 <div className="pt-10 border-t border-slate-200 mt-10">
                    <div className="space-y-3">
                       <label className="text-[10px] font-medium text-amber-400 tracking-[0.3em] flex items-center gap-3 px-2">
                          <Ticket size={14} /> Nutrition Voucher Offset
                       </label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium text-amber-500/40">IDR</span>
                          <input 
                             type="number"
                             className="mansaba-input w-full !pl-16 !py-5 font-medium text-lg font-medium text-amber-400 !bg-amber-500/5 !border-amber-500/20 /40" 
                             value={settings.voucher_nominal}
                             onChange={e => setSettings({...settings, voucher_nominal: e.target.value})}
                          />
                       </div>
                       <p className="text-[9px] font-medium text-slate-500 mt-4 italic px-2 tracking-[0.2em] leading-relaxed">System automates monthly gross subtraction. Floor value locked at RP 0.</p>
                    </div>
                 </div>
              </div>
           </div>
 
           {/* LOGIC & LATENCY PENALTIES */}
           <div className="mansaba-card !p-10 border-l-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
              <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8">
                 <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    <Clock size={24} />
                 </div>
                 <h2 className="text-xl font-medium text-slate-800">Logic <span className="text-amber-400">Latency</span></h2>
              </div>
 
              <div className="grid grid-cols-1 gap-12">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em]">Entry Anomaly Drip</label>
                       <Activity size={16} className="text-amber-500/40" />
                    </div>
                    <div className="flex items-center gap-6">
                       <input 
                          type="number" 
                          className="mansaba-input flex-1 !py-5 font-medium text-xl font-semibold text-center text-amber-400 !bg-white/[0.02]"
                          value={settings.penalty_late_minutes}
                          onChange={e => setSettings({...settings, penalty_late_minutes: e.target.value})}
                       />
                       <span className="text-[11px] font-medium text-slate-500 w-10">MINS</span>
                    </div>
                 </div>
 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-medium text-slate-500 tracking-[0.3em]">Exit Anomaly Drip</label>
                       <Activity size={16} className="text-amber-500/40" />
                    </div>
                    <div className="flex items-center gap-6">
                       <input 
                          type="number" 
                          className="mansaba-input flex-1 !py-5 font-medium text-xl font-semibold text-center text-amber-400 !bg-white/[0.02]"
                          value={settings.penalty_early_minutes}
                          onChange={e => setSettings({...settings, penalty_early_minutes: e.target.value})}
                       />
                       <span className="text-[11px] font-medium text-slate-500 w-10">MINS</span>
                    </div>
                 </div>
              </div>
           </div>
 
           {/* RECOVERY COMMANDS */}
           <div className="mansaba-card !p-10 border-t-4 border-slate-200 bg-white/[0.01]">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-12 h-12 bg-white/[0.03] text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center">
                    <Database size={24} />
                 </div>
                 <h2 className="text-sm font-medium text-slate-800">System <span className="text-slate-800">Recovery</span></h2>
              </div>
              
              <div className="space-y-4">
                <input type="file" className="hidden" id="restore-input" accept=".json" onChange={handleRestore} />
                <label 
                  htmlFor="restore-input"
                  className="w-full bg-white/[0.02] border border-slate-200 p-6 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors shadow-sm"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                         <Upload size={18} />
                      </div>
                      <span className="text-[10px] font-medium text-slate-800 tracking-[0.2em]">Import Neural Backup</span>
                   </div>
                   <span className="text-[11px] font-medium text-slate-500 transition-colors">RESTORE_CORE</span>
                </label>
              </div>
           </div>
        </div>
 
      </div>
    </div>
  );
};

export default SettingsPage;

