import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ConnectionPage from './pages/ConnectionPage';
import DevicesPage from './pages/DevicesPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import ShiftsPage from './pages/ShiftsPage';
import ReportsPage from './pages/ReportsPage';
import RosterPage from './pages/RosterPage';
import TimetablesPage from './pages/TimetablesPage';

function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <Router>
      <div className="mansaba-app-frame relative bg-white flex min-h-screen">
        {/* Mobile Sidebar Backdrop */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] xl:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        
        <div className="content-area flex-1 flex flex-col min-w-0">
          <header className="h-14 lg:h-16 flex items-center justify-between px-6 lg:px-10 shrink-0 glass-header sticky top-0 z-[50] border-b border-slate-100">
             <div className="flex items-center gap-4">
                {/* Hamburger Button */}
                <button 
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                  className="xl:hidden w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center border border-slate-100"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </button>

                <div className="hidden sm:block">
                   <h2 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                     Dashboard <span className="text-primary">Presensi</span>
                     <span className="h-4 w-[1px] bg-slate-200 mx-2"></span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">v4.0.2</span>
                   </h2>
                </div>
             </div>
             
             <div className="flex items-center gap-4 lg:gap-8">
                <div className="hidden lg:block relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <input 
                    className="input-mansaba !py-2 w-64 pl-10 text-xs"
                    placeholder="Pencarian..."
                  />
                </div>
                <div className="flex items-center gap-3 lg:border-l border-slate-100 lg:pl-8">
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-800 leading-none">IT MANSABA</p>
                   </div>
                   <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-primary/20">ADM</div>
                </div>
             </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-12">
            <Routes>
              <Route path="/" element={<DashboardPlaceHolder />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/connection" element={<ConnectionPage />} />
              <Route path="/timetables" element={<TimetablesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/roster" element={<RosterPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

const DashboardPlaceHolder = () => (
  <div className="animate-in fade-in duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
      {[
        { l: 'Total Pegawai', v: '124', c: 'border-l-primary', i: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
        { l: 'Hadir Hari Ini', v: '86', c: 'border-l-emerald-500', i: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
        { l: 'Izin / Sakit', v: '04', c: 'border-l-amber-500', i: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
        { l: 'Efisiensi', v: '92%', c: 'border-l-blue-500', i: 'M18 20V10M12 20V4M6 20v-6' },
      ].map((s, i) => (
        <div key={i} className={`card-mansaba border-l-4 ${s.c} group`}>
           <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.l}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d={s.i} />
                </svg>
              </div>
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800 tracking-tight">{s.v}</span>
              <span className="text-[10px] font-bold text-emerald-500">+2.4%</span>
           </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
       <div className="card-mansaba !p-6 md:!p-8">
          <h3 className="text-xs md:text-sm font-bold text-slate-800 mb-6 md:mb-8 border-b border-slate-50 pb-4">Laporan Harian</h3>
          <div className="h-40 md:h-48 bg-slate-50/50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Analitik Siap</p>
          </div>
       </div>
       <div className="card-mansaba !p-6 md:!p-8">
          <h3 className="text-xs md:text-sm font-bold text-slate-800 mb-6 md:mb-8 border-b border-slate-50 pb-4">Log Terkini</h3>
          <div className="space-y-2">
             {[1,2,3].map(i => (
               <div key={i} className="text-[9px] md:text-[10px] font-bold text-slate-500 bg-slate-50 p-3 rounded-lg flex justify-between">
                  <span>Sinkronisasi {i} Berhasil</span>
                  <span className="text-emerald-500">SUCCESS</span>
               </div>
             ))}
          </div>
       </div>
    </div>
  </div>
);

export default App;
