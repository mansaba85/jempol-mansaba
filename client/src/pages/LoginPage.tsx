import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Fingerprint, Lock, User, Eye, EyeOff, Loader2, Users, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState<'admin' | 'employee'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { settings } = useSettings();

  // Reset PIN when switching modes
  useEffect(() => {
    setPin('');
  }, [loginMode]);

  // Pisah kata terakhir untuk styling biru
  const appNameParts = (settings?.app_name || 'Jariku Mansaba').split(' ');
  const lastPart = appNameParts.length > 1 ? appNameParts.pop() : '';
  const firstPart = appNameParts.join(' ');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (loginMode === 'admin') {
      if (!username || !password) return toast.error('Masukkan username & password');
    } else {
      if (!pin || pin.length < 6) return toast.error('Masukkan 6-Digit PIN');
    }

    setLoading(true);
    try {
      const endpoint = loginMode === 'admin' ? '/api/login' : '/api/login/employee';
      const payload = loginMode === 'admin' 
        ? { username, password } 
        : { pin };
      
      const res = await axios.post(endpoint, payload);
      login(res.data.user, res.data.token);
      toast.success('Selamat datang kembali, ' + res.data.user.username);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal login. Periksa kembali entitas Anda.');
      if (loginMode === 'employee') setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when PIN reaches 6 digits
  useEffect(() => {
    if (loginMode === 'employee' && pin.length === 6 && !loading) {
      handleLogin();
    }
  }, [pin]);

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

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-2xl shadow-blue-500/10 border border-slate-100 flex items-center justify-center mb-3 relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Fingerprint size={32} className="text-blue-600 relative z-10 transition-transform duration-500 group-hover:scale-110" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase text-center block">
            {firstPart} <span className="text-blue-600">{lastPart || ''}</span>
          </h1>
          <div className="mt-1.5">
             <p className="text-slate-400 font-bold tracking-[0.4em] text-[8px] uppercase text-center bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200/50 italic shadow-sm">
                {loginMode === 'admin' ? 'Administrative Access' : 'Employee Self Service'}
             </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden transition-all duration-500">
          
          <div className={`absolute top-0 left-0 h-1.5 transition-all duration-700 ease-in-out ${loginMode === 'admin' ? 'bg-blue-600 w-full' : 'bg-emerald-500 w-full'}`}></div>

          {/* MODE SWITCHER */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-[1.5rem] mb-10 relative">
             <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-lg shadow-slate-200/50 transition-all duration-500 ease-out ${loginMode === 'admin' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}></div>
             <button 
                type="button"
                onClick={() => setLoginMode('admin')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative z-10 transition-all duration-300 ${loginMode === 'admin' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-500'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <ShieldCheck size={16} /> Admin
                </div>
             </button>
             <button 
                type="button"
                onClick={() => setLoginMode('employee')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative z-10 transition-all duration-300 ${loginMode === 'employee' ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-500'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <Users size={16} /> Pegawai
                </div>
             </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              
              {loginMode === 'admin' ? (
                 <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Admin Fields */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1">Identity UID</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                             <User size={20} />
                          </div>
                          <input 
                             type="text" 
                             value={username}
                             onChange={(e) => setUsername(e.target.value)}
                             className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-outfit"
                             placeholder="Username"
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1">Access Cipher</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                             <Lock size={20} />
                          </div>
                          <input 
                             type={showPassword ? "text" : "password"}
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-14 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-200"
                             placeholder="••••••••"
                          />
                          <button 
                             type="button" 
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                          >
                             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase block text-center">Access PIN</label>
                          <p className="text-[8px] text-slate-300 font-medium text-center uppercase tracking-wider">Masukkan 6 digit PIN Anda</p>
                       </div>
                       <div className="flex justify-center gap-1.5">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                             <div key={i} className={`w-8 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 ${pin[i] ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105' : 'bg-slate-50 border-slate-100'}`}>
                                {pin[i] ? <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-in zoom-in duration-300"></div> : ''}
                             </div>
                          ))}
                       </div>
                       <p className="text-[8px] text-emerald-600/40 font-bold text-center uppercase tracking-tighter">Auto-verify active</p>
                    </div>

                    {/* Digital Numpad */}
                    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                       {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((val) => (
                          <button 
                             key={val}
                             type="button"
                             onClick={() => {
                                if (val === 'CLR') clearPin();
                                else if (val === 'DEL') setPin(pin.slice(0, -1));
                                else addDigit(val);
                             }}
                             className={`h-15 rounded-2xl text-sm font-bold transition-all active:scale-90 flex items-center justify-center shadow-sm border ${val === 'CLR' || val === 'DEL' ? 'bg-rose-50 text-rose-500 border-rose-100/50 hover:bg-rose-100' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                          >
                             {val}
                          </button>
                       ))}
                    </div>
                 </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white rounded-2xl py-4.5 font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-wait shadow-2xl active:scale-[0.98] ${loginMode === 'admin' ? 'bg-slate-900 hover:bg-black shadow-slate-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="tracking-[0.2em] uppercase text-xs">{loginMode === 'admin' ? 'Initialize Session' : 'Access Portal'}</span>
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    {loginMode === 'admin' ? <Fingerprint size={18} /> : <ShieldCheck size={18} />}
                  </div>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-12 font-bold tracking-[0.2em] leading-relaxed uppercase opacity-60">
            {loginMode === 'admin' ? 'Protected Administrative Zone' : 'Self-Service Personnel Access'}<br/>
            Mansaba Digital Ecosystem
          </p>
        </div>

        <div className="text-center mt-12 flex items-center justify-center gap-5 opacity-40">
            <div className="h-[1px] w-12 bg-slate-300"></div>
            <span className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase">v4.0 BUILD-2024</span>
            <div className="h-[1px] w-12 bg-slate-300"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

