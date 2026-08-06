import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag,
  CreditCard,
  RefreshCw,
  X,
  Search
} from 'lucide-react';
import { formatTimeWIB } from '../utils/timeWIB';

export default function Dashboard({ setActivePage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active cards modal state
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [cardsList, setCardsList] = useState([]);
  const [cardsSearch, setCardsSearch] = useState('');
  const [loadingCards, setLoadingCards] = useState(false);

  const fetchCards = async () => {
    setLoadingCards(true);
    try {
      const res = await fetch('/api/kartu');
      const json = await res.json();
      if (json.success) {
        setCardsList(json.data.filter(c => c.status === 'aktif'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleOpenCardsModal = () => {
    setIsCardsModalOpen(true);
    fetchCards();
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transaksi/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setError(null);
      } else {
        setError(json.message);
      }
    } catch (err) {
      console.error(err);
      setError('Koneksi ke backend gagal. Pastikan server API berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Memuat analisis keuangan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex flex-col gap-3">
        <h3 className="font-bold text-lg">Gagal Memuat Dashboard</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchStats} 
          className="w-fit bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-7 py-6 md:px-8 md:py-6 rounded-[1.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 border border-emerald-800/40">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif">Ikhtisar Keuangan Pesantren</h3>
          <p className="text-xs md:text-sm text-emerald-100/80 font-medium mt-1">Pantau saldo, top-up, dan pembayaran koperasi santri secara real-time.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* ── Card 1: Saldo Mengendap Santri (Total Kas) ── */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-6 rounded-2xl shadow-lg shadow-amber-500/20 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 cursor-default">
          {/* Decorative wallet illustration */}
          <div aria-hidden="true" className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.18] pointer-events-none group-hover:scale-105 group-hover:opacity-[0.25] transition-all duration-500">
            <Wallet className="w-28 h-28 text-amber-900" strokeWidth={1.5} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/70 p-2.5 rounded-xl ring-1 ring-white/80 shadow-sm">
              <Wallet className="w-6 h-6 text-amber-700" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] bg-white text-amber-700 font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Total Kas</span>
          </div>
          <p className="text-xs font-bold text-slate-800">Saldo Mengendap Santri</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{formatRupiah(stats?.total_outstanding_saldo)}</p>
        </div>

        {/* ── Card 2: Santri Terdaftar ── */}
        <div
          onClick={() => setActivePage && setActivePage('santri')}
          title="Klik untuk membuka Manajemen Santri"
          className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 cursor-pointer"
        >
          {/* Decorative group-of-people illustration */}
          <div aria-hidden="true" className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.18] pointer-events-none group-hover:scale-105 group-hover:opacity-[0.25] transition-all duration-500">
            <Users className="w-28 h-28 text-emerald-900" strokeWidth={1.5} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/70 p-2.5 rounded-xl ring-1 ring-white/80 shadow-sm">
              <Users className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] bg-white text-emerald-700 font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Santri</span>
          </div>
          <p className="text-xs font-bold text-slate-800">Santri Terdaftar</p>
          <p className="text-2xl font-black mt-1 text-slate-900">
            {stats?.total_santri} <span className="text-sm font-semibold text-slate-700">Orang</span>
          </p>
          <p className="text-[10px] text-slate-800 font-bold mt-2.5 flex items-center gap-1">
            <span className="text-emerald-800 font-extrabold">▲</span> +3 santri baru minggu ini
          </p>
        </div>

        {/* ── Card 3: Kartu Aktif ── */}
        <div
          onClick={handleOpenCardsModal}
          title="Klik untuk melihat detail nomor/nama kartu aktif"
          className="bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-sky-500/20 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 cursor-pointer"
        >
          {/* Decorative RFID card illustration */}
          <div aria-hidden="true" className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.18] pointer-events-none group-hover:scale-105 group-hover:opacity-[0.25] transition-all duration-500">
            <CreditCard className="w-28 h-28 text-blue-900" strokeWidth={1.5} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/70 p-2.5 rounded-xl ring-1 ring-white/80 shadow-sm">
              <CreditCard className="w-6 h-6 text-sky-700" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] bg-white text-sky-700 font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">RFID</span>
          </div>
          <p className="text-xs font-bold text-slate-800">Kartu Aktif</p>
          <p className="text-2xl font-black mt-1 text-slate-900">
            {stats?.total_kartu_aktif} <span className="text-sm font-semibold text-slate-700">Kartu</span>
          </p>
          <p className="text-[10px] text-slate-800 font-bold mt-2.5 flex items-center gap-1">
            <span className="text-sky-800 font-extrabold">▲</span> +2 kartu aktif hari ini
          </p>
        </div>

        {/* ── Card 4: Total Belanja ── */}
        <div
          onClick={() => setActivePage && setActivePage('riwayat', { filter: 'pembayaran' })}
          title="Klik untuk membuka Riwayat Log Belanja (difilter ke Pembayaran)"
          className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-6 rounded-2xl shadow-lg shadow-orange-500/20 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 cursor-pointer"
        >
          {/* Decorative shopping bag illustration */}
          <div aria-hidden="true" className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.18] pointer-events-none group-hover:scale-105 group-hover:opacity-[0.25] transition-all duration-500">
            <ShoppingBag className="w-28 h-28 text-red-900" strokeWidth={1.5} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/70 p-2.5 rounded-xl ring-1 ring-white/80 shadow-sm">
              <ShoppingBag className="w-6 h-6 text-orange-700" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] bg-white text-orange-700 font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Belanja</span>
          </div>
          <p className="text-xs font-bold text-slate-800">Total Belanja</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{formatRupiah(stats?.total_pembayaran)}</p>
          <p className="text-[10px] text-slate-800 font-bold mt-2.5 flex items-center gap-1">
            <span className="text-red-900 font-extrabold">▼</span> -4.2% dibanding bulan lalu
          </p>
        </div>

      </div>


      {/* Mid Level Details: Flows Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1/3: Financial Flows Cards Breakdown */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-800">Aliran Arus Kas</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Akumulasi setoran vs. pengeluaran santri.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Top Up flow */}
            <div className="flex items-center justify-between p-4 bg-emerald-55/10 hover:bg-emerald-50/40 rounded-xl border border-emerald-100/80 border-l-4 border-l-emerald-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-full text-emerald-700 shadow-sm flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Setoran / Top-Up</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatRupiah(stats?.total_topup)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">{stats?.count_topup}×</span>
            </div>

            {/* Canteen Payment flow */}
            <div className="flex items-center justify-between p-4 bg-orange-55/10 hover:bg-orange-50/40 rounded-xl border border-orange-100/80 border-l-4 border-l-orange-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2.5 rounded-full text-orange-700 shadow-sm flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Belanja Koperasi</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatRupiah(stats?.total_pembayaran)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">{stats?.count_pembayaran}×</span>
            </div>

            {/* Withdrawal flow */}
            <div className="flex items-center justify-between p-4 bg-rose-55/10 hover:bg-rose-50/40 rounded-xl border border-rose-100/80 border-l-4 border-l-rose-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 p-2.5 rounded-full text-rose-700 shadow-sm flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Penarikan Tunai</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatRupiah(stats?.total_penarikan)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">{stats?.count_penarikan}×</span>
            </div>
          </div>
        </div>

        {/* Right 2/3: Quick Recent Transactions List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl border-l-4 border-l-sky-500 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h4 className="font-extrabold text-slate-800">Aktivitas Transaksi Terakhir</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">5 transaksi terakhir dari seluruh mesin tap.</p>
            </div>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse inline-block"></span>
              Real-time
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.transaksi_terbaru?.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Belum ada transaksi hari ini.</div>
            ) : (
              <>
                {stats?.transaksi_terbaru?.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full shadow-sm flex items-center justify-center ${
                        tx.tipe_transaksi === 'topup' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : tx.tipe_transaksi === 'pembayaran' 
                          ? 'bg-orange-50 text-orange-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.tipe_transaksi === 'topup' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : tx.tipe_transaksi === 'pembayaran' ? (
                          <ShoppingBag className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{tx.santri_nama}</p>
                        <p className="text-xs text-slate-400 font-medium">{tx.keterangan} · <span className="font-mono text-[10px]">{tx.santri_nis}</span></p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-black ${
                        tx.tipe_transaksi === 'topup' ? 'text-emerald-600' : 'text-slate-700'
                      }`}>
                        {tx.tipe_transaksi === 'topup' ? '+' : '-'}{formatRupiah(tx.jumlah)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">{formatTimeWIB(tx.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex justify-end border-t border-slate-100">
                  <button
                    onClick={() => setActivePage && setActivePage('riwayat')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline transition flex items-center gap-1"
                  >
                    <span>Lihat Semua Transaksi</span>
                    <span>→</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: DAFTAR KARTU AKTIF */}
      {isCardsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-scale-up flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Daftar Kartu E-Saku Aktif</h3>
                <p className="text-xs text-slate-500 font-medium">Informasi nomor kartu UID RFID yang saat ini aktif terdaftar.</p>
              </div>
              <button 
                onClick={() => {
                  setIsCardsModalOpen(false);
                  setCardsSearch('');
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari berdasarkan UID Kartu, Nama Santri, atau NIS..."
                  value={cardsSearch}
                  onChange={(e) => setCardsSearch(e.target.value)}
                  className="bg-transparent text-xs w-full focus:outline-none font-medium text-slate-700 font-semibold"
                />
                {cardsSearch && (
                  <button onClick={() => setCardsSearch('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Clear</button>
                )}
              </div>
            </div>

            {/* Cards Table Container */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingCards ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Mengambil daftar kartu...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">UID Kartu</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cardsList.filter(card => {
                        const s = cardsSearch.toLowerCase();
                        return (
                          card.card_uid.toLowerCase().includes(s) ||
                          (card.santri_nama || '').toLowerCase().includes(s) ||
                          (card.santri_nis || '').toLowerCase().includes(s)
                        );
                      }).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-xs text-slate-400 font-medium">Tidak ada kartu aktif ditemukan.</td>
                        </tr>
                      ) : (
                        cardsList.filter(card => {
                          const s = cardsSearch.toLowerCase();
                          return (
                            card.card_uid.toLowerCase().includes(s) ||
                            (card.santri_nama || '').toLowerCase().includes(s) ||
                            (card.santri_nis || '').toLowerCase().includes(s)
                          );
                        }).map((card, idx) => (
                          <tr key={card.id} className="text-xs font-semibold text-slate-700 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">{card.card_uid}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-800">{card.santri_nama || <span className="text-rose-500 font-bold italic">Belum Dikaitkan</span>}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{card.santri_nis || '-'}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Aktif</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button 
                onClick={() => {
                  setIsCardsModalOpen(false);
                  setCardsSearch('');
                }} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
