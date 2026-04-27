import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = '/api';

const HonorPage = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [honorData, setHonorData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [rates, setRates] = useState({
    rate_umum: '25000',
    rate_sertif: '25000',
    rate_tidak_disiplin: '10000',
    voucher_nominal: '30000',
    penalty_late_minutes: '0',
    penalty_early_minutes: '0'
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, setRes, honorRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/honor/recap`, { params: { month: selectedMonth, year: selectedYear } })
      ]);
      
      setEmployees(empRes.data);
      setHonorData(honorRes.data || []);

      const newRates = { ...rates };
      setRes.data.forEach((s: any) => {
        if (s.key in newRates) (newRates as any)[s.key] = s.value;
      });
      setRates(newRates);
    } catch (err) {
      toast.error('Gagal mengambil data honor transport');
      setHonorData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Urutan Pegawai Baku sesuai permintaan USER
  const FIXED_ORDER = [
    422, 10869, 10878, 10871, 377, 378, 10881, 10870, 12582, 10875, 10873, 10872, 12060, 
    12058, 12064, 12057, 12059, 12061, 12451, 12644, 12642, 12645, 12647, 12651, 202207, 
    202208, 12759, 12764, 12763, 12762, 202203, 202212, 202213, 202218, 202222, 202221, 
    202202, 202205, 202214, 202211, 202220, 202210, 202216, 202209, 202217, 202219
  ];

  const filteredHonor = (Array.isArray(honorData) ? honorData : [])
    .filter(h => h && h.employeeName && h.employeeName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
        const posA = FIXED_ORDER.indexOf(a.employeeId);
        const posB = FIXED_ORDER.indexOf(b.employeeId);
        
        const finalPosA = posA === -1 ? 9999 : posA;
        const finalPosB = posB === -1 ? 9999 : posB;
        
        if (finalPosA !== finalPosB) {
            return finalPosA - finalPosB;
        }
        
        return a.employeeName.localeCompare(b.employeeName);
    });

  const handlePrintNewTab = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Honor Transport - ${format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy', {locale: id})}</title>
        <style>
          @page { size: 215.9mm 330.2mm; margin: 0.5cm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
          .kop-surat { display: flex; align-items: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 15px; position: relative; }
          .kop-surat img { width: 70px; position: absolute; left: 10px; top: 0; }
          .kop-surat .teks { text-align: center; width: 100%; }
          .kop-surat .teks h2 { margin: 0; font-size: 16px; font-weight: bold; }
          .kop-surat .teks p { margin: 2px 0 0 0; font-size: 10px; }
          .judul { text-align: center; margin-bottom: 15px; }
          .judul h1 { font-size: 12px; font-weight: bold; text-decoration: underline; margin: 0 0 3px 0; }
          .judul h2 { font-size: 10px; font-weight: bold; margin: 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 4px 6px; font-size: 10px; }
          th { font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .ttd-container { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 80px; }
          .ttd-box { text-align: center; }
          .ttd-box p { margin: 0; font-size: 11px; }
          .ttd-box .nama { margin-top: 70px; font-weight: bold; text-decoration: underline; }
        </style>
      </head>
      <body>
          <div class="kop-surat">
              <img src="/logo.png" onerror="this.style.display='none'" />
              <div class="teks">
                 <h2>MA NU 01 BANYUPUTIH</h2>
                 <p>Alamat : Jl. Lapangan 9A Banyuputih Batang, 51271 Telp. 0823 1312 5885</p>
              </div>
          </div>
          
          <div class="judul">
              <h1>DAFTAR PENERIMAAN HONOR TRANSPORTASI GURU & KARYAWAN</h1>
              <h2>PERIODE: ${format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy', {locale: id}).toUpperCase()}</h2>
          </div>

          <table>
             <thead>
                <tr>
                  <th style="width: 30px;">NO</th>
                  <th class="text-left">NAMA PEGAWAI</th>
                  <th style="width: 40px;">DISC</th>
                  <th style="width: 40px;">TDK</th>
                  <th style="width: 80px;">VOUCHER</th>
                  <th style="width: 90px;">TOTAL (RP)</th>
                  <th style="width: 150px;">TANDA TANGAN</th>
                </tr>
             </thead>
             <tbody>
                ${filteredHonor.map((h, i) => `
                   <tr>
                      <td class="text-center">${i+1}</td>
                      <td class="font-bold uppercase">${h.employeeName}</td>
                      <td class="text-center">${h.disciplinedDays}</td>
                      <td class="text-center">${h.nonDisciplinedDays}</td>
                      <td class="text-right">${h.voucherNominal.toLocaleString('id-ID')}</td>
                      <td class="text-right font-bold">${h.netto.toLocaleString('id-ID')}</td>
                      <td style="position: relative; height: 25px;">
                          <span style="position: absolute; left: 10px; top: 12px;">${i+1}. ..............................</span>
                      </td>
                   </tr>
                `).join('')}
                <tr class="font-bold">
                   <td colspan="2" class="text-center uppercase">JUMLAH TOTAL</td>
                   <td class="text-center">${filteredHonor.reduce((acc,c)=>acc+c.disciplinedDays,0)}</td>
                   <td class="text-center">${filteredHonor.reduce((acc,c)=>acc+c.nonDisciplinedDays,0)}</td>
                   <td class="text-right">${filteredHonor.reduce((acc,c)=>acc+(c.voucherNominal||0),0).toLocaleString('id-ID')}</td>
                   <td class="text-right">${filteredHonor.reduce((acc,c)=>acc+(c.netto||0),0).toLocaleString('id-ID')}</td>
                   <td></td>
                </tr>
             </tbody>
          </table>

          <div class="ttd-container">
              <div class="ttd-box">
                 <p>Mengetahui,</p>
                 <p>Kepala Madrasah</p>
                 <p class="nama">H. Mukhsin, S.Ag., M.Pd.I</p>
              </div>
              <div class="ttd-box">
                 <p>Banyuputih, ${format(new Date(), 'dd MMMM yyyy', {locale: id})}</p>
                 <p>Bendahara,</p>
                 <p class="nama">H. Rokhim, S.Pd.I</p>
              </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSlips = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
      <head>
        <title>Cetak Struk Honor - ${selectedMonth}/${selectedYear}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: 215.9mm 330.2mm; margin: 10mm; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; }
          .grid-container { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 5px;
            row-gap: 15px; 
          }
          .slip { 
            width: 65mm; 
            height: 48mm; 
            border: 0.5px solid #ddd; 
            padding: 8px;
            box-sizing: border-box;
            font-size: 8px;
            position: relative;
            overflow: hidden;
          }
          .header { text-align: center; border-bottom: 1.5px solid #000; margin-bottom: 5px; padding-bottom: 2px; }
          .header h1 { font-size: 9px; margin: 0; font-weight: 800; }
          .header p { font-size: 7px; margin: 0; font-weight: 600; text-transform: uppercase; }
          .emp-info { margin-bottom: 4px; }
          .emp-name { font-size: 9px; font-weight: 800; margin: 0; text-transform: uppercase; }
          .emp-sub { font-size: 7px; color: #444; }
          .row { display: flex; justify-content: space-between; margin-bottom: 1px; }
          .label { font-weight: 500; }
          .val { text-align: right; font-weight: 600; }
          .voucher { color: #d97706; font-style: italic; }
          .total-box { 
            border-top: 1px dashed #000; 
            margin-top: 5px; 
            padding-top: 3px; 
            display: flex; 
            justify-content: flex-end; 
            align-items: center; 
            gap: 5px;
          }
          .total-label { font-weight: 800; font-size: 9px; }
          .total-val { font-size: 10px; font-weight: 900; }
          @media print { .slip { border: 0.5px solid #ccc; } }
        </style>
      </head>
      <body>
          <div class="grid-container">
            ${filteredHonor.map(h => `
              <div class="slip">
                 <div class="header">
                    <h1>MA NU 01 BANYUPUTIH</h1>
                    <p>SLIP HONOR - ${format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy', {locale: id})}</p>
                 </div>
                 <div class="emp-info">
                    <p class="emp-name">${h.employeeName}</p>
                    <p class="emp-sub">ID: ${h.employeeId} | ${h.isSertifikasi ? 'SERTIF' : 'UMUM'}</p>
                 </div>
                 <div class="row">
                    <span class="label">Disiplin: &nbsp;&nbsp; ${h.disciplinedDays} x ${h.rateBruto?.toLocaleString('id-ID') || 0}</span>
                    <span class="val">${(h.disciplinedDays * (h.rateBruto || 0)).toLocaleString('id-ID')}</span>
                 </div>
                 <div class="row">
                    <span class="label">Tdk Dis: &nbsp;&nbsp; ${h.nonDisciplinedDays} x ${h.rateLate?.toLocaleString('id-ID') || 0}</span>
                    <span class="val">${(h.nonDisciplinedDays * (h.rateLate || 0)).toLocaleString('id-ID')}</span>
                 </div>
                 <div class="row voucher">
                    <span class="label">Voucher: &nbsp; - Potongan -</span>
                    <span class="val">(${h.voucherNominal.toLocaleString('id-ID')})</span>
                 </div>
                 <div class="total-box">
                    <span class="total-label">TOTAL:</span>
                    <span class="total-val">Rp ${h.netto.toLocaleString('id-ID')}</span>
                 </div>
              </div>
            `).join('')}
          </div>
          <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-20">
      <Toaster />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-semibold text-slate-800">Honor Transport</h2>
           <p className="text-sm text-slate-500 mt-1">Laporan rekapitulasi pencairan honor transport presensi.</p>
        </div>
      </div>

      <div className="space-y-6">
          {/* METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Cair (Netto)" val={`Rp ${filteredHonor.reduce((acc,c)=>acc+(c.netto||0),0).toLocaleString()}`} icon="fa-wallet" color="blue" />
            <SummaryCard label="Hari Tepat Waktu" val={filteredHonor.reduce((acc,c)=>acc+(c.disciplinedDays||0),0)} icon="fa-check-circle" color="emerald" />
            <SummaryCard label="Hari Terlambat" val={filteredHonor.reduce((acc,c)=>acc+(c.nonDisciplinedDays||0),0)} icon="fa-clock-rotate-left" color="rose" />
            <SummaryCard label="Bulan Laporan" val={format(new Date(selectedYear, selectedMonth-1, 1), 'MMMM yyyy', { locale: id })} icon="fa-calendar" color="slate" />
          </div>

          {/* FILTER CONTROL */}
          <div className="mansaba-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input className="mansaba-input pl-10" placeholder="Cari nama pegawai..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Bulan:</span>
                  <select className="mansaba-input !py-1.5 w-auto" value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))}>
                      {Array.from({length:12}, (_,i)=><option key={i+1} value={i+1}>{format(new Date(2022,i,1),'MMMM', {locale: id})}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Tahun:</span>
                  <select className="mansaba-input !py-1.5 w-auto" value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))}>
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={handlePrintSlips} className="w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center transition-all bg-white" title="Cetak Struk (Slip) Kecil">
                  <i className="fa-solid fa-receipt"></i>
                </button>
                <button onClick={handlePrintNewTab} className="w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all bg-white" title="Cetak Daftar Laporan">
                  <i className="fa-solid fa-print"></i>
                </button>
            </div>
          </div>

          {/* MAIN DATA TABLE */}
          <div className="mansaba-card-no-pad">
                <table className="mansaba-table">
                  <thead>
                      <tr>
                        <th className="mansaba-th text-center w-12">No.</th>
                        <th className="mansaba-th text-center w-24">No. ID</th>
                        <th className="mansaba-th">Nama Pegawai</th>
                        <th className="mansaba-th text-center">Kategori</th>
                        <th className="mansaba-th text-center w-32">Jml Disiplin</th>
                        <th className="mansaba-th text-center w-36">Jml Tidak Disiplin</th>
                        <th className="mansaba-th text-center w-36">Jml Tidak Hadir</th>
                        <th className="mansaba-th text-right px-6 bg-slate-50 w-44">Total Honor (Rp)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-500"><i className="fa-solid fa-spinner fa-spin text-xl text-blue-600 mb-2 block"></i> Memuat data hitungan honor...</td></tr>
                      ) : filteredHonor.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-500">Tidak ada data kehadiran di bulan ini.</td></tr>
                      ) : filteredHonor.map((h, i) => (
                        <tr key={h.employeeId} className="tr-hover">
                            <td className="mansaba-td text-center text-slate-500">
                              {i + 1}
                            </td>
                            <td className="mansaba-td text-center text-slate-500 font-medium">
                              {h.employeeId}
                            </td>
                            <td className="mansaba-td py-4">
                              <span className="text-sm font-semibold text-slate-800 uppercase">{h.employeeName}</span>
                            </td>
                            <td className="mansaba-td text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${h.isSertifikasi ? 'bg-blue-100/60 text-blue-600 border border-blue-200/50' : 'bg-slate-100/80 text-slate-500 border border-slate-200/50'}`}>
                                  {h.isSertifikasi ? 'SERTIFIKASI' : 'UMUM'}
                              </span>
                            </td>
                            <td className="mansaba-td text-center text-slate-600">
                              {h.disciplinedDays}
                            </td>
                            <td className="mansaba-td text-center text-slate-600">
                              {h.nonDisciplinedDays}
                            </td>
                            <td className="mansaba-td text-center text-slate-600">
                              {h.totalAbsent}
                            </td>
                            <td className="mansaba-td text-right px-6 bg-slate-50/50">
                              <span className="font-bold text-slate-800 text-sm">Rp {h.netto.toLocaleString()}</span>
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
          </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, val, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <div className="mansaba-card py-4 px-5">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border ${colorMap[color]}`}>
             <i className={`fa-solid ${icon}`}></i>
          </div>
          <div>
             <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
             <h4 className="text-lg font-bold text-slate-800">{val}</h4>
          </div>
       </div>
    </div>
  );
};

export default HonorPage;
