import React, { useState, useEffect } from 'react';
import { CardReaderProvider } from './context/CardReaderContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Santri from './pages/Santri';
import Riwayat from './pages/Riwayat';
import DetailSantri from './pages/DetailSantri';
import Login from './pages/Login';
import Laporan from './pages/Laporan';
import KelolaKartu from './pages/KelolaKartu';
import Pengaturan from './pages/Pengaturan';
import ManajemenPengguna from './pages/ManajemenPengguna';
import Bantuan from './pages/Bantuan';
import Profil from './pages/Profil';

// Global Fetch Interceptor to automatically forward JWT token for all API calls
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('esaku_token');
  if (token && url.startsWith('/api/')) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  const response = await originalFetch(url, options);
  if (response.status === 401 && !url.includes('/api/auth/verify') && !url.includes('/api/auth/login')) {
    localStorage.removeItem('esaku_token');
    localStorage.removeItem('esaku_user');
    localStorage.removeItem('esaku_name');
    localStorage.removeItem('esaku_role');
    window.location.reload();
  }
  return response;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedSantriId, setSelectedSantriId] = useState(null);
  const [riwayatInitialFilter, setRiwayatInitialFilter] = useState('');

  // Cek token yang tersimpan saat aplikasi pertama dimuat
  useEffect(() => {
    const token = localStorage.getItem('esaku_token');
    if (token) {
      // Verifikasi token ke backend
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            setIsAuthenticated(true);
            localStorage.setItem('esaku_user', json.data.username);
            localStorage.setItem('esaku_name', json.data.name || json.data.username);
            localStorage.setItem('esaku_role', json.data.role);
          } else {
            localStorage.removeItem('esaku_token');
            localStorage.removeItem('esaku_user');
            localStorage.removeItem('esaku_name');
            localStorage.removeItem('esaku_role');
          }
        })
        .catch(() => {
          // Jika server tidak bisa dijangkau, tetap izinkan jika token ada
          setIsAuthenticated(true);
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('esaku_token');
    localStorage.removeItem('esaku_user');
    localStorage.removeItem('esaku_name');
    localStorage.removeItem('esaku_role');
    setIsAuthenticated(false);
    setActivePage('dashboard');
    setSelectedSantriId(null);
  };

  // Navigasi ke halaman detail santri
  const handleViewDetail = (santriId) => {
    setSelectedSantriId(santriId);
    setActivePage('detail-santri');
  };

  // Kembali dari halaman detail ke daftar santri
  const handleBackFromDetail = () => {
    setSelectedSantriId(null);
    setActivePage('santri');
  };

  // Override setActivePage agar reset detail saat pindah halaman lain
  const handleSetActivePage = (page, options = {}) => {
    if (page !== 'detail-santri') {
      setSelectedSantriId(null);
    }
    // Support navigasi ke riwayat dengan initial filter
    if (page === 'riwayat' && options.filter !== undefined) {
      setRiwayatInitialFilter(options.filter);
    } else if (page !== 'riwayat') {
      setRiwayatInitialFilter('');
    }
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={handleSetActivePage} />;
      case 'kasir':
        return <Kasir />;
      case 'santri':
        return <Santri onViewDetail={handleViewDetail} />;
      case 'detail-santri':
        return selectedSantriId
          ? <DetailSantri santriId={selectedSantriId} onBack={handleBackFromDetail} />
          : <Santri onViewDetail={handleViewDetail} />;
      case 'riwayat':
        return <Riwayat initialFilter={riwayatInitialFilter} onFilterApplied={() => setRiwayatInitialFilter('')} />;
      case 'profil':
        return <Profil />;
      case 'laporan':
        return <Laporan />;
      case 'kartu-rfid':
        return <KelolaKartu />;
      case 'pengaturan':
        return <Pengaturan />;
      case 'users-manage':
        return <ManajemenPengguna />;
      case 'bantuan':
        return <Bantuan />;
      default:
        return <Dashboard setActivePage={handleSetActivePage} />;
    }
  };

  // Loading sementara saat mengecek token
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400 text-sm font-semibold">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  // Tampilkan Login jika belum autentikasi
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <CardReaderProvider>
      <Layout activePage={activePage} setActivePage={handleSetActivePage} onLogout={handleLogout}>
        {renderPage()}
      </Layout>
    </CardReaderProvider>
  );
}
