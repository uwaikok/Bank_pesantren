import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Globe } from 'lucide-react';
import logo from '../logo.png';

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
    from { opacity: 0; transform: translateY(35px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50%       { opacity: 0.85; transform: scale(1.15) rotate(90deg); }
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

  .sparkle-1 { animation: sparkle 2.6s ease-in-out 0.0s infinite; }
  .sparkle-2 { animation: sparkle 2.2s ease-in-out 0.9s infinite; }
  .sparkle-3 { animation: sparkle 2.8s ease-in-out 1.5s infinite; }

  .moon-float   { animation: moonFloat   4s ease-in-out infinite; }
  .star-twinkle   { animation: starTwinkle 2.0s ease-in-out infinite; }
  .star-twinkle-2 { animation: starTwinkle 2.6s ease-in-out 0.8s infinite; }
  .star-twinkle-3 { animation: starTwinkle 1.8s ease-in-out 1.4s infinite; }

  .coin-drop-1 { animation: coinDrop 3.2s ease-in-out 0.0s infinite; }
  .coin-drop-2 { animation: coinDrop 3.2s ease-in-out 1.1s infinite; }
  .coin-drop-3 { animation: coinDrop 3.2s ease-in-out 2.0s infinite; }

  /* Hide decorative elements on small screens */
  @media (max-width: 900px) {
    .char-illustration { display: none !important; }
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
   Santri Male (Laki-laki) Character SVG Component
───────────────────────────────────────── */
function SantriMaleSvg({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floor Shadow (Built-in) */}
      <ellipse cx="100" cy="285" rx="55" ry="8" fill="rgba(5, 150, 105, 0.15)" />
      
      {/* Feet / Sandals */}
      <path d="M78 275 C78 283 92 283 92 275 Z" fill="#b45309" />
      <path d="M108 275 C108 283 122 283 122 275 Z" fill="#b45309" />
      <path d="M80 274 H90" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
      <path d="M110 274 H120" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sarong (Emerald with patterned lines) */}
      <path d="M72 185 H128 L133 275 H67 Z" fill="#047857" />
      <line x1="82" y1="185" x2="78" y2="275" stroke="#065f46" strokeWidth="2" />
      <line x1="100" y1="185" x2="100" y2="275" stroke="#065f46" strokeWidth="2" />
      <line x1="118" y1="185" x2="122" y2="275" stroke="#065f46" strokeWidth="2" />
      
      <line x1="71" y1="210" x2="129" y2="210" stroke="#34d399" strokeWidth="1.5" opacity="0.3" strokeDasharray="3 3" />
      <line x1="69" y1="240" x2="131" y2="240" stroke="#34d399" strokeWidth="1.5" opacity="0.3" strokeDasharray="3 3" />

      {/* Koko Shirt (White, styled) */}
      <path d="M72 108 L128 108 L131 188 L69 188 Z" fill="#ffffff" />
      {/* Green collar trim */}
      <path d="M90 108 Q100 115 110 108" stroke="#10b981" strokeWidth="3" fill="none" />
      {/* Central button band */}
      <path d="M96 112 H104 V170 H96 Z" fill="#f1f5f9" />
      <circle cx="100" cy="122" r="2.5" fill="#d97706" />
      <circle cx="100" cy="138" r="2.5" fill="#d97706" />
      <circle cx="100" cy="154" r="2.5" fill="#d97706" />
      
      {/* Sleeves */}
      <path d="M72 108 L58 142 L68 147 L72 125 Z" fill="#ffffff" />
      <path d="M128 108 L142 142 L132 147 L128 125 Z" fill="#ffffff" />

      {/* Right Arm & Hand */}
      <path d="M136 144 C140 152 143 162 139 170 C136 176 128 174 127 166" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
      
      {/* Left Arm & Hand holding phone */}
      <path d="M64 144 C60 152 57 162 61 170 C64 176 72 174 73 166" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
      {/* Smartphone */}
      <g transform="rotate(-12 60 168)">
        <rect x="44" y="152" width="13" height="23" rx="2.5" fill="#1e293b" />
        <rect x="46" y="154" width="9" height="19" rx="1.5" fill="#10b981" />
        <rect x="48" y="156" width="5" height="4" rx="0.5" fill="#ffffff" opacity="0.6" /> {/* Micro App card */}
        <circle cx="50.5" cy="171" r="0.8" fill="#ffffff" />
      </g>

      {/* Head and Neck */}
      <path d="M94 108 H106 V115 H94 Z" fill="#fed7aa" />
      <path d="M84 66 C84 56 116 56 116 66 V98 C116 108 84 108 84 98 Z" fill="#fed7aa" />
      {/* Face features */}
      <circle cx="93" cy="80" r="2" fill="#451a03" />
      <circle cx="107" cy="80" r="2" fill="#451a03" />
      <path d="M96 90 Q100 95 104 90" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M91 74 Q94 72 96 74" stroke="#451a03" strokeWidth="1" fill="none" />
      <path d="M109 74 Q106 72 104 74" stroke="#451a03" strokeWidth="1" fill="none" />
      {/* Ears */}
      <circle cx="82" cy="83" r="3.5" fill="#fed7aa" />
      <circle cx="118" cy="83" r="3.5" fill="#fed7aa" />

      {/* Peci (Kopiah) - Black with gold/emerald accent line */}
      <path d="M83.5 66 H116.5 L115 48 H85 Z" fill="#0f172a" />
      <path d="M84 63 H116" stroke="#fbbf24" strokeWidth="1.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Santriwati Female (Perempuan) Character SVG Component
───────────────────────────────────────── */
function SantriwatiFemaleSvg({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floor Shadow (Built-in) */}
      <ellipse cx="100" cy="285" rx="55" ry="8" fill="rgba(5, 150, 105, 0.15)" />
      
      {/* Shoes/Feet */}
      <path d="M78 275 C78 283 92 283 92 275 Z" fill="#0f172a" />
      <path d="M108 275 C108 283 122 283 122 275 Z" fill="#0f172a" />

      {/* Dress (Gamis - Emerald/Teal) */}
      <path d="M75 125 H125 L142 275 H58 Z" fill="#065f46" />
      {/* Dress folds */}
      <path d="M90 125 L82 275" stroke="#044e39" strokeWidth="2" />
      <path d="M100 125 L100 275" stroke="#044e39" strokeWidth="2" />
      <path d="M110 125 L118 275" stroke="#044e39" strokeWidth="2" />
      
      {/* Sleeves */}
      <path d="M75 125 L60 165 L69 170 L80 135 Z" fill="#065f46" />
      <path d="M125 125 L140 165 L131 170 L120 135 Z" fill="#065f46" />

      {/* Hands */}
      {/* Right Hand */}
      <path d="M134 167 C138 173 140 180 136 186 C133 190 126 187 125 180" fill="#fed7aa" />
      
      {/* Left Hand holding Pink Piggy Bank */}
      <path d="M66 167 C62 173 60 180 64 186 C67 190 74 187 75 180" fill="#fed7aa" />
      {/* Piggy Bank */}
      <g transform="translate(56, 186)">
        <circle cx="0" cy="0" r="11" fill="#f43f5e" />
        <rect x="-14" y="-3" width="5" height="5" rx="1.5" fill="#e11d48" /> {/* Snout */}
        <circle cx="-1" cy="-11" r="2.5" fill="#e11d48" /> {/* Ear */}
        <line x1="-3" y1="-5" x2="3" y2="-5" stroke="#ffd2d2" strokeWidth="1.5" strokeLinecap="round" /> {/* Slot */}
        <circle cx="-6" cy="-2" r="1" fill="#ffffff" /> {/* Eye */}
      </g>

      {/* Hijab (White flowing drape) */}
      {/* Back drape */}
      <path d="M64 78 C64 38 136 38 136 78 V135 C136 155 125 168 100 168 C75 168 64 155 64 135 Z" fill="#ffffff" />
      
      {/* Inner Face cutout */}
      <path d="M82 70 C82 60 118 60 118 70 V102 C118 116 82 116 82 102 Z" fill="#fed7aa" />
      
      {/* Face features */}
      <circle cx="93" cy="81" r="2.2" fill="#451a03" />
      <circle cx="107" cy="81" r="2.2" fill="#451a03" />
      <path d="M96 92 Q100 97 104 92" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M91 75 Q94 73 96 75" stroke="#451a03" strokeWidth="0.8" fill="none" />
      <path d="M109 75 Q106 73 104 75" stroke="#451a03" strokeWidth="0.8" fill="none" />

      {/* Front Hijab folds */}
      <path d="M78 118 C90 128 110 128 122 118" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
      <path d="M100 118 V150" stroke="#cbd5e1" strokeWidth="1.2" />

      {/* Gold flower pin decoration */}
      <circle cx="120" cy="112" r="3" fill="#fbbf24" />
      <circle cx="120" cy="112" r="1" fill="#ffffff" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Character illustration wrapper
───────────────────────────────────────── */
function CharacterIllustration({ type, floatClass, side, delayClass }) {
  return (
    <div
      aria-hidden="true"
      className={`char-illustration ${delayClass}`}
      style={{
        position: 'absolute', bottom: '25px',
        [side]: '4%',
        width: 'clamp(145px, 16vw, 215px)',
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
        
        {type === 'male' ? (
          <SantriMaleSvg
            className={floatClass}
            style={{
              width: '100%', height: 'auto',
              filter: 'drop-shadow(0 12px 24px rgba(5,150,105,0.18))',
              transformOrigin: 'bottom center',
            }}
          />
        ) : (
          <SantriwatiFemaleSvg
            className={floatClass}
            style={{
              width: '100%', height: 'auto',
              filter: 'drop-shadow(0 12px 24px rgba(5,150,105,0.18))',
              transformOrigin: 'bottom center',
            }}
          />
        )}
      </div>
      
      {/* Subtle ground shadow ellipse (extra depth on page background) */}
      <div style={{
        width: '56%', height: '9px',
        background: 'radial-gradient(ellipse at center, rgba(5,150,105,0.2) 0%, transparent 80%)',
        borderRadius: '50%', marginTop: '-4px',
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
        <SparkleIcon key={i} className={s.cls} color={s.color} size={s.size}
          style={{ position: 'absolute', top: s.top, left: s.left, right: s.right, pointerEvents: 'none', zIndex: 2 }} />
      ))}

      {/* ── Character illustrations ── */}
      <CharacterIllustration
        type="male"
        floatClass="anim-float-left"
        side="left"
        delayClass="fade-slide-up-3"
      />
      <CharacterIllustration
        type="female"
        floatClass="anim-float-right"
        side="right"
        delayClass="fade-slide-up-4"
      />

      {/* ── Top Header Controls ── */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-auto fade-slide-up-1" style={{ zIndex: 20 }}>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/60 text-[10px] font-bold text-slate-600 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>PP Miftahul Huda As-Syadzili</span>
        </div>
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/60 text-slate-600 shadow-sm">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-slate-700"
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
              <label htmlFor="login-username" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Username</label>
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
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-550 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
                  style={{ color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Administrator utama untuk melakukan reset password."); }}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition"
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
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 text-slate-800 placeholder-slate-550 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
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
            <div className="flex items-center text-xs font-bold text-slate-600 pt-1">
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
          <div className="text-center text-[9px] text-slate-400/80 font-bold tracking-wider uppercase mt-8 pt-6 border-t border-slate-100">
            <span>PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI · © 2026</span>
          </div>

        </div>
      </div>
    </div>
  );
}

