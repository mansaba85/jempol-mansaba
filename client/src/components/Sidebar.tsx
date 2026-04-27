import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  
  const adminGroups = [
    {
      title: 'Utama',
      items: [
        { path: '/', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
      ]
    },
    {
      title: 'Database Master',
      items: [
        { path: '/employees', label: 'Data Pegawai', icon: 'fa-solid fa-users' },
        { path: '/timetables', label: 'Jam Kerja', icon: 'fa-solid fa-clock' },
      ]
    },
    {
      title: 'Penjadwalan',
      items: [
        { path: '/roster', label: 'Pola Shift', icon: 'fa-solid fa-calendar-week' },
      ]
    },
    {
      title: 'Laporan',
      items: [
        { path: '/attendance', label: 'Log Presensi', icon: 'fa-solid fa-clipboard-check' },
        { path: '/reports/absent', label: 'Belum Hadir', icon: 'fa-solid fa-user-xmark' },
        { path: '/reports', label: 'Laporan Detil', icon: 'fa-solid fa-file-invoice' },
        { path: '/recap', label: 'Rekap Absensi', icon: 'fa-solid fa-chart-line' },
        { path: '/honor', label: 'Honor Transport', icon: 'fa-solid fa-money-check-dollar' },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { path: '/devices', label: 'Terminal Mesin', icon: 'fa-solid fa-microchip' },
        { path: '/settings', label: 'Pengaturan', icon: 'fa-solid fa-gears' },
      ]
    }
  ];

  const employeeGroups = [
    {
      title: 'Menu Mandiri',
      items: [
        { path: '/', label: 'Dashboard', icon: 'fa-solid fa-house-chimney' },
        { path: '/history', label: 'Riwayat Presensi', icon: 'fa-solid fa-history' },
      ]
    }
  ];

  const menuGroups = user?.role === 'ADMIN' ? adminGroups : employeeGroups;

  return (
    <>
      {/* OVERLAY BACKDROP (Auto-hide on click outside) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] xl:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[60] xl:sticky xl:top-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      w-[250px] flex flex-col h-screen bg-white shadow border-r border-slate-200 transition-all duration-300 ease-in-out
    `}>
      
      {/* BRANDING */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50">
            <i className="fa-solid fa-fingerprint text-lg"></i>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-800 leading-none block">{settings.app_name}</span>
            <span className="text-xs text-slate-500 leading-none">{user?.role === 'ADMIN' ? 'Admin Panel' : 'Portal Pegawai'}</span>
          </div>
        </NavLink>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 px-3">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className="w-5 flex justify-center text-slate-400">
                    <i className={`${item.icon} text-[14px]`}></i>
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ACCESS CONTROL */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="mb-4 px-3">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Aktif</p>
           <p className="text-xs font-bold text-slate-700 truncate">{user?.username}</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-sm"
        >
          <div className="w-5 flex justify-center">
            <i className="fa-solid fa-right-from-bracket"></i>
          </div>
          <span>Logout Portal</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
