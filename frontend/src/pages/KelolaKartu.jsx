import React, { useState, useEffect } from 'react';
import { useCardReader } from '../context/CardReaderContext';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  UserMinus, 
  Power,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function KelolaKartu() {
  const { registerListener } = useCardReader();
  const [cardsList, setCardsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tappedCard, setTappedCard] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kartu');
      const json = await res.json();
      if (json.success) {
        setCardsList(json.data);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memuat daftar kartu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Hook global reader taps to show card info
  useEffect(() => {
    const unsubscribe = registerListener((card) => {
      setTappedCard(card);
      // Find if this card is in our list
      const matched = cardsList.find(c => c.card_uid === card.uid);
      if (matched) {
        showBanner('success', `Kartu RFID UID: ${card.uid} terdeteksi milik ${matched.santri_nama || 'tanpa pemilik'}.`);
      } else {
        showBanner('info', `Kartu Baru RFID UID: ${card.uid} terdeteksi (belum terdaftar).`);
      }
    });
    return unsubscribe;
  }, [cardsList]);

  const showBanner = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleToggleCardStatus = async (cardId, currentStatus) => {
    const nextStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
    if (!window.confirm(`Apakah Anda yakin ingin mengubah status kartu menjadi ${nextStatus.toUpperCase()}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/kartu/${cardId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Status kartu berhasil diperbarui.');
        fetchCards();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memproses perubahan status kartu.');
    }
  };

  const handleUnlinkCard = async (cardId, santriNama) => {
    if (!window.confirm(`Apakah Anda yakin ingin memutuskan (unlink) kartu ini dari santri: ${santriNama}?`)) {
      return;
    }
    // Call server status or unlink card
    try {
      const res = await fetch(`/api/kartu/${cardId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'nonaktif' }) // or delete mapping
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Kartu berhasil dinonaktifkan.');
        fetchCards();
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memutuskan tautan kartu.');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen & Kelola Kartu RFID</h3>
          <p className="text-sm text-slate-500 font-medium">Aktivasi kartu baru, blokir kartu hilang, dan ganti kartu santri.</p>
        </div>
        <button 
          onClick={fetchCards}
          className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition active:scale-95 w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Floating Status Notification banner */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
            : message.type === 'error'
            ? 'bg-rose-50 border-rose-250 text-rose-800'
            : 'bg-sky-50 border-sky-250 text-sky-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-bold leading-relaxed">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 columns: Card Tapping helper */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[300px]">
            <div>
              <h4 className="font-extrabold text-slate-800 mb-1">Deteksi Tap RFID Live</h4>
              <p className="text-[11px] text-slate-500 font-medium mb-6">Dekatkan kartu RFID ke scanner untuk melihat status instan.</p>
            </div>

            {tappedCard ? (
              <div className="flex-1 flex flex-col justify-between animate-scale-up">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">UID RFID Terdeteksi</p>
                      <p className="font-mono text-sm font-black text-slate-800">{tappedCard.uid}</p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-slate-200/60 font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Tipe Transceiver:</span>
                      <span className="font-bold text-slate-800">RFID 13.56MHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipe Input:</span>
                      <span className="font-bold text-slate-800">{tappedCard.tipe}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setTappedCard(null)}
                  className="mt-6 text-xs text-rose-500 font-bold hover:text-rose-600 text-left underline"
                >
                  Bersihkan Hasil Deteksi
                </button>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 gap-3 py-10 animate-pulse">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Silakan Dekatkan Kartu</p>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[150px] mx-auto mt-0.5">Scanner serial akan membaca data secara real-time.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 8 columns: Cards Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h4 className="font-extrabold text-slate-800">Daftar Kartu E-Saku</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Cari UID, nama santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none font-medium text-slate-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">UID Kartu</th>
                  <th className="py-3 px-4">Pemilik Santri</th>
                  <th className="py-3 px-4">Saldo Terakhir</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                {cardsList.filter(c => {
                  const s = search.toLowerCase();
                  return c.card_uid.toLowerCase().includes(s) || (c.santri_nama || '').toLowerCase().includes(s);
                }).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">Tidak ada kartu RFID terdaftar.</td>
                  </tr>
                ) : (
                  cardsList.filter(c => {
                    const s = search.toLowerCase();
                    return c.card_uid.toLowerCase().includes(s) || (c.santri_nama || '').toLowerCase().includes(s);
                  }).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{c.card_uid}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {c.santri_nama || <span className="text-rose-500 font-bold italic text-[11px]">Belum Dikaitkan</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.santri_nama ? formatRupiah(c.santri_saldo) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'aktif' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right flex justify-end gap-2.5">
                        <button
                          onClick={() => handleToggleCardStatus(c.id, c.status)}
                          className={`p-1.5 rounded-lg border transition ${
                            c.status === 'aktif' 
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.status === 'aktif' ? 'Blokir / Nonaktifkan Kartu' : 'Aktifkan Kartu'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        {c.santri_nama && (
                          <button
                            onClick={() => handleUnlinkCard(c.id, c.santri_nama)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                            title="Unlink dari Santri (Putuskan Hubungan)"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
