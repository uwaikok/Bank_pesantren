import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag,
  RefreshCw,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';

export default function Riwayat() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalFlow, setTotalFlow] = useState(0);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(''); // empty string means all
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Custom Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/transaksi/history?limit=${limit}&offset=${offset}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterType) url += `&tipe=${filterType}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
        setTotal(json.total);
        setTotalFlow(json.totalFlow || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, filterType, startDate, endDate, offset, limit]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [search, filterType, startDate, endDate]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(number || 0));
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-7 py-6 md:px-8 md:py-6 rounded-[1.5rem] shadow-xl relative overflow-hidden border border-emerald-800/40">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif">Riwayat Log Keuangan</h3>
        <p className="text-xs md:text-sm text-emerald-100/80 font-medium mt-1">Audit transaksi keluar-masuk, setoran, dan penarikan tunai santri.</p>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row gap-3 items-center">
          {/* Search bar */}
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-emerald-400 focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none text-slate-700 font-medium"
            />
          </div>

          {/* Custom Select Dropdown for Transaction Type */}
          <div className="relative w-full md:w-56">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-100/50 transition-colors focus:outline-none focus:border-emerald-450"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 capitalize">
                {filterType === '' ? (
                  <>
                    <SlidersHorizontal className="w-4 h-4 text-slate-450 flex-shrink-0" />
                    <span>Semua Transaksi</span>
                  </>
                ) : filterType === 'topup' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Setoran (Top-Up)</span>
                  </>
                ) : filterType === 'pembayaran' ? (
                  <>
                    <ShoppingBag className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>Pembayaran Belanja</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Penarikan Tunai</span>
                  </>
                )}
              </div>
              <span className="text-slate-400 text-[10px]">▼</span>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100 animate-fade-in py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2.5 ${filterType === '' ? 'bg-emerald-50/50 text-emerald-800' : ''}`}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    <span>Semua Transaksi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('topup');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2.5 ${filterType === 'topup' ? 'bg-emerald-50/50 text-emerald-800' : ''}`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Setoran (Top-Up)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('pembayaran');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2.5 ${filterType === 'pembayaran' ? 'bg-emerald-50/50 text-emerald-800' : ''}`}
                  >
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <span>Pembayaran Belanja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('penarikan');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2.5 ${filterType === 'penarikan' ? 'bg-emerald-50/50 text-emerald-800' : ''}`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                    <span>Penarikan Tunai</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Date range filter from - to */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-1.5 focus-within:border-emerald-400 focus-within:bg-white transition-colors text-xs font-bold text-slate-500">
              <span>Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 font-bold cursor-pointer"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-1.5 focus-within:border-emerald-400 focus-within:bg-white transition-colors text-xs font-bold text-slate-500">
              <span>Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 font-bold cursor-pointer"
              />
            </div>
          </div>
          
          {/* Refresh button */}
          <button 
            onClick={fetchHistory}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition active:scale-95 shrink-0 w-full xl:w-auto flex items-center justify-center gap-2"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="xl:hidden text-xs font-bold">Segarkan Data</span>
          </button>
        </div>

        {/* Summary Audit info banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/60 border border-slate-250/20 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 gap-2">
          <div>
            Menampilkan <span className="text-slate-700 font-extrabold">{history.length}</span> dari <span className="text-slate-700 font-extrabold">{total}</span> transaksi terfilter
          </div>
          <div className="flex items-center gap-2">
            <span>Total Arus Keuangan:</span>
            <span className={`font-black text-sm px-2.5 py-0.5 rounded-lg border ${
              totalFlow >= 0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {totalFlow >= 0 ? '+' : '-'}{formatRupiah(totalFlow)}
            </span>
          </div>
        </div>
      </div>

      {/* Main logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-5">Waktu Transaksi</th>
                <th className="py-3.5 px-5">Identitas Santri</th>
                <th className="py-3.5 px-5 text-center">Tipe</th>
                <th className="py-3.5 px-5 text-right">Jumlah</th>
                <th className="py-3.5 px-5 text-right">Saldo Sesudah</th>
                <th className="py-3.5 px-5">Keterangan</th>
                <th className="py-3.5 px-5">Operator</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-600">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    {loading ? 'Memuat riwayat...' : 'Tidak ada riwayat transaksi terdaftar.'}
                  </td>
                </tr>
              ) : (
                history.map((tx, idx) => {
                  const isTopup = tx.tipe_transaksi === 'topup';
                  const isPembayaran = tx.tipe_transaksi === 'pembayaran';
                  let borderLeftClass = 'border-l-4 ';
                  if (isTopup) borderLeftClass += 'border-l-emerald-500';
                  else if (isPembayaran) borderLeftClass += 'border-l-orange-500';
                  else borderLeftClass += 'border-l-rose-500';

                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50/80 transition duration-150 border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {/* Timestamp (with left vertical accent border) */}
                      <td className={`py-3.5 px-5 whitespace-nowrap text-slate-400 ${borderLeftClass}`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-slate-300">•</span>
                          <span>{new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Student Identity */}
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-extrabold text-slate-800">{tx.santri_nama}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono mt-0.5">{tx.santri_nis} · {tx.santri_kelas}</p>
                        </div>
                      </td>

                      {/* Transaction Type Tag */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isTopup 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : isPembayaran 
                            ? 'bg-orange-50 text-orange-700 border border-orange-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {isTopup ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : isPembayaran ? (
                            <ShoppingBag className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          <span>{isTopup ? 'Setoran' : isPembayaran ? 'Belanja' : 'Tarik Tunai'}</span>
                        </span>
                      </td>

                      {/* Transaction Amount (+ / - colors) */}
                      <td className={`py-3.5 px-5 text-right font-extrabold ${
                        isTopup ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isTopup ? '+' : '-'}{formatRupiah(tx.jumlah)}
                      </td>

                      {/* Balance After */}
                      <td className="py-3.5 px-5 text-right text-slate-600 font-bold">
                        {formatRupiah(tx.saldo_sesudah)}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-5 text-slate-500 font-medium max-w-[200px] truncate" title={tx.keterangan}>
                        {tx.keterangan}
                      </td>

                      {/* Cashier Operator */}
                      <td className="py-3.5 px-5 text-slate-400 font-semibold whitespace-nowrap">
                        {tx.operator}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        {total > limit && (
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {offset + 1}–{Math.min(offset + limit, total)} dari <span className="font-bold text-slate-700">{total}</span> transaksi
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-95"
              >
                ← Kembali
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-95 shadow-sm"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
