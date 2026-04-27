import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ConnectionPage from './pages/ConnectionPage';
import DevicesPage from './pages/DevicesPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import RosterPage from './pages/RosterPage';
import TimetablesPage from './pages/TimetablesPage';
import RecapPage from './pages/RecapPage';
import HonorPage from './pages/HonorPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-indigo-600/10 selection:text-indigo-600 overflow-hidden">
        
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[55] xl:hidden animate-in fade-in duration-500"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          
          {/* COMPACT PREMIUM HEADER */}
          <header className="h-16 lg:h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-white/80 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-200/50 shadow-sm">
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                  className="xl:hidden w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                </button>
                <div className="flex flex-col">
                   <h2 className="text-lg font-black text-slate-900 tracking-tighter font-heading uppercase leading-none">
                     INSTITUTIONAL <span className="text-indigo-600 italic">CORE</span>
                   </h2>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Link</p>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-6 lg:gap-10">
                <div className="hidden md:flex items-center gap-6 pr-10 border-r border-slate-100">
                   <div className="flex flex-col items-end">
                      <p className="text-[9px] font-black text-slate-900 tracking-widest leading-none mb-1 uppercase">Audit Shield</p>
                      <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest opacity-60">V4.0.2 SECURE</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs font-black text-slate-900 leading-none mb-1 uppercase">JARIKU MANSABA</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admin Console</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-[10px] border-2 border-white ring-2 ring-slate-100">MAN</div>
                </div>
             </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 bg-slate-50">
            <div className="max-w-[1600px] mx-auto">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/devices" element={<DevicesPage />} />
                <Route path="/connection" element={<ConnectionPage />} />
                <Route path="/timetables" element={<TimetablesPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/roster" element={<RosterPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/recap" element={<RecapPage />} />
                <Route path="/honor" element={<HonorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
