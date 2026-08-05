import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Globe } from 'lucide-react';
import logo from '../logo.png';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('ID');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();

      if (json.success) {
        localStorage.setItem('esaku_token', json.data.token);
        localStorage.setItem('esaku_user', json.data.username);
        localStorage.setItem('esaku_name', json.data.name || json.data.username);
        localStorage.setItem('esaku_role', json.data.role || 'Kasir');
        onLoginSuccess(json.data);
      } else {
        setError(json.message || 'Login gagal. Periksa kembali username dan password.');
      }
    } catch (err) {
      console.error(err);
      setError('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 relative overflow-hidden font-sans">
      {/* Background Decorative Subtle Geometrics */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
           style={{
             backgroundImage: 'radial-gradient(#0b4a3f 2px, transparent 2px), radial-gradient(#0b4a3f 2px, #ffffff 2px)',
             backgroundSize: '40px 40px',
             backgroundPosition: '0 0, 20px 20px'
           }} />
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-gold-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Header Controls (Language switch / Small Pesantren tag) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PP Miftahul Huda As-Syadzili</span>
        </div>
        <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/50 text-slate-500 shadow-sm">
          <Globe className="w-3.5 h-3.5" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-slate-600"
          >
            <option value="ID">Bahasa Indonesia</option>
            <option value="EN">English</option>
          </select>
        </div>
      </div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 p-8 md:p-10 rounded-[1.5rem] shadow-xl shadow-slate-100/60 relative z-10">
        
        {/* Header: Logo and App Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 mb-4 shadow-sm animate-pulse">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">E-Saku Santri</h2>
          <p className="text-[10px] text-emerald-600 font-extrabold tracking-widest uppercase mt-1">Bank Pesantren</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
            <span className="mt-0.5 flex-shrink-0 text-sm">⚠️</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-400 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Administrator utama untuk melakukan reset password."); }} 
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Lupa sandi?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-400 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center text-xs font-bold text-slate-500 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4" />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-6 flex items-center justify-center gap-2 shadow-sm ${
              loading
                ? 'bg-emerald-800/40 text-emerald-250 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-emerald-200" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>

        {/* Small Footer Text */}
        <div className="text-center text-[9px] text-slate-400/80 font-bold tracking-wider uppercase mt-8 pt-6 border-t border-slate-100">
          <span>PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI · © 2026</span>
        </div>

      </div>
    </div>
  );
}
