import React, { useState, useEffect } from 'react';
import { useCardReader } from '../context/CardReaderContext';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag,
  Coins, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { formatReceiptWIB } from '../utils/timeWIB';

export default function Kasir() {
  const { registerListener } = useCardReader();

  // Cashier State
  const [activeCard, setActiveCard] = useState(null); // The student details fetched from the tapped card
  const [loadingCard, setLoadingCard] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [txType, setTxType] = useState('pembayaran'); // pembayaran, topup, penarikan
  const [amount, setAmount] = useState(''); // raw digits only, e.g. "5000"
  const [amountDisplay, setAmountDisplay] = useState(''); // formatted display, e.g. "5.000"
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('Kasir Utama');

  // UI States
  const [receipt, setReceipt] = useState(null); // holds transaction receipt on success
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUid, setManualUid] = useState('');

  // ─── Helper: format angka jadi tampilan Rupiah tanpa simbol mata uang ───
  const formatInputRupiah = (rawDigits) => {
    if (!rawDigits) return '';
    const num = parseInt(rawDigits, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // ─── Helper: bersihkan string format ke angka murni ───────────────────
  const parseRawAmount = (str) => {
    // Hapus semua karakter bukan digit
    return str.replace(/[^0-9]/g, '');
  };

  const fetchCardByUid = async (uid) => {
    if (processing) return; // Guard against scans while transaction is processing
    setReceipt(null);
    setErrorMsg(null);
    setLoadingCard(true);
    setActiveCard(null);

    try {
      const res = await fetch(`/api/kartu/${uid}`);
      const json = await res.json();
      
      if (json.success) {
        // Card registered and has student
        setActiveCard(json.data);
        // Set default description based on type
        setDefaultNote(txType, json.data.nama);
        setShowManualInput(false);
        setManualUid('');
      } else {
        // Card is either not registered or not mapped
        setErrorMsg(json.message || 'Kartu tidak dikenali.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memindai server kartu.');
    } finally {
      setLoadingCard(false);
    }
  };

  // Connect global tap listener
  useEffect(() => {
    const unsubscribe = registerListener(async (card) => {
      fetchCardByUid(card.uid);
    });

    return unsubscribe;
  }, [txType]);

  const handleManualUidSubmit = (e) => {
    e.preventDefault();
    if (!manualUid.trim()) return;
    fetchCardByUid(manualUid.trim());
  };

  const setDefaultNote = (type, name) => {
    if (type === 'pembayaran') setNote('Belanja Koperasi/Kantin');
    else if (type === 'topup') setNote('Top-up saldo jajan bulanan');
    else if (type === 'penarikan') setNote('Penarikan tunai uang saku');
  };

  const handleTxTypeChange = (type) => {
    setTxType(type);
    setSelectedQuickAmount(null); // reset selected quick button
    if (activeCard) {
      setDefaultNote(type, activeCard.nama);
    }
  };

  const handleQuickAmountClick = (val) => {
    const raw = val.toString();
    setAmount(raw);
    setAmountDisplay(formatInputRupiah(raw));
    setSelectedQuickAmount(raw);
  };

  const handleAmountChange = (inputVal) => {
    // Strip semua non-digit (titik ribuan, koma, spasi, dll)
    const raw = parseRawAmount(inputVal);
    setAmount(raw);
    setAmountDisplay(formatInputRupiah(raw));
    setSelectedQuickAmount(null); // reset quick selection
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    if (!activeCard) {
      setErrorMsg('Silakan tempelkan kartu RFID/NFC santri terlebih dahulu.');
      return;
    }
    const numAmount = parseInt(amount, 10);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Masukkan jumlah transaksi yang valid.');
      return;
    }

    setProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_uid: activeCard.card_uid,
          tipe_transaksi: txType,
          jumlah: numAmount,
          keterangan: note,
          operator: operator
        })
      });
      const json = await res.json();

      if (json.success) {
        setReceipt(json.data);
        // Reset cashier screen for next customer
        setAmount('');
        setAmountDisplay('');
        setSelectedQuickAmount(null);
        setActiveCard(null);
      } else {
        setErrorMsg(json.message || 'Transaksi gagal diproses.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Koneksi server terputus. Gagal melakukan transaksi.');
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const handlePrintReceipt = (rcpt) => {
    if (!rcpt) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Struk Keuangan - ${rcpt.santri.nama}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            padding: 10px;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
          }
          .text-center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          .header-title { font-size: 14px; font-weight: bold; margin: 0; }
          .header-sub { font-size: 9px; margin: 2px 0; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h3 class="header-title">E-SAKU SANTRI</h3>
          <p class="header-sub">PP MIFTAHUL HUDA AS-SYADZILI</p>
          <p class="header-sub">Tarogong Kaler, Garut</p>
        </div>
        <div class="divider"></div>
        <div class="flex-between">
          <span>Tgl: ${formatReceiptWIB(rcpt.transaksi.created_at || Date.now())}</span>
        </div>
        <div class="flex-between">
          <span>NIS: ${rcpt.santri.nis}</span>
        </div>
        <div class="flex-between">
          <span>Nama: ${rcpt.santri.nama.substring(0, 18)}</span>
        </div>
        <div class="divider"></div>
        <div class="flex-between bold">
          <span class="uppercase">${rcpt.transaksi.tipe_transaksi === 'topup' ? 'SETORAN (TOP-UP)' : rcpt.transaksi.tipe_transaksi === 'pembayaran' ? 'BELANJA KANTIN' : 'TARIK TUNAI'}</span>
        </div>
        <div class="flex-between bold">
          <span>Nominal:</span>
          <span>${formatRupiah(rcpt.transaksi.jumlah)}</span>
        </div>
        <div class="divider"></div>
        <div class="flex-between">
          <span>Saldo Awal:</span>
          <span>${formatRupiah(rcpt.santri.saldo_lama)}</span>
        </div>
        <div class="flex-between bold">
          <span>Saldo Akhir:</span>
          <span>${formatRupiah(rcpt.santri.saldo_baru)}</span>
        </div>
        <div class="divider"></div>
        <div class="flex-between" style="font-size: 9px;">
          <span>Kasir: ${rcpt.transaksi.operator || '-'}</span>
        </div>
        <div class="divider"></div>
        <div class="text-center bold" style="margin-top: 10px; font-size: 10px;">
          TERIMA KASIH
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-7 py-6 md:px-8 md:py-6 rounded-[1.5rem] shadow-xl relative overflow-hidden border border-emerald-800/40">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif">Kasir &amp; Transaksi Santri</h3>
        <p className="text-xs md:text-sm text-emerald-100/80 font-medium mt-1">Lakukan transaksi belanja kantin, top-up setoran, atau tarik tunai via kartu pintar santri.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 5 Columns: Card Reader Status & Student Info */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex-1 flex flex-col justify-between min-h-[400px]">
          <div>
            <h4 className="font-extrabold text-slate-800 mb-1">Identitas Kartu Santri</h4>
            <p className="text-xs text-slate-500 font-medium mb-6">Tempelkan kartu RFID/NFC ke alat pembaca. Data santri akan tampil otomatis.</p>
          </div>

          {/* Core State Display */}
          {loadingCard ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-slate-500">Membaca chip kartu...</p>
            </div>
          ) : activeCard ? (
            /* Student Details Card */
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div className="space-y-6">
                {/* Photo initials & Name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center text-xl font-extrabold shadow-inner">
                    {activeCard.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md border font-mono">{activeCard.nis}</span>
                    <h5 className="font-black text-slate-800 text-lg mt-0.5 leading-tight">{activeCard.nama}</h5>
                    <p className="text-xs text-slate-400 font-bold">{activeCard.kelas}</p>
                  </div>
                </div>

                {/* Balance display box */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Uang Jaku Saat Ini</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{formatRupiah(activeCard.saldo)}</p>
                </div>

                {/* Card Type detail */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Kode UID Kartu</p>
                    <p className="font-mono font-bold text-slate-700 truncate">{activeCard.card_uid}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Tipe Enkripsi</p>
                    <p className="font-bold text-slate-700">{activeCard.tipe_kartu}</p>
                  </div>
                </div>
              </div>

              {/* Reset button */}
              <button 
                onClick={() => setActiveCard(null)} 
                className="mt-6 text-xs text-rose-500 font-bold underline text-left hover:text-rose-700"
              >
                Reset Pemindaian Kartu
              </button>
            </div>
          ) : (
            /* Standby / Waiting for card */
            <div className="flex-1 flex flex-col justify-center p-6 border-2 border-dashed border-emerald-250 rounded-2xl bg-emerald-50/20 text-center gap-4 py-10">
              {!showManualInput ? (
                <>
                  <div className="bg-emerald-100 p-3.5 rounded-2xl text-emerald-700 w-fit mx-auto shadow-sm">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">Tap / Gesek Kartu Santri</p>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                      Tempelkan kartu RFID/NFC ke alat pembaca. Data santri akan tampil otomatis.
                    </p>
                  </div>
                  <span className="mx-auto text-[10px] font-bold text-emerald-750 bg-emerald-100/70 border border-emerald-250/20 px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse w-fit">
                    Menunggu Kartu...
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowManualInput(true)} 
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-2 cursor-pointer transition"
                  >
                    Atau Masukkan UID Manual
                  </button>
                </>
              ) : (
                <form onSubmit={handleManualUidSubmit} className="space-y-4 text-left">
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-xs">Pencarian UID Kartu Manual</h5>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ketikkan nomor identitas UID kartu santri.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block">UID Kartu</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Masukkan UID Kartu (desimal/hex)" 
                      value={manualUid}
                      onChange={(e) => setManualUid(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => { setShowManualInput(false); setManualUid(''); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
                    >
                      Cari Kartu
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right 7 Columns: Transaction Input Form */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
          <div>
            <h4 className="font-extrabold text-slate-800 mb-6">Formulir Kasir Pintar</h4>

            {/* ERROR / SUCCESS FEEDBACKS */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-sm font-semibold animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {receipt && (
              <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex flex-col gap-3 animate-scale-up">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Transaksi Berhasil Diproses!</span>
                </div>
                <div className="text-xs space-y-1 divide-y divide-emerald-100/50 font-semibold text-emerald-900/80">
                  <div className="flex justify-between py-1.5 font-bold text-slate-800">
                    <span>Santri:</span>
                    <span>{receipt.santri.nama} ({receipt.santri.nis})</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Tipe Transaksi:</span>
                    <span className="capitalize">{receipt.transaksi.tipe_transaksi}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-emerald-700">
                    <span>Jumlah:</span>
                    <span>{formatRupiah(receipt.transaksi.jumlah)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Saldo Sebelum:</span>
                    <span>{formatRupiah(receipt.santri.saldo_lama)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-800">
                    <span>Saldo Baru Santri:</span>
                    <span>{formatRupiah(receipt.santri.saldo_baru)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Operator:</span>
                    <span>{receipt.transaksi.operator}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-emerald-100/50">
                  <button 
                    onClick={() => handlePrintReceipt(receipt)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                  >
                    Cetak Struk (POS)
                  </button>
                  <button 
                    onClick={() => setReceipt(null)} 
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* TABS FOR TRANSACTION TYPES */}
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => handleTxTypeChange('pembayaran')}
                className={`py-2.5 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  txType === 'pembayaran'
                    ? 'bg-white text-orange-600 shadow-sm border border-orange-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 transition-colors duration-200 ${txType === 'pembayaran' ? 'text-orange-500' : 'text-slate-500'}`} />
                <span>Belanja Kantin</span>
              </button>

              <button
                type="button"
                onClick={() => handleTxTypeChange('topup')}
                className={`py-2.5 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  txType === 'topup'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowUpRight className={`w-4 h-4 transition-colors duration-200 ${txType === 'topup' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>Tambah Saldo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTxTypeChange('penarikan')}
                className={`py-2.5 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  txType === 'penarikan'
                    ? 'bg-white text-rose-700 shadow-sm border border-rose-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowDownLeft className={`w-4 h-4 transition-colors duration-200 ${txType === 'penarikan' ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>Tarik Tunai</span>
              </button>
            </div>

            {/* FORM FIELDS */}
            <form onSubmit={handleProcessTransaction} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Jumlah Transaksi (Rupiah)</label>
                <div className={`flex items-center w-full bg-slate-50 border rounded-xl px-4 py-3 transition-all duration-200 ${
                  txType === 'topup'
                    ? 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10'
                    : txType === 'penarikan'
                    ? 'border-slate-200 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10'
                    : 'border-slate-200 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10'
                }`}>
                  <span className="text-sm font-bold text-slate-400 mr-2 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={amountDisplay}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none font-bold text-slate-800 tabular-nums"
                  />
                  {amountDisplay && (
                    <button
                      type="button"
                      onClick={() => { setAmount(''); setAmountDisplay(''); setSelectedQuickAmount(null); }}
                      className="ml-2 text-slate-300 hover:text-slate-500 text-lg leading-none transition"
                      tabIndex={-1}
                    >×</button>
                  )}
                </div>
                {amount && parseInt(amount, 10) > 0 && (
                  <p className="text-[10px] text-slate-400 font-semibold pl-1">
                    = <span className="font-bold text-slate-600">{formatRupiah(parseInt(amount, 10))}</span>
                  </p>
                )}
              </div>

              {/* QUICK NOMINAL SELECTORS */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((q) => {
                  const isSelected = selectedQuickAmount === q.toString();
                  let buttonClass = '';

                  if (isSelected) {
                    if (txType === 'topup') {
                      buttonClass = 'bg-emerald-600 text-white border-emerald-600 border shadow-md shadow-emerald-500/15 scale-[0.98]';
                    } else if (txType === 'penarikan') {
                      buttonClass = 'bg-rose-600 text-white border-rose-600 border shadow-md shadow-rose-500/15 scale-[0.98]';
                    } else {
                      buttonClass = 'bg-orange-500 text-white border-orange-500 border shadow-md shadow-orange-500/15 scale-[0.98]';
                    }
                  } else {
                    if (txType === 'topup') {
                      buttonClass = 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 hover:text-emerald-700';
                    } else if (txType === 'penarikan') {
                      buttonClass = 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50/50 hover:border-rose-300 hover:text-rose-700';
                    } else {
                      buttonClass = 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50/50 hover:border-orange-300 hover:text-orange-700';
                    }
                  }

                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickAmountClick(q)}
                      className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95 shadow-sm ${buttonClass}`}
                    >
                      +{formatRupiah(q).replace('Rp', '').trim()}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Keterangan transaksi"
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none font-semibold transition-all duration-200 ${
                    txType === 'topup'
                      ? 'focus:border-emerald-500'
                      : txType === 'penarikan'
                      ? 'focus:border-rose-500'
                      : 'focus:border-orange-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Nama Operator Kasir</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="flex items-end">
                  {/* Warning balance info */}
                  {activeCard && txType !== 'topup' && (
                    <div className="text-[10px] text-slate-400 font-semibold mb-2 leading-tight">
                      Sisa saldo santri setelah transaksi: <span className="font-bold text-slate-700">{formatRupiah(activeCard.saldo - (parseInt(amount, 10) || 0))}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || !activeCard || !amount || parseInt(amount, 10) <= 0}
                className={`w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                  (!amount || parseInt(amount, 10) <= 0 || !activeCard)
                    ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                    : processing
                    ? 'bg-slate-400 text-white cursor-wait shadow-none'
                    : txType === 'topup'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                    : txType === 'penarikan'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/20'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Proses Transaksi {txType === 'topup' ? 'Top-Up' : txType === 'penarikan' ? 'Tarik Tunai' : 'Pembayaran'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
