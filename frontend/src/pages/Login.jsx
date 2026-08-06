import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Globe } from 'lucide-react';
import logo from '../logo.png';
import santriMale from '../santri_male.png';
import santriwatiFemale from '../santriwati_female.png';

/* ─────────────────────────────────────────
   Inline keyframe animations (injected once)
───────────────────────────────────────── */
const LOGIN_STYLES = `
  @keyframes floatY {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-14px) rotate(1deg); }
  }
  @keyframes floatYReverse {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-12px) rotate(-1deg); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50%       { opacity: 1; transform: scale(1.2) rotate(180deg); }
  }
  @keyframes moonFloat {
    0%, 100% { transform: translateY(0) rotate(-15deg); }
    50%       { transform: translateY(-8px) rotate(5deg); }
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.15); }
  }
  @keyframes coinDrop {
    0%   { opacity: 0; transform: translateY(-20px) rotate(0deg); }
    60%  { opacity: 1; transform: translateY(0px)   rotate(360deg); }
    100% { opacity: 0; transform: translateY(8px)   rotate(400deg); }
  }

  .anim-float-left  { animation: floatY        3.8s ease-in-out infinite; }
  .anim-float-right { animation: floatYReverse 4.2s ease-in-out infinite; }

  .fade-slide-up-1  { animation: fadeSlideUp 0.6s ease-out 0.05s both; }
  .fade-slide-up-2  { animation: fadeSlideUp 0.7s ease-out 0.25s both; }
  .fade-slide-up-3  { animation: fadeSlideUp 0.75s ease-out 0.45s both; }
  .fade-slide-up-4  { animation: fadeSlideUp 0.8s ease-out 0.65s both; }

  .sparkle-1 { animation: sparkle 2.4s ease-in-out 0.0s infinite; }
  .sparkle-2 { animation: sparkle 2.1s ease-in-out 0.7s infinite; }
  .sparkle-3 { animation: sparkle 2.7s ease-in-out 1.3s infinite; }

  .moon-float   { animation: moonFloat   4s ease-in-out infinite; }
  .star-twinkle   { animation: starTwinkle 2.0s ease-in-out infinite; }
  .star-twinkle-2 { animation: starTwinkle 2.6s ease-in-out 0.8s infinite; }
  .star-twinkle-3 { animation: starTwinkle 1.8s ease-in-out 1.4s infinite; }

  .coin-drop-1 { animation: coinDrop 3.2s ease-in-out 0.0s infinite; }
  .coin-drop-2 { animation: coinDrop 3.2s ease-in-out 1.1s infinite; }
  .coin-drop-3 { animation: coinDrop 3.2s ease-in-out 2.0s infinite; }

  /* Hide decorative chars on small screens */
  @media (max-width: 900px) {
    .char-illustration { display: none !important; }
    .deco-islamic      { opacity: 0.03 !important; }
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
    <div aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
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

/* ─────────────────────────────────────────
   Floating coin particles
───────────────────────────────────────── */
function CoinParticles({ side }) {
  const offsets = side === 'left'
    ? [{ x: '55%', y: '20%', cls: 'coin-drop-1' }, { x: '72%', y: '35%', cls: 'coin-drop-2' }, { x: '42%', y: '30%', cls: 'coin-drop-3' }]
    : [{ x: '25%', y: '18%', cls: 'coin-drop-2' }, { x: '45%', y: '32%', cls: 'coin-drop-1' }, { x: '62%', y: '28%', cls: 'coin-drop-3' }];
  return (
    <>
      {offsets.map((c, i) => (
        <svg key={i} aria-hidden="true" className={c.cls}
          style={{ position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none' }}
          width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="url(#coinGrad2)" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">$</text>
          <defs>
            <linearGradient id="coinGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────
   Character illustration wrapper
───────────────────────────────────────── */
function CharacterIllustration({ src, alt, floatClass, side, delayClass }) {
  return (
    <div
      aria-hidden="true"
      className={`char-illustration ${delayClass}`}
      style={{
        position: 'absolute', bottom: 0,
        [side]: '2%',
        width: 'clamp(140px, 16vw, 220px)',
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <CoinParticles side={side} />
        <SparkleIcon className="sparkle-1"
          style={{ position: 'absolute', top: '10%', [side === 'left' ? 'right' : 'left']: '-10px' }}
          size={16} color="#f59e0b" />
        <SparkleIcon className="sparkle-2"
          style={{ position: 'absolute', top: '30%', [side === 'left' ? 'right' : 'left']: '-18px' }}
          size={12} color="#10b981" />
        <SparkleIcon className="sparkle-3"
          style={{ position: 'absolute', top: '55%', [side === 'left' ? 'right' : 'left']: '-8px' }}
          size={10} color="#fbbf24" />
        <img
          src={src}
          alt={alt}
          className={floatClass}
          style={{
            width: '100%', height: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 12px 28px rgba(5,150,105,0.18))',
            transformOrigin: 'bottom center',
          }}
        />
      </div>
      <div style={{
        width: '60%', height: '10px',
        background: 'radial-gradient(ellipse at center, rgba(5,150,105,0.18) 0%, transparent 80%)',
        borderRadius: '50%', marginTop: '-6px',
      }} />
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

      {/* ── Moon + stars decoration (top right) ── */}
      <MoonStarDeco style={{ top: '8%', right: '6%', zIndex: 4 }} />

      {/* ── Small scattered stars ── */}
      {[
        { top: '12%', left: '8%',   size: 10, cls: 'star-twinkle',   color: '#10b981' },
        { top: '22%', left: '18%',  size: 7,  cls: 'star-twinkle-2', color: '#f59e0b' },
        { top: '70%', left: '5%',   size: 8,  cls: 'star-twinkle-3', color: '#10b981' },
        { top: '80%', right: '6%',  size: 9,  cls: 'star-twinkle',   color: '#f59e0b' },
        { top: '15%', right: '20%', size: 6,  cls: 'star-twinkle-2', color: '#10b981' },
      ].map((s, i) => (
        <SparkleIcon key={i} className={s.cls} color={s.color} size={s.size}
          style={{ position: 'absolute', top: s.top, left: s.left, right: s.right, pointerEvents: 'none', zIndex: 2 }} />
      ))}

      {/* ── Character illustrations ── */}
      <CharacterIllustration
        src={santriMale}
        alt=""
        floatClass="anim-float-left"
        side="left"
        delayClass="fade-slide-up-3"
      />
      <CharacterIllustration
        src={santriwatiFemale}
        alt=""
        floatClass="anim-float-right"
        side="right"
        delayClass="fade-slide-up-4"
      />

      {/* ── Top Header Controls ── */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-auto fade-slide-up-1" style={{ zIndex: 20 }}>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/60 text-[10px] font-bold text-slate-500 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>PP Miftahul Huda As-Syadzili</span>
        </div>
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/60 text-slate-500 shadow-sm">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* ── Main Login Card ── */}
      <div className="w-full max-w-[420px] relative fade-slide-up-2" style={{ zIndex: 10 }}>
        {/* Glowing ring behind card */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: '-6px', borderRadius: '1.75rem', background: 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(245,158,11,0.10), rgba(5,150,105,0.08))', filter: 'blur(8px)', zIndex: -1 }} />

        <div className="bg-white border border-slate-200/80 p-8 md:p-10 rounded-[1.5rem] shadow-xl shadow-slate-100/60">

          {/* Header: Logo and App Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 mb-4 shadow-sm animate-pulse">
              <img src={logo} alt="Logo E-Saku Santri" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">E-Saku Santri</h1>
            <p className="text-[10px] text-emerald-600 font-extrabold tracking-widest uppercase mt-1">Bank Pesantren</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5" style={{ animation: 'fadeSlideUp 0.4s ease-out both' }}>
              <span className="mt-0.5 flex-shrink-0 text-sm" aria-hidden="true">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400" aria-hidden="true">
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
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-400 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Administrator utama untuk melakukan reset password."); }}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400" aria-hidden="true">
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
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-400 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center text-xs font-bold text-slate-500 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input id="login-remember" type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4" />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-6 flex items-center justify-center gap-2 shadow-sm ${
                loading
                  ? 'bg-emerald-800/40 text-emerald-200 cursor-not-allowed'
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
          <div className="text-center text-[9px] text-slate-400/80 font-bold tracking-wider uppercase mt-8 pt-6 border-t border-slate-100">
            <span>PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI · © 2026</span>
          </div>

        </div>
      </div>
    </div>
  );
}
