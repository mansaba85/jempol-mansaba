import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <LoginPage />;

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* TOP HEADER MOBILE */}
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

          <main className="flex-1 overflow-y-auto no-scrollbar relative min-h-screen">
            {/* Dark background for header in dashboard pages is handled by the pages themselves 
                but we need to make sure padding doesn't push it down incorrectly */}
            <div className="max-w-7xl mx-auto min-h-screen">
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
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default AppContent;
