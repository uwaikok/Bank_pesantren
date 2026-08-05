import React from 'react';
import { useCardReader } from '../context/CardReaderContext';
import { 
  LayoutDashboard, 
  UserSquare2, 
  CreditCard, 
  History, 
  Wifi, 
  WifiOff, 
  Coins,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Layout({ children, activePage, setActivePage, onLogout }) {
  const { wsStatus, lastCard } = useCardReader();

  const currentUser = localStorage.getItem('esaku_name') || localStorage.getItem('esaku_user') || 'Administrator Utama';
  const userRole = localStorage.getItem('esaku_role') || 'Kasir';

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'kasir', name: 'Kasir & Transaksi', icon: CreditCard },
    { id: 'santri', name: 'Data Santri', icon: UserSquare2 },
    { id: 'riwayat', name: 'Riwayat Log', icon: History },
  ];

  const getPageTitle = () => {
    if (activePage === 'detail-santri') return 'Detail & Rekap Santri';
    if (activePage === 'riwayat') return 'Riwayat Log Keuangan';
    if (activePage === 'profil') return 'Profil Saya';
    return activePage.replace('-', ' ');
  };

  const handleLogoutClick = () => {
    if (window.confirm('Yakin ingin keluar dari sistem?')) {
      if (onLogout) onLogout();
    }
  };

  const isProfilActive = activePage === 'profil';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Container */}
      <aside className="w-64 bg-white text-slate-800 flex flex-col justify-between border-r border-slate-200 flex-shrink-0">
        <div>
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-emerald-500 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/10 flex-shrink-0">
              <Coins className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">E-Saku Santri</h1>
              <p className="text-[8px] text-emerald-600 font-black tracking-widest uppercase mt-1">Bank Pesantren</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || (item.id === 'santri' && activePage === 'detail-santri');
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold transition-all duration-150 rounded-xl ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1 duration-200'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Profile & Logout Section */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-white flex-shrink-0">
          
          {/* Single User Profile Block (Navigates directly to Profil Saya) */}
          <button
            onClick={() => setActivePage('profil')}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition duration-150 focus:outline-none ${
              isProfilActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100 text-slate-800'
            }`}
            title="Klik untuk membuka Profil Saya"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/70 border border-emerald-200/40 flex items-center justify-center text-emerald-700 font-black text-xs shadow-inner">
                  {currentUser.substring(0, 2).toUpperCase()}
                </div>
                {/* Online status indicator dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold truncate text-slate-800 leading-tight">{currentUser}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{userRole}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isProfilActive ? 'text-emerald-600 translate-x-0.5' : 'text-slate-400'}`} />
          </button>

          {/* Always Visible Logout Button */}
          {onLogout && (
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-100/80 border border-rose-100/60 transition duration-150 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar / Logout</span>
            </button>
          )}

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            {activePage === 'detail-santri' ? (
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-sm font-semibold">Data Santri</span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-bold text-slate-850">Detail &amp; Rekap</span>
              </div>
            ) : (
              <h2 className="text-base font-extrabold text-slate-850 uppercase tracking-wider">
                {getPageTitle()}
              </h2>
            )}
          </div>
          
          {/* Right Section: Hardware connection status */}
          <div className="flex items-center gap-6">
            {lastCard && (
              <div className="hidden md:flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-500 text-[10px]">TAP TERAKHIR:</span>
                <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border">{lastCard.uid}</span>
              </div>
            )}

            {/* Hardware WebSockets Indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full border transition-all duration-300 ${
                wsStatus === 'connected'
                  ? 'bg-emerald-50/80 text-emerald-700 border-emerald-250/50'
                  : 'bg-rose-50 text-rose-700 border-rose-250/50 animate-pulse'
              }`}>
                {wsStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>READER CONNECTED</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>READER OFFLINE</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
