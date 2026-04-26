import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const menuGroups = [
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
        { path: '/reports', label: 'Laporan Detil', icon: 'fa-solid fa-file-invoice' },
        { path: '/recap', label: 'Rekap Absensi', icon: 'fa-solid fa-chart-line' },
        { path: '/honor', label: 'Honor Transport', icon: 'fa-solid fa-money-check-dollar' },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { path: '/devices', label: 'Terminal Mesin', icon: 'fa-solid fa-microchip' },
        { path: '/connection', label: 'Sinkronisasi', icon: 'fa-solid fa-arrows-rotate' },
        { path: '/settings', label: 'Pengaturan', icon: 'fa-solid fa-gears' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[60] xl:static
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
            <span className="text-lg font-bold text-slate-800 leading-none block">Mansaba</span>
            <span className="text-xs text-slate-500 leading-none">Absensi</span>
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
    </aside>
  );
};

export default Sidebar;
