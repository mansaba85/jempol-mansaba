import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const AbsentReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absentList, setAbsentList] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchAbsentData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reports/absent`, { params: { date: selectedDate } });
      setAbsentList(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data belum hadir');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsentData();
  }, [selectedDate]);

  const filteredList = absentList.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.id.toString().includes(search)
  );

  return (
    <div className="space-y-6 pb-20">
      <Toaster />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Pegawai Belum Hadir</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar pegawai yang seharusnya masuk hari ini namun belum melakukan presensi.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
                <i className="fa-solid fa-calendar absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input 
                  type="date" 
                  className="mansaba-input !pl-14 !bg-white shadow-sm"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>
            <button 
                onClick={fetchAbsentData}
                className="mansaba-btn-primary flex items-center justify-center gap-2 px-6"
            >
                <i className={`fa-solid fa-sync ${loading ? 'fa-spin' : ''}`}></i>
                Refresh
            </button>
        </div>
      </div>

      {/* STATS & FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <div className="mansaba-card bg-indigo-50 border-indigo-100 flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-200 mb-4 transition-transform hover:scale-110">
              <i className="fa-solid fa-user-clock"></i>
            </div>
            <h4 className="text-4xl font-black text-indigo-900">{filteredList.length}</h4>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Belum Tap Jari</p>
          </div>
        </div>

        <div className="md:col-span-9">
          <div className="mansaba-card h-full flex flex-col justify-center">
             <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"></i>
                <input 
                  type="text" 
                  className="mansaba-input !pl-14 w-full !bg-slate-50 focus:!bg-white"
                  placeholder="Cari nama atau ID pegawai..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-tighter">
                *Hanya menampilkan pegawai yang memiliki jadwal kerja (shift) pada tanggal {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: id })}
             </p>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="mansaba-card-no-pad overflow-hidden">
        <table className="mansaba-table">
          <thead>
            <tr>
              <th className="mansaba-th text-center w-16">#</th>
              <th className="mansaba-th text-center w-32">NO. ID/PIN</th>
              <th className="mansaba-th">NAMA PEGAWAI</th>
              <th className="mansaba-th">UNIT/JABATAN</th>
              <th className="mansaba-th text-center w-40">STATUS HARI INI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                   <div className="flex flex-col items-center gap-3">
                      <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
                      <p className="text-sm font-bold text-slate-500 animate-pulse">Menghitung presensi shift...</p>
                   </div>
                </td>
              </tr>
            ) : filteredList.length > 0 ? (
              filteredList.map((emp, i) => (
                <tr key={emp.id} className="tr-hover group">
                  <td className="mansaba-td text-center text-slate-400 font-medium">{i + 1}</td>
                  <td className="mansaba-td text-center">
                     <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tabular-nums">
                        {emp.id}
                     </span>
                  </td>
                  <td className="mansaba-td">
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{emp.name}</span>
                     </div>
                  </td>
                  <td className="mansaba-td">
                     <span className="text-xs font-semibold text-slate-500 uppercase">{emp.role}</span>
                  </td>
                  <td className="mansaba-td text-center">
                     <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase ring-1 ring-rose-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        Belum Hadir
                     </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl mb-2">
                       <i className="fa-solid fa-check-double transition-transform hover:scale-125"></i>
                    </div>
                    <h5 className="text-slate-800 font-bold">Semua Tertib!</h5>
                    <p className="text-xs text-slate-400">Tidak ada pegawai yang berjadwal hari ini yang belum tap jari.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbsentReportPage;
