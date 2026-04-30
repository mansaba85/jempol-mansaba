import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import TimetablesPage from './pages/TimetablesPage';
import AbsentReportPage from './pages/AbsentReportPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import RecapPage from './pages/RecapPage';
import HonorPage from './pages/HonorPage';
import RosterPage from './pages/RosterPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { Toaster } from 'react-hot-toast';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { Home, LayoutGrid, ArrowRightLeft, LogOut } from 'lucide-react';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading) return null;
  if (!user) return <LoginPage />;

  const isEmployee = user.role === 'EMPLOYEE';

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {!isEmployee && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* TOP HEADER MOBILE - Only for Admin or desktop */}
        {(!isEmployee || !location.pathname.startsWith('/')) && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 xl:hidden sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50">
                <i className="fa-solid fa-fingerprint text-lg"></i>
              </div>
              <span className="font-bold text-slate-800">{settings.app_name}</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto no-scrollbar relative min-h-screen ${isEmployee ? 'pb-24' : ''}`}>
          <div className={`${!isEmployee ? 'max-w-7xl mx-auto p-6 md:p-8 xl:p-10' : ''} min-h-screen`}>
            <Routes>
              {/* Admin Routes */}
              {user.role === 'ADMIN' && (
                <>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/devices" element={<DevicesPage />} />
                  <Route path="/timetables" element={<TimetablesPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/reports/absent" element={<AbsentReportPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/recap" element={<RecapPage />} />
                  <Route path="/roster" element={<RosterPage />} />
                  <Route path="/honor" element={<HonorPage />} />
                </>
              )}

              {/* Employee Routes */}
              {user.role === 'EMPLOYEE' && (
                <>
                  <Route path="/" element={<EmployeeDashboard />} />
                  <Route path="/history" element={<EmployeeDashboard />} />
                </>
              )}
              
              {/* Catch-all for unknown routes */}
              <Route path="*" element={user.role === 'ADMIN' ? <DashboardPage /> : <EmployeeDashboard />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* COMPACT BOTTOM NAV FOR EMPLOYEE */}
      {isEmployee && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-br from-[#6c5ce7] to-[#8258e5] flex items-center justify-around px-6 z-[100] rounded-t-[2.5rem] shadow-2xl xl:hidden border-t border-white/10">
           <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/' ? 'text-white scale-110' : 'text-white/40'}`}>
              <Home size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
           </button>
           
           <button onClick={() => navigate('/history')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/history' ? 'text-white scale-110' : 'text-white/40'}`}>
              <LayoutGrid size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-widest">Presensi</span>
           </button>
           
           <button className="flex flex-col items-center gap-1 text-white/20 cursor-not-allowed">
              <ArrowRightLeft size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-widest">Shift</span>
           </button>
           
           <button onClick={logout} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all duration-300">
              <LogOut size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-widest">Keluar</span>
           </button>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}

export default AppContent;
