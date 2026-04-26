import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { 
  DollarSign, 
  Settings, 
  Users, 
  Calendar, 
  Printer, 
  Search, 
  Activity, 
  Wallet, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Target,
  Layers,
  CircleDot,
  CheckCircle2
} from 'lucide-react';

const API_URL = '/api';

const HonorPage = () => {
  const [activeTab, setActiveTab] = useState<'recap' | 'settings'>('recap');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [honorData, setHonorData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [rates, setRates] = useState({
    rate_umum: '25000',
    rate_sertif: '25000',
    rate_tidak_disiplin: '10000',
    voucher_nominal: '30000'
  });
  const [certifiedIds, setCertifiedIds] = useState<number[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, setRes, honorRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/honor/recap`, { params: { month: selectedMonth, year: selectedYear } })
      ]);
      
      setEmployees(empRes.data);
      setCertifiedIds(empRes.data.filter((e: any) => e.isSertifikasi).map((e: any) => e.id));
      setHonorData(honorRes.data);

      const newRates = { ...rates };
      setRes.data.forEach((s: any) => {
        if (s.key in newRates) (newRates as any)[s.key] = s.value;
      });
      setRates(newRates);
    } catch (err) {
      toast.error('Financial data synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await Promise.all([
        axios.post(`${API_URL}/settings`, { settings: Object.entries(rates).map(([key, value]) => ({ key, value })) }),
        axios.post(`${API_URL}/employees/certification`, { employeeIds: certifiedIds })
      ]);
      toast.success('Financial protocols updated');
      fetchData();
    } catch (err) {
      toast.error('Protocol commitment failure');
    } finally {
      setLoading(false);
    }
  };

  const toggleCertified = (id: number) => {
    setCertifiedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredHonor = honorData.filter(h => h.employeeName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <Toaster 
        toastOptions={{
          style: {
            background: '#0a0a0f',
            color: '#fff',
            border: '1px solid rgba(168,85,247,0.2)',
            fontSize: '11px',
            textTransform: '',
            fontWeight: 'bold'
          }
        }} 
      />
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 pb-12 border-b border-slate-200">
        <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <DollarSign size={32} />
            </div>
            <div>
                <h2 className="text-lg font-medium font-semibold font-medium text-slate-800">FINANCIAL <span className="text-blue-600 italic">CORE</span></h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-medium text-slate-500 tracking-[0.4em]">Asset Allocation Analysis</span>
                  <div className="h-0.5 w-12 bg-blue-50"></div>
                </div>
            </div>
        </div>
        
        <div className="flex bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('recap')} 
              className={`px-10 py-3 rounded-xl text-[9px] font-medium  tracking-[0.3em] transition-colors  whitespace-nowrap ${activeTab === 'recap' ? 'bg-primary text-slate-800 shadow-[0_10px_30px_rgba(168,85,247,0.3)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              DISBURSEMENT
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`px-10 py-3 rounded-xl text-[9px] font-medium  tracking-[0.3em] transition-colors  whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-slate-800 shadow-[0_10px_30px_rgba(168,85,247,0.3)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              REGULATIONS
            </button>
        </div>
      </header>

      {activeTab === 'recap' ? (
        <div className="space-y-12">
           {/* METRICS */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <SummaryCard label="NETTO_DISBURSED" val={`Rp ${honorData.reduce((acc,c)=>acc+c.netto,0).toLocaleString()}`} icon={Wallet} color="primary" />
              <SummaryCard label="DISCIPLINED_PHASE" val={honorData.reduce((acc,c)=>acc+c.disciplinedDays,0)} icon={ShieldCheck} color="emerald" />
              <SummaryCard label="LATENCY_FAULTS" val={honorData.reduce((acc,c)=>acc+c.nonDisciplinedDays,0)} icon={AlertTriangle} color="rose" />
              <SummaryCard label="ACTIVE_WINDOW" val={format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy')} icon={Calendar} color="dim" />
           </div>

           {/* FILTER CONTROL */}
           <div className="bg-white/[0.02] border border-slate-200 rounded-[2.5rem] p-6 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 -focus-within:text-blue-600 transition-colors" size={18} />
                 <input className="mansaba-input !pl-16 !bg-white" placeholder="QUERY_PERSONNEL_NAME..." value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              
              <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                 <div className="flex bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <select className="bg-transparent border-none text-[10px] font-medium text-slate-500 px-6 py-2 outline-none cursor-pointer hover:text-slate-800 transition-colors" value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))}>
                       {Array.from({length:12}, (_,i)=><option key={i+1} value={i+1} className="bg-white text-slate-800">{format(new Date(2022,i,1),'MMMM')}</option>)}
                    </select>
                    <div className="w-px h-6 bg-white/10 self-center"></div>
                    <select className="bg-transparent border-none text-[10px] font-medium text-slate-500 px-6 py-2 outline-none cursor-pointer hover:text-slate-800 transition-colors" value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))}>
                       {[2024,2025,2026].map(y=><option key={y} value={y} className="bg-white text-slate-800">{y}</option>)}
                    </select>
                 </div>
                 <button onClick={()=>window.print()} className="w-10 h-10 bg-white/[0.02] text-blue-600 border border-blue-200 rounded-lg flex items-center justify-center hover:bg-primary hover:text-slate-800 transition-colors">
                   <Printer size={20} className="transition-transform" />
                 </button>
              </div>
           </div>

           {/* MAIN DATA TABLE */}
           <div className="mansaba-card !p-0 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                 <table className="mansaba-table">
                    <thead>
                       <tr>
                          <th className="mansaba-th px-10 border-slate-200 py-8">OPERATIVE_CORE</th>
                          <th className="mansaba-th text-center border-slate-200">NODE_STATUS</th>
                          <th className="mansaba-th text-center border-slate-200">COMPLIANT</th>
                          <th className="mansaba-th text-center border-slate-200">VOLATILE</th>
                          <th className="mansaba-th text-right border-slate-200">BRUTO (Rp)</th>
                          <th className="mansaba-th text-right border-slate-200">MODIFIERS</th>
                          <th className="mansaba-th text-right px-10 bg-blue-50 text-blue-600 border-blue-200">TOTAL_NETTO</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                       {filteredHonor.map(h => (
                          <tr key={h.employeeId} className="tr-hover">
                             <td className="mansaba-td px-10 py-6">
                                <div className="flex flex-col">
                                   <span className="text-base font-medium text-slate-800 mb-1.5 leading-none">{h.employeeName}</span>
                                   <div className="flex items-center gap-2 italic">
                                     <Layers size={10} className="text-blue-600" />
                                     <span className="text-[9px] font-medium text-slate-500 tracking-[0.2em]">{h.role || 'GURU_MADRASAH'}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="mansaba-td text-center py-0">
                                <div className={`px-5 py-2 rounded-xl text-[9px] font-medium  tracking-[0.2em] inline-flex items-center gap-2 border transition-colors ${
                                  h.isSertifikasi ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-white/[0.02] text-slate-500 border-slate-200'
                                }`}>
                                   {h.isSertifikasi ? <ShieldCheck size={12} /> : <CircleDot size={12} />}
                                   {h.isSertifikasi ? 'CERTIFIED' : 'UNVERIFIED'}
                                </div>
                             </td>
                             <td className="mansaba-td text-center">
                                <div className="inline-flex flex-col items-center -[-2px] transition-transform">
                                   <span className="text-base font-medium text-emerald-400">{h.disciplinedDays}</span>
                                   <span className="text-[8px] font-medium text-slate-500">SESSIONS</span>
                                </div>
                             </td>
                             <td className="mansaba-td text-center">
                                <div className="inline-flex flex-col items-center -[-2px] transition-transform">
                                   <span className="text-base font-medium text-rose-500">{h.nonDisciplinedDays}</span>
                                   <span className="text-[8px] font-medium text-slate-500">SESSIONS</span>
                                </div>
                             </td>
                             <td className="mansaba-td text-right font-medium text-slate-800 text-xs">
                                {h.bruto.toLocaleString()}
                             </td>
                             <td className="mansaba-td text-right text-rose-500/40 text-xs italic">
                                -{h.voucherNominal.toLocaleString()}
                             </td>
                             <td className="mansaba-td text-right px-10 bg-blue-50">
                                <div className="inline-block px-6 py-3 bg-primary text-slate-800 font-medium text-sm rounded-xl shadow-[0_8px_25px_rgba(168,85,247,0.3)]">
                                   Rp {h.netto.toLocaleString()}
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           {/* RATES SETTINGS */}
           <div className="lg:col-span-4 space-y-8">
              <div className="mansaba-card !p-12 border-blue-200 shadow-sm">
                 <h4 className="text-[10px] font-medium text-blue-600 tracking-[0.4em] mb-12 flex items-center gap-3">
                    <Activity size={18} /> FINANCIAL_REGULATIONS
                 </h4>
                 <div className="space-y-10">
                    {[
                      { key: 'rate_umum', label: 'GENERAL_NODE_RATE', icon: Users },
                      { key: 'rate_sertif', label: 'CERTIFIED_NODE_RATE', icon: ShieldCheck },
                      { key: 'rate_tidak_disiplin', label: 'VOLATILE_PENALTY_RATE', icon: AlertTriangle },
                      { key: 'voucher_nominal', label: 'VOUCHER_DEDUCTION', icon: Target },
                    ].map(f => (
                      <div key={f.key} className="space-y-3">
                         <label className="text-[9px] font-medium text-slate-500 tracking-[0.3em] block ml-2">{f.label}</label>
                         <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-medium -focus-within:brightness-150 transition-colors opacity-40">Rp</div>
                            <input 
                              type="number"
                              className="mansaba-input !pl-16 !bg-white !py-5 font-medium"
                              value={(rates as any)[f.key]}
                              onChange={e => setRates({...rates, [f.key]: e.target.value})}
                            />
                         </div>
                      </div>
                    ))}
                 </div>
                 <button onClick={handleSaveSettings} className="mansaba-btn-primary w-full !h-10 mt-12 shadow-[0_20px_50px_rgba(168,85,247,0.3)] flex items-center justify-center gap-4">
                    <Zap size={20} className="transition-transform" />
                    <span>COMMIT_REGULATIONS</span>
                 </button>
              </div>
           </div>

           {/* CERTIFICATION SELECTION */}
           <div className="lg:col-span-8 mansaba-card !p-0 overflow-hidden border-slate-200 shadow-sm">
              <div className="p-12 border-b border-slate-200 bg-white/[0.01] flex items-center justify-between">
                 <div>
                    <h4 className="text-lg font-medium text-slate-800 mb-2">VERIFICATION_MATRIX</h4>
                    <p className="text-[10px] font-medium text-slate-500 tracking-[0.3em] opacity-60">Authorize nodes for premium certification protocols.</p>
                 </div>
                 <div className="px-8 py-3.5 bg-primary text-slate-800 rounded-[1.5rem] font-medium text-[10px] shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-3">
                   <Target size={14} />
                   {certifiedIds.length} ACTIVE_LEASES
                 </div>
              </div>
              <div className="p-12">
                 <div className="relative mb-10">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 -focus-within:text-blue-600 transition-colors" size={18} />
                    <input className="mansaba-input !pl-16 !bg-white !py-5" placeholder="QUERY_PERSONNEL_TO_VERIFY..." value={search} onChange={e=>setSearch(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[550px] overflow-y-auto no-scrollbar pr-4">
                    {employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(emp => (
                       <button 
                          key={emp.id}
                          onClick={() => toggleCertified(emp.id)}
                          className={`p-8 rounded-[2.5rem] border transition-colors  flex items-center justify-between  relative overflow-hidden ${certifiedIds.includes(emp.id) ? 'bg-primary border-blue-200 shadow-[0_15px_40px_rgba(168,85,247,0.2)] scale-[1.02]' : 'bg-white/[0.01] border-slate-200 hover:border-blue-200 hover:bg-white/[0.02]'}`}
                       >
                          {certifiedIds.includes(emp.id) && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>}
                          <div className="text-left relative z-10">
                             <p className={`text-base font-medium   leading-none mb-2 ${certifiedIds.includes(emp.id) ? 'text-slate-800' : 'text-slate-800'}`}>{emp.name}</p>
                             <div className="flex items-center gap-2">
                                <code className={`text-[9px] font-medium   ${certifiedIds.includes(emp.id) ? 'text-slate-800' : 'text-slate-500'}`}>UNIT_ID: #{emp.id}</code>
                             </div>
                          </div>
                          <div className={`text-xl relative z-10 transition-colors  ${certifiedIds.includes(emp.id) ? 'text-slate-800 ' : 'text-slate-800'}`}>
                             {certifiedIds.includes(emp.id) ? <CheckCircle2 size={24} /> : <CircleDot size={24} />}
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PRINT VERSION */}
      <div className="hidden print:block p-16 bg-white text-black font-sans">
          <div className="text-center mb-16 border-b-8 border-black pb-10">
              <h1 className="text-xl font-semibold font-medium">Laporan Pembayaran Honor Transport</h1>
              <h2 className="text-xl font-medium mt-3">MAN 1 BANYUPUTIH BATANG</h2>
              <p className="text-[11px] font-medium mt-5 tracking-[0.4em] text-slate-500 border border-slate-200 inline-block px-10 py-2">PERIODE AUDIT: {format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy')}</p>
          </div>
          <table className="w-full border-collapse border-4 border-black text-[11px]">
             <thead>
                <tr className="bg-slate-200">
                  <th className="border-4 border-black p-5 text-center font-medium">NO</th>
                  <th className="border-4 border-black p-5 text-left font-medium">Nama Lengkap Pegawai / Jabatan</th>
                  <th className="border-4 border-black p-5 text-center font-medium">Klasifikasi</th>
                  <th className="border-4 border-black p-5 text-center font-medium">Hadir</th>
                  <th className="border-4 border-black p-5 text-right font-medium">Bruto</th>
                  <th className="border-4 border-black p-5 text-right font-medium">Potongan</th>
                  <th className="border-4 border-black p-5 text-right font-medium bg-slate-300">Total Netto</th>
                </tr>
             </thead>
             <tbody>
                {filteredHonor.map((h, i) => (
                   <tr key={h.employeeId}>
                      <td className="border-4 border-black p-4 text-center font-medium">{i+1}</td>
                      <td className="border-4 border-black p-4 font-medium text-xs">
                        {h.employeeName}
                        <p className="text-[9px] font-medium text-slate-500 mt-1">{h.role || 'GURU MADRASAH'}</p>
                      </td>
                      <td className="border-4 border-black p-4 text-center font-medium">{h.isSertifikasi ? 'Sertifikasi' : 'Umum'}</td>
                      <td className="border-4 border-black p-4 text-center font-medium">{h.disciplinedDays} HARI</td>
                      <td className="border-4 border-black p-4 text-right font-medium">{h.bruto.toLocaleString()}</td>
                      <td className="border-4 border-black p-4 text-right italic text-slate-400">-{h.voucherNominal.toLocaleString()}</td>
                      <td className="border-4 border-black p-4 text-right font-medium text-xs bg-slate-50">Rp {h.netto.toLocaleString()}</td>
                   </tr>
                ))}
                <tr className="bg-slate-100/50 text-slate-800">
                   <td colSpan={6} className="border-4 border-black p-6 text-right font-medium text-base italic">Total Dana Dicairkan (Netto)</td>
                   <td className="border-4 border-black p-6 text-right font-medium text-lg">Rp {honorData.reduce((acc,c)=>acc+c.netto,0).toLocaleString()}</td>
                </tr>
             </tbody>
          </table>
          <div className="flex justify-between items-start mt-24 px-20">
              <div className="text-center font-medium">
                 <p className="mb-28">Mengetahui,<br/>Kepala Madrasah</p>
                 <p className="underline font-medium text-sm">Drs. H. MUKHLISIN, M.Pd</p>
                 <p className="text-[11px] font-medium mt-2">NIP. 196805121994031002</p>
              </div>
              <div className="text-center font-medium">
                 <p className="mb-28">Bendahara,</p>
                 <p className="underline font-medium text-sm">NURUL HIKMAH, S.Pd</p>
                 <p className="text-[11px] font-medium mt-2">NIP. 198204152005012003</p>
              </div>
          </div>
      </div>

      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          div:not(.print\:block), header, nav, aside, footer { display: none !important; }
          .print\:block { display: block !important; position: static !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 2px solid black !important; }
        }
      `}</style>
    </div>
  );
};

const SummaryCard = ({ label, val, icon: Icon, color }: any) => {
  const colorMap: any = {
    primary: 'text-blue-600 bg-blue-50 border-blue-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    dim: 'text-slate-500 bg-white/[0.02] border-slate-200'
  };

  return (
    <div className="mansaba-card !p-8 hover:translate-y-[-8px] transition-colors shadow-sm border-slate-200">
       <div className="flex items-center gap-6">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colorMap[color]} shadow-sm  transition-transform `}>
             <Icon size={24} />
          </div>
          <div>
             <p className="text-[9px] font-medium text-slate-500 tracking-[0.4em] mb-2 leading-none">{label}</p>
             <h4 className="text-xl font-medium text-slate-800 leading-none">{val}</h4>
          </div>
       </div>
    </div>
  );
};

export default HonorPage;
