import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const ConnectionPage = () => {
  const [data, setData] = useState<any>(null);
  const [dbCount, setDbCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: "", percent: 0, details: "" });
  const [syncComplete, setSyncComplete] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/machine/status');
      if (res.data.status === 'Connected') {
        setData(res.data);
        setDbCount(res.data.dbCount);
        return true;
      }
    } catch (err) { console.error("Gagal mendapatkan status mesin"); }
    return false;
  };

  const toggleConnection = async () => {
    setLoading(true);
    if (!isConnected) {
      const success = await fetchStats();
      if (success) {
         setIsConnected(true);
         toast.success('Mesin berhasil terhubung');
      } else {
         toast.error("Gagal terhubung ke mesin!");
      }
    } else {
      setIsConnected(false);
      setData(null);
      toast.success('Koneksi mesin diputus');
    }
    setLoading(false);
  };

  const startSyncStream = () => {
    setLoading(true);
    setSyncComplete(false);
    setProgress({ step: "Memulai Sinkronisasi Semua Perangkat...", percent: 0, details: "" });
    const eventSource = new EventSource('/api/machine/sync-all');
    
    eventSource.onmessage = async (event) => {
      const update = JSON.parse(event.data);
      setProgress(update);
      
      if (update.percent === 100) {
        eventSource.close();
        setLoading(false);
        setSyncComplete(true);
        toast.success("Sinkronisasi data selesai");
        await fetchStats(); 
        setTimeout(() => {
           setProgress({ step: "", percent: 0, details: "" });
           setSyncComplete(false);
        }, 5000); // Sembunyikan progress bar setelah 5 detik
      }
      
      if (update.step === 'Error') {
        eventSource.close();
        setLoading(false);
        toast.error("Terjadi kesalahan saat sinkronisasi");
      }
    };
    
    eventSource.onerror = () => {
       eventSource.close();
       setLoading(false);
    };
  };

  useEffect(() => {
    fetchStats().then(success => {
       if (success) setIsConnected(true);
    });
  }, []);

  return (
    <div className="space-y-6">
      <Toaster />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Pusat Sinkronisasi</h2>
           <p className="text-sm text-slate-500 mt-1">Tarik dan sinkronisasikan data presensi dari seluruh mesin ke database pusat.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NETWORK STATUS CARD */}
        <div className="mansaba-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
             <h3 className="text-sm font-semibold text-slate-700">Status Jaringan Perangkat</h3>
             <i className="fa-solid fa-globe text-slate-400"></i>
          </div>
          
          <div className="flex flex-col items-center py-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 transition-colors ${isConnected ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
               <i className="fa-solid fa-wifi text-3xl"></i>
            </div>
            
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status Koneksi</span>
              <h2 className={`text-xl font-bold ${isConnected ? 'text-blue-600' : 'text-slate-400'}`}>{isConnected ? 'TERHUBUNG' : 'TERPUTUS'}</h2>
            </div>
            
            <button 
              onClick={toggleConnection} 
              disabled={loading} 
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors border ${isConnected ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'mansaba-btn-primary hover:bg-blue-700'}`}
            >
              {loading ? (
                 <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Memproses...</>
              ) : isConnected ? (
                 <><i className="fa-solid fa-link-slash mr-2"></i> Putuskan Koneksi</>
              ) : (
                 <><i className="fa-solid fa-link mr-2"></i> Hubungkan Sekarang</>
              )}
            </button>
          </div>
        </div>

        {/* STATS & SYNC CARD */}
        <div className={`mansaba-card flex flex-col justify-between transition-all duration-500 ${isConnected ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
             <h3 className="text-sm font-semibold text-slate-700">Ringkasan Data Sinkronisasi</h3>
             <i className="fa-solid fa-chart-simple text-slate-400"></i>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
               <div>
                 <p className="text-xs font-medium text-slate-500 mb-1">Antrian di Mesin</p>
                 <p className="font-semibold text-slate-800 text-2xl">{data?.info?.logCount?.toLocaleString() ?? '-'}</p>
               </div>
               <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <i className="fa-solid fa-server text-xl"></i>
               </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-100">
               <div>
                 <p className="text-xs font-medium text-blue-500 mb-1">Database MANSABA</p>
                 <p className="font-semibold text-blue-700 text-2xl">{dbCount?.toLocaleString() ?? '0'}</p>
               </div>
               <div className="w-12 h-12 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-500">
                  <i className="fa-solid fa-database text-xl"></i>
               </div>
            </div>
          </div>
          
          <button onClick={startSyncStream} disabled={loading || !isConnected} className="mansaba-btn-primary w-full py-3">
             <i className="fa-solid fa-rotate mr-2"></i> Mulai Sinkronisasi Total
          </button>
        </div>
      </div>

      {/* PROGRESS BAR SECTION */}
      {progress.percent > 0 && (
        <div className="mansaba-card mt-6 border-blue-200 bg-white">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <i className={`fa-solid ${syncComplete ? 'fa-check text-emerald-500' : 'fa-circle-notch fa-spin text-blue-500'}`}></i>
                <span className="font-semibold text-slate-800 text-sm">{progress.step}</span>
              </div>
              <p className="text-xs text-slate-500">{syncComplete ? 'Data telah berhasil dimasukkan ke dalam sistem.' : progress.details || 'Tunggu sebentar...'}</p>
            </div>
            <span className={`font-bold text-3xl ${syncComplete ? 'text-emerald-600' : 'text-blue-600'}`}>{progress.percent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className={`h-full rounded-full transition-all duration-300 ${syncComplete ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progress.percent}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPage;
