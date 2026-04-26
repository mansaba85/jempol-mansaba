import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Icon = ({ d, active, size = 18 }: { d: string, active: boolean, size?: number }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth={active ? "2" : "1.5"} 
    strokeLinecap="round" strokeLinejoin="round"
    className="transition-all duration-300"
  >
    <path d={d} />
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const menuGroups = [
    {
      title: 'Operasional & Database',
      items: [
        { path: '/timetables', label: 'Master Jam Kerja', d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
        { path: '/roster', label: 'Pola Shift & Rolling', d: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
        { path: '/employees', label: 'Daftar Pegawai', d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
      ]
    },
    {
      title: 'Koneksi Perangkat',
      items: [
        { path: '/devices', label: 'Daftar Mesin', d: "M20 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" },
        { path: '/connection', label: 'Sinkronisasi Data', d: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" },
      ]
    },
    {
      title: 'Laporan & Hasil',
      items: [
        { path: '/attendance', label: 'Log Presensi', d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
        { path: '/reports', label: 'Laporan Bulanan', d: "M9 19V5l12 7-12 7z" },
        { path: '/recap', label: 'Rekap Kehadiran', d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" },
        { path: '/honor', label: 'Honor Transport', d: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
      ]
    }
  ];

  useEffect(() => {
    const activeIdx = menuGroups.findIndex(group => 
      group.items.some(item => location.pathname === item.path)
    );
    if (activeIdx !== -1) {
      setExpandedIndex(activeIdx);
    }
  }, [location.pathname]);

  const toggleGroup = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <aside className={`
      sidebar-mansaba fixed xl:static inset-y-0 left-0 z-[60]
      ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      w-72 xl:w-80 flex flex-col h-screen overflow-hidden transition-all duration-500 ease-in-out
      bg-gradient-to-b from-[#086862] to-[#054a46] border-r border-white/10
    `}>
      {/* Brand Header */}
      <div className="pt-12 px-8 pb-8 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        <NavLink to="/" className="flex items-center gap-4 relative z-10" onClick={onClose}>
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl group hover:bg-white/20 transition-all duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
           </div>
           <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-none">MANSABA</h2>
              <p className="text-[9px] font-medium text-white/40 uppercase tracking-widest mt-1.5">Smart Attendance v4</p>
           </div>
        </NavLink>
        <button onClick={onClose} className="xl:hidden absolute right-6 top-10 text-white/50 hover:text-white p-2 bg-white/5 rounded-xl transition-all border border-white/5">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-8 mb-6 relative z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
        <NavLink 
          to="/" 
          onClick={onClose}
          className={({ isActive }) => `
            flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-semibold text-sm group
            ${isActive 
              ? 'bg-white text-[#086862] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] scale-[1.02] translate-x-2' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {({ isActive }) => (
            <>
              <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" active={isActive} />
              <span className="tracking-wide">Dashboard Utama</span>
            </>
          )}
        </NavLink>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-6 space-y-4 relative z-10 pb-12">
        {menuGroups.map((group, idx) => {
          const isExpanded = expandedIndex === idx;
          const hasActiveChild = group.items.some(item => location.pathname === item.path);

          return (
            <div key={idx} className="relative">
              <button 
                onClick={() => toggleGroup(idx)}
                className={`w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-300 group/head mb-1 ${
                  hasActiveChild ? 'bg-white/5 border border-white/10' : 'border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    isExpanded || hasActiveChild ? 'bg-white/60 scale-125 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/20 scale-100'
                  }`}></span>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    isExpanded || hasActiveChild ? 'text-white/80' : 'text-white/40'
                  }`}>
                    {group.title}
                  </h3>
                </div>
                <svg 
                  className={`transition-transform duration-500 text-white/20 group-hover/head:text-white/50 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
              }`}>
                <div className="relative pl-4 space-y-1 mt-1">
                  <div className="absolute left-4 top-0 bottom-6 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"></div>
                  
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-300 font-medium text-[13px] group relative ${
                          isActive 
                            ? 'bg-white/10 text-white shadow-xl shadow-black/10 translate-x-3 border border-white/10' 
                            : 'text-white/50 hover:text-white hover:bg-white/5 translate-x-0'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`absolute left-0 w-2 h-px transition-all ${isActive ? 'bg-white/40 w-4' : 'bg-transparent'}`}></div>
                          <div className="p-1 rounded-lg transition-all duration-300">
                            <Icon d={item.d} active={isActive} size={15} />
                          </div>
                          <span className="tracking-tight whitespace-nowrap">{item.label}</span>
                          <div className={`ml-auto transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                             <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 shrink-0 mt-auto bg-black/5 backdrop-blur-sm border-t border-white/5">
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-white/80 border border-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
           </div>
           <div>
              <p className="text-[10px] font-bold text-white/60 tracking-wider uppercase leading-none mb-1.5">Official System</p>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-bold px-2 py-0.5 bg-white/10 rounded-md text-white/50">BUILD 4.0.2</span>
                 <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
              </div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
