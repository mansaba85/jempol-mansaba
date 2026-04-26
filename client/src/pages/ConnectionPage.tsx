import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionPage = () => {
  const [data, setData] = useState<any>(null);
  const [dbCount, setDbCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: "", percent: 0, details: "" });

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/machine/status');
      if (res.data.status === 'Connected') {
        setData(res.data);
        setDbCount(res.data.dbCount);
        return true;
      }
    } catch (err) { console.error("Gagal ambil stats"); }
    return false;
  };

  const toggleConnection = async () => {
    setLoading(true);
    if (!isConnected) {
      const success = await fetchStats();
      if (success) setIsConnected(true);
      else alert("Gagal terhubung ke mesin!");
    } else {
      setIsConnected(false);
      setData(null);
    }
    setLoading(false);
  };

  const startSyncStream = () => {
    setLoading(true);
    setProgress({ step: "Memulai Sinkronisasi Semua Perangkat...", percent: 0, details: "" });
    const eventSource = new EventSource('/api/machine/sync-all');
    eventSource.onmessage = async (event) => {
      const update = JSON.parse(event.data);
      setProgress(update);
      if (update.percent === 100) {
        eventSource.close();
        setLoading(false);
        await fetchStats(); 
      }
      if (update.step === 'Error') {
        eventSource.close();
        setLoading(false);
      }
    };
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-2 h-10 bg-primary/20 rounded-full"></div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Pusat Sinkronisasi</h2>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Tarik data presensi dari seluruh mesin ke database pusat</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        <div className="card-mansaba !p-10 flex flex-col justify-between border-slate-100/80 shadow-xl shadow-slate-100/50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 pb-4 border-b border-slate-50 flex items-center justify-between">
            Status Jaringan <span>🌐</span>
          </h3>
          <div className="flex flex-col items-center py-10">
            <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-8 border-4 transition-all duration-500 shadow-2xl ${isConnected ? 'bg-primary/5 border-primary text-primary shadow-primary/20 scale-110' : 'bg-surface-50 border-slate-100 text-slate-200'}`}>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.59 16.11a6 6 0 0 1 6.82 0M12 20h.01" /></svg>
            </div>
            <div className="text-center mb-12">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isConnected ? 'text-primary' : 'text-slate-300'}`}>Sistem Saat Ini</span>
              <h2 className={`text-3xl font-black tracking-tight mt-2 ${isConnected ? 'text-slate-800' : 'text-slate-200'}`}>{isConnected ? 'TERHUBUNG' : 'TERPUTUS'}</h2>
            </div>
            <button 
              onClick={toggleConnection} 
              disabled={loading} 
              className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 ${isConnected ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 shadow-rose-500/10' : 'btn-mansaba shadow-primary/20'}`}
            >
              {loading ? 'MEMPROSES...' : (isConnected ? 'PUTUSKAN KONEKSI' : 'HUBUNGKAN SEKARANG')}
            </button>
          </div>
        </div>

        <div className={`card-mansaba !p-10 flex flex-col justify-between transition-all duration-700 border-slate-100/80 shadow-xl shadow-slate-100/50 ${isConnected ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-4 grayscale blur-[2px] pointer-events-none'}`}>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 pb-4 border-b border-slate-50 flex items-center justify-between">
            Ringkasan Statistik <span>📊</span>
          </h3>
          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-between p-6 bg-surface-50 rounded-[2rem] border border-slate-100 group hover:border-primary/20 transition-all">
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Antrian di Mesin</p>
                 <p className="font-black text-slate-800 text-3xl tracking-tighter">{data?.info?.logCount ?? '-'}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
               </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-surface-50 rounded-[2rem] border border-slate-100 group hover:border-primary/20 transition-all">
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Database MANSABA</p>
                 <p className="font-black text-primary text-3xl tracking-tighter">{dbCount?.toLocaleString() ?? '0'}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H3v5m0 0v5h18v-5M3 12h18" /></svg>
               </div>
            </div>
          </div>
          <button onClick={startSyncStream} disabled={loading} className="btn-mansaba w-full !py-5 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] font-black text-[11px]">
             Sinkronisasi Semua Perangkat
          </button>
        </div>
      </div>

      {progress.percent > 0 && (
        <div className="mt-12 card-mansaba !p-12 shadow-2xl border-primary/10 animate-in slide-in-from-bottom-12 duration-700 bg-white">
          <div className="flex justify-between items-end mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">{progress.step}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{progress.details || 'Menunggu pemrosesan data...'}</p>
            </div>
            <span className="font-black text-primary text-5xl tracking-tighter leading-none">{progress.percent}<span className="text-xl ml-1">%</span></span>
          </div>
          <div className="w-full h-4 bg-surface-100 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(8,104,98,0.4)]" style={{ width: `${progress.percent}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPage;
