import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Fingerprint, Lock, User, Eye, EyeOff, Loader2, Users, ShieldCheck, Binary } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState<'admin' | 'employee'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [empId, setEmpId] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { settings } = useSettings();

  // Pisah kata terakhir untuk styling biru
  const appNameParts = (settings?.app_name || 'Jariku Mansaba').split(' ');
  const lastPart = appNameParts.length > 1 ? appNameParts.pop() : '';
  const firstPart = appNameParts.join(' ');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMode === 'admin') {
      if (!username || !password) return toast.error('Masukkan username & password');
    } else {
      if (!empId || !pin) return toast.error('Masukkan ID Mesin & PIN');
    }

    setLoading(true);
    try {
      const endpoint = loginMode === 'admin' ? '/api/login' : '/api/login/employee';
      const payload = loginMode === 'admin' ? { username, password } : { id: empId, pin };
      
      const res = await axios.post(endpoint, payload);
      login(res.data.user, res.data.token);
      toast.success('Selamat datang kembali, ' + res.data.user.username);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal login. Periksa kembali entitas Anda.');
    } finally {
      setLoading(false);
    }
  };

  const addDigit = (digit: string) => {
    if (pin.length < 6) setPin(pin + digit);
  };

  const clearPin = () => setPin('');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      <Toaster />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[460px] relative z-10">
        
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-100 flex items-center justify-center mb-4 relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Fingerprint size={32} className="text-blue-600 relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase text-center block">
            {firstPart} <span className="text-blue-600">{lastPart || ''}</span>
          </h1>
          <div className="flex gap-2 mt-1">
             <p className="text-slate-400 font-bold tracking-[0.3em] text-[8px] uppercase text-center bg-white px-3 py-1 rounded-full border border-slate-100 italic shadow-sm">
                {loginMode === 'admin' ? 'Administrative Access' : 'Employee Self Service'}
             </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden transition-all duration-500">
          
          <div className={`absolute top-0 left-0 h-1 transition-all duration-500 ${loginMode === 'admin' ? 'bg-blue-600 w-full' : 'bg-emerald-500 w-full'}`}></div>

          {/* MODE SWITCHER */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 relative">
             <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out ${loginMode === 'admin' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}></div>
             <button 
                type="button"
                onClick={() => setLoginMode('admin')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors ${loginMode === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <ShieldCheck size={14} /> Admin
                </div>
             </button>
             <button 
                type="button"
                onClick={() => setLoginMode('employee')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors ${loginMode === 'employee' ? 'text-emerald-600' : 'text-slate-400'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <Users size={14} /> Pegawai
                </div>
             </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              
              {loginMode === 'admin' ? (
                 <>
                    {/* Admin Fields */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1">Identity UID</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                             <User size={20} />
                          </div>
                          <input 
                             type="text" 
                             value={username}
                             onChange={(e) => setUsername(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-outfit"
                             placeholder="Masukkan Username"
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1">Access Cipher</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                             <Lock size={20} />
                          </div>
                          <input 
                             type={showPassword ? "text" : "password"}
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-14 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                             placeholder="••••••••••••"
                          />
                          <button 
                             type="button" 
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                 </>
              ) : (
                 <>
                    {/* Employee Fields */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1">PIN Mesin / ID Pegawai</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                             <Binary size={20} />
                          </div>
                          <input 
                             type="number" 
                             value={empId}
                             onChange={(e) => setEmpId(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-outfit"
                             placeholder="Contoh: 15"
                          />
                       </div>
                       <p className="text-[9px] text-slate-400 italic px-2">Masukkan nomor ID yang terdaftar di mesin absensi.</p>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1 block text-center">6-Digit Access PIN</label>
                       <div className="flex justify-center gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                             <div key={i} className={`w-9 h-12 rounded-lg border flex items-center justify-center text-lg font-black transition-all ${pin[i] ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                {pin[i] ? '•' : ''}
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Digital Numpad */}
                    <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
                       {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((val) => (
                          <button 
                             key={val}
                             type="button"
                             onClick={() => {
                                if (val === 'CLR') clearPin();
                                else if (val === 'DEL') setPin(pin.slice(0, -1));
                                else addDigit(val);
                             }}
                             className={`h-11 rounded-xl text-xs font-bold transition-all active:scale-90 flex items-center justify-center ${val === 'CLR' || val === 'DEL' ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                          >
                             {val}
                          </button>
                       ))}
                    </div>
                 </>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white rounded-[1.25rem] py-4 font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-wait shadow-xl active:scale-[0.98] ${loginMode === 'admin' ? 'bg-slate-900 hover:bg-black shadow-slate-900/10' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="tracking-widest uppercase text-xs">{loginMode === 'admin' ? 'INITIALIZE SESSION' : 'ACCESS PORTAL'}</span>
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    {loginMode === 'admin' ? <Fingerprint size={16} /> : <ShieldCheck size={16} />}
                  </div>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-10 font-bold tracking-widest leading-relaxed uppercase opacity-60">
            {loginMode === 'admin' ? 'Restricted Access Area' : 'Self-Service Employee Zone'}<br/>
            Mansaba Digital Ecosystem
          </p>
        </div>

        <div className="text-center mt-12 flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-slate-200"></div>
            <span className="text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase">v4.0 BUILD-3026</span>
            <div className="h-[1px] w-8 bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
