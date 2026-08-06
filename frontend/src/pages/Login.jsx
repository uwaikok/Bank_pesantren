import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Globe } from 'lucide-react';
import logo from '../logo.png';

/* ─────────────────────────────────────────
   Inline keyframe animations (injected once)
───────────────────────────────────────── */
const LOGIN_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(35px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes moonFloat {
    0%, 100% { transform: translateY(0) rotate(-15deg); }
    50%       { transform: translateY(-8px) rotate(5deg); }
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.15); }
  }

  .fade-slide-up-1  { animation: fadeSlideUp 0.6s ease-out 0.05s both; }
  .fade-slide-up-2  { animation: fadeSlideUp 0.7s ease-out 0.25s both; }
  .fade-slide-up-3  { animation: fadeSlideUp 0.75s ease-out 0.45s both; }
  .fade-slide-up-4  { animation: fadeSlideUp 0.8s ease-out 0.65s both; }

  .moon-float   { animation: moonFloat   4s ease-in-out infinite; }
  .star-twinkle   { animation: starTwinkle 2.0s ease-in-out infinite; }
  .star-twinkle-2 { animation: starTwinkle 2.6s ease-in-out 0.8s infinite; }
  .star-twinkle-3 { animation: starTwinkle 1.8s ease-in-out 1.4s infinite; }

  /* Hide decorative elements on small screens */
  @media (max-width: 900px) {
    .deco-islamic      { opacity: 0.03 !important; }
  }
  @media (max-width: 1024px) {
    .moon-deco         { display: none !important; }
  }
`;

/* ─────────────────────────────────────────
   Sparkle SVG helper
   ───────────────────────────────────────── */
function SparkleIcon({ className, style, size = 18, color = '#f59e0b' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', ...style }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
    >
      <path d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Islamic Decorative Background SVG
   ───────────────────────────────────────── */
function IslamicDecoBg() {
  return (
    <svg
      aria-hidden="true"
      className="deco-islamic"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        opacity: 0.07, pointerEvents: 'none',
      }}
      viewBox="0 0 900 700"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g stroke="#0b4a3f" strokeWidth="1">
        <path d="M390 700 Q450 580 510 700" strokeWidth="2" />
        <path d="M370 700 Q450 560 530 700" strokeWidth="1.2" />
        {[...Array(6)].map((_, row) =>
          [...Array(9)].map((_, col) => {
            const cx = 60 + col * 100;
            const cy = 80 + row * 110;
            return (
              <g key={`${row}-${col}`} transform={`translate(${cx},${cy})`}>
                <polygon
                  points="0,-14 3.5,-3.5 14,0 3.5,3.5 0,14 -3.5,3.5 -14,0 -3.5,-3.5"
                  fill="#0b4a3f"
                  stroke="none"
                  opacity="0.5"
                />
              </g>
            );
          })
        )}
        <path d="M0 0 Q80 0 80 80" />
        <path d="M900 0 Q820 0 820 80" />
        <path d="M0 700 Q80 700 80 620" />
        <path d="M900 700 Q820 700 820 620" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Moon + stars decorative element
   ───────────────────────────────────────── */
function MoonStarDeco({ style }) {
  return (
    <div aria-hidden="true" className="moon-deco" style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
      <svg className="moon-float" width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path d="M38 26A16 16 0 1 1 22 10a12 12 0 0 0 16 16z" fill="url(#moonGrad)" opacity="0.85" />
        <defs>
          <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <SparkleIcon className="star-twinkle" style={{ position: 'absolute', top: '-10px', right: '-8px' }} size={14} color="#fde68a" />
      <SparkleIcon className="star-twinkle-2" style={{ position: 'absolute', bottom: '-6px', left: '-12px' }} size={10} color="#fde68a" />
      <SparkleIcon className="star-twinkle-3" style={{ position: 'absolute', top: '50%', right: '-20px' }} size={8} color="#fbbf24" />
    </div>
  );
}

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('ID');

  useEffect(() => {
    if (!document.getElementById('login-anim-styles')) {
      const style = document.createElement('style');
      style.id = 'login-anim-styles';
      style.textContent = LOGIN_STYLES;
      document.head.appendChild(style);
    }
  }, []);

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

      let json;
      try {
        json = await res.json();
      } catch (parseErr) {
        throw new Error(`Server (HTTP ${res.status}): Format respon server tidak valid.`);
      }

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
      setError(err.message || 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 30%, #f8fafc 60%, #fefce8 100%)',
      }}
    >
      {/* ── Islamic geometric background ── */}
      <IslamicDecoBg />

      {/* ── Radial glow blobs ── */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '-10%', right: '-8%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: '-12%', left: '-8%', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '40%', left: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      {/* ── Moon + stars decoration (top right, slightly lower to prevent header collision) ── */}
      <MoonStarDeco style={{ top: '11%', right: '6%', zIndex: 4 }} />

      {/* ── Small scattered stars ── */}
      {[
        { top: '12%', left: '8%',   size: 10, cls: 'star-twinkle',   color: '#10b981' },
        { top: '22%', left: '18%',  size: 7,  cls: 'star-twinkle-2', color: '#f59e0b' },
        { top: '70%', left: '5%',   size: 8,  cls: 'star-twinkle-3', color: '#10b981' },
        { top: '80%', right: '6%',  size: 9,  cls: 'star-twinkle',   color: '#f59e0b' },
        { top: '15%', right: '20%', size: 6,  cls: 'star-twinkle-2', color: '#10b981' },
      ].map((s, i) => (
        <SparkleIcon key={i} className={`${s.cls} hidden sm:block`} color={s.color} size={s.size}
          style={{ position: 'absolute', top: s.top, left: s.left, right: s.right, pointerEvents: 'none', zIndex: 2 }} />
      ))}

      {/* ── Top Header Controls ── */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center pointer-events-auto fade-slide-up-1" style={{ zIndex: 20 }}>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 text-[9px] sm:text-[10px] font-bold text-slate-600 shadow-sm truncate max-w-[65%] sm:max-w-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">PP Miftahul Huda As-Syadzili</span>
          <span className="inline sm:hidden">PP Miftahul Huda</span>
        </div>
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-200/60 text-slate-600 shadow-sm flex-shrink-0">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-[9px] sm:text-[10px] font-bold outline-none cursor-pointer text-slate-700"
          >
            <option value="ID">Indo</option>
            <option value="EN">English</option>
          </select>
        </div>
      </div>

      {/* ── Main Login Card ── */}
      <div className="w-full max-w-[420px] relative fade-slide-up-2 p-1 sm:p-0" style={{ zIndex: 10 }}>
        {/* Glowing ring behind card */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: '-4px', borderRadius: '1.75rem', background: 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(245,158,11,0.10), rgba(5,150,105,0.08))', filter: 'blur(8px)', zIndex: -1 }} />

        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 md:p-10 rounded-[1.5rem] shadow-xl shadow-slate-100/60">

          {/* Header: Logo and App Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 mb-3 sm:mb-4 shadow-sm">
              <img src={logo} alt="Logo E-Saku Santri" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">E-Saku Santri</h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-600 font-extrabold tracking-widest uppercase mt-1">Bank Pesantren</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5" style={{ animation: 'fadeSlideUp 0.4s ease-out both' }}>
              <span className="mt-0.5 flex-shrink-0 text-sm" aria-hidden="true">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500" aria-hidden="true">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-550 rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
                  style={{ color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Administrator utama untuk melakukan reset password."); }}
                  className="text-[9px] sm:text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500" aria-hidden="true">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-550 rounded-xl pl-11 pr-12 py-2.5 sm:py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
                  style={{ color: '#1e293b' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center text-xs font-bold text-slate-600 py-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-full py-1.5">
                <input id="login-remember" type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4.5 h-4.5" />
                <span>Remember me / Ingat saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-4 flex items-center justify-center gap-2 shadow-sm ${
                loading
                  ? 'bg-emerald-800/40 text-emerald-250 cursor-not-allowed'
                  : 'text-white hover:shadow-md hover:scale-[1.015] active:scale-[0.99]'
              }`}
              style={!loading ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 15px rgba(5,150,105,0.25)' } : {}}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-emerald-200" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
          <div className="text-center text-[9px] text-slate-400/80 font-bold tracking-wider uppercase mt-6 sm:mt-8 pt-6 border-t border-slate-100">
            <span>PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI · © 2026</span>
          </div>

        </div>
      </div>
    </div>
  );
}

