import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft,
  ShoppingBag, Calendar, Filter, Printer, RefreshCw,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import logo from '../logo.png';

// Utilitas format Rupiah
const fmt = (n) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(n || 0);

// Nama hari Bahasa Indonesia
const hariID = {
  Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
  Thursday: 'Kamis', Friday: "Jum'at", Saturday: 'Sabtu', Sunday: 'Ahad'
};

// Nama bulan Bahasa Indonesia
const namaBulan = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Badge tipe transaksi
function TipeBadge({ tipe }) {
  const map = {
    topup:      { label: 'Top-Up',  bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <ArrowUpRight className="w-3 h-3" /> },
    pembayaran: { label: 'Belanja', bg: 'bg-amber-50 text-amber-700 border-amber-100',       icon: <ShoppingBag   className="w-3 h-3" /> },
    penarikan:  { label: 'Tarik',   bg: 'bg-rose-50   text-rose-700   border-rose-100',     icon: <ArrowDownLeft className="w-3 h-3" /> },
  };
  const cfg = map[tipe] || map.pembayaran;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider border ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function DetailSantri({ santriId, onBack }) {
  const now = new Date();
  const [activeTab, setActiveTab] = useState('log');
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter log aktivitas
  const [filterTipe, setFilterTipe] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [logOffset, setLogOffset] = useState(0);
  const logLimit = 20;

  // Rekap bulanan
  const [rekapBulan, setRekapBulan] = useState(now.getMonth() + 1);
  const [rekapTahun, setRekapTahun] = useState(now.getFullYear());
  const [rekap, setRekap] = useState(null);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const printRef = useRef(null);

  // ─── Fetch detail / log aktivitas ─────────────────────────
  const fetchDetail = async () => {
    setLoadingDetail(true);
    try {
      let url = `/api/santri/${santriId}/detail?limit=${logLimit}&offset=${logOffset}`;
      if (filterTipe)  url += `&tipe=${filterTipe}`;
      if (filterBulan && filterTahun) url += `&bulan=${filterBulan}&tahun=${filterTahun}`;
      else if (filterTahun) url += `&tahun=${filterTahun}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  };

  // ─── Fetch rekap bulanan ───────────────────────────────────
  const fetchRekap = async () => {
    setLoadingRekap(true);
    try {
      const res = await fetch(`/api/santri/${santriId}/rekap?bulan=${rekapBulan}&tahun=${rekapTahun}`);
      const json = await res.json();
      if (json.success) setRekap(json.data);
    } catch (e) { console.error(e); }
    finally { setLoadingRekap(false); }
  };

  useEffect(() => { fetchDetail(); }, [santriId, filterTipe, filterBulan, filterTahun, logOffset]);
  useEffect(() => { if (activeTab === 'rekap') fetchRekap(); }, [activeTab, rekapBulan, rekapTahun]);

  // ─── Print / Cetak Rekap ───────────────────────────────────
  const handlePrint = () => {
    if (!rekap) return;
    const win = window.open('', '_blank');
    
    // Rincian transaksi rows (hanya belanja/pembayaran saja)
    const filteredTrans = rekap.transaksi.filter(tx => tx.tipe_transaksi === 'pembayaran');
    const rowsHtml = filteredTrans.length === 0 
      ? `<tr><td colspan="6" style="text-align: center; padding: 15px; color: #64748b; font-size: 10px;">Tidak ada data riwayat belanja pada periode ini.</td></tr>`
      : filteredTrans.map((tx, idx) => {
          const tipeStyle = 'color: #b45309; font-weight: bold;';
          return `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10px;">
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: bold; color: #64748b;">${idx + 1}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 4px;">
                <div style="font-weight: bold; color: #1e293b;">${hariID[tx.hari_nama] || tx.hari_nama}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 1px;">${tx.tanggal_format}</div>
              </td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px; color: #475569; font-weight: 500;">${tx.jam_format} WIB</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 4px;">
                <div style="color: #334155; font-weight: 500;">${tx.keterangan || '-'}</div>
                <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Operator: ${tx.operator}</div>
              </td>
              <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: 800; ${tipeStyle}">
                -${fmt(tx.jumlah)}
              </td>
              <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: 800; color: #1e293b;">
                ${fmt(tx.saldo_sesudah)}
              </td>
            </tr>
          `;
        }).join('');

    const totalBelanja = filteredTrans.reduce((sum, tx) => sum + Number(tx.jumlah), 0);

    win.document.write(`
      <html>
      <head>
        <title>Rekap Keuangan - ${rekap.santri.nama} - ${rekap.periode.label}</title>
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif, Arial, sans-serif; 
            padding: 10px 30px; 
            font-size: 11px; 
            color: #0f172a;
            line-height: 1.4;
          }
          
          /* Kop Surat */
          .kop-container {
            text-align: center;
            border-bottom: 4px double #000000;
            padding-bottom: 12px;
            margin-bottom: 22px;
          }
          .kop-yayasan {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
            color: #334155;
          }
          .kop-pesantren {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0 0 0;
            color: #000000;
          }
          .kop-alamat {
            font-size: 10px;
            font-style: italic;
            margin: 5px 0 0 0;
            color: #475569;
          }
          .kop-sub {
            font-size: 11px;
            font-weight: bold;
            margin: 5px 0 0 0;
            text-transform: uppercase;
            color: #0f172a;
          }

          /* Judul Dokumen */
          .doc-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .doc-subtitle {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 22px;
          }

          /* Data Santri */
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .meta-table td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 11px;
          }
          .meta-label {
            font-weight: bold;
            color: #475569;
            width: 140px;
          }
          .meta-colon {
            width: 15px;
            text-align: center;
            color: #475569;
          }
          .meta-value {
            color: #0f172a;
          }

          /* Ringkasan */
          .summary-header {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 8px 0;
            border-left: 3px solid #10b981;
            padding-left: 8px;
            color: #0f172a;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .summary-table th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
            color: #475569;
            text-align: center;
          }
          .summary-table td {
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
            color: #0f172a;
          }

          /* Tabel Transaksi */
          .trans-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .trans-table th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 6px 4px;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
            color: #475569;
            text-align: left;
          }
          .trans-table th.center { text-align: center; }
          .trans-table th.right { text-align: right; }

          /* Tanda Tangan */
          .sig-container {
            width: 100%;
            margin-top: 35px;
            display: table;
            table-layout: fixed;
          }
          .sig-box {
            display: table-cell;
            text-align: center;
            width: 50%;
            font-size: 11px;
          }
          .sig-space {
            height: 65px;
          }
          .sig-line {
            font-weight: bold;
            text-decoration: underline;
            color: #000000;
          }

          @media print {
            body { padding: 0; }
            @page { size: portrait; margin: 1.2cm; }
          }
        </style>
      </head>
      <body>

        <!-- Kop Surat Resmi -->
        <table style="width: 100%; border-collapse: collapse; border-bottom: 4px double #000000; padding-bottom: 12px; margin-bottom: 22px;">
          <tr>
            <td style="width: 80px; vertical-align: middle; padding-bottom: 12px; padding-left: 10px;">
              <img src="${logo}" style="width: 75px; height: 75px; object-fit: contain;" />
            </td>
            <td style="text-align: center; vertical-align: middle; padding-bottom: 12px; padding-right: 85px;">
              <h1 style="font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; color: #000000; font-family: 'Times New Roman', Times, serif;">PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI</h1>
              <p style="font-size: 10px; font-style: italic; margin: 6px 0 0 0; color: #334155; line-height: 1.4; font-family: Arial, sans-serif;">
                Sekertariat : Kp. Babakan Nanggerang RT 02 RW 01 Desa Sukajadi Kec. Tarogong Kaler Kabupaten Garut Kode Pos 44151 Tlp. 0838262506
              </p>
            </td>
          </tr>
        </table>

        <!-- Judul Laporan -->
        <div class="doc-title">Laporan Pertanggungjawaban Rekap Keuangan Santri</div>
        <div class="doc-subtitle">Periode Transaksi: ${rekap.periode.label}</div>

        <!-- Data Profil Santri -->
        <table class="meta-table">
          <tr>
            <td class="meta-label">Nama Santri</td>
            <td class="meta-colon">:</td>
            <td class="meta-value"><strong>${rekap.santri.nama}</strong></td>
            <td class="meta-label">No. Induk Santri (NIS)</td>
            <td class="meta-colon">:</td>
            <td class="meta-value"><code style="font-family: monospace; font-size: 12px; font-weight: bold;">${rekap.santri.nis}</code></td>
          </tr>
          <tr>
            <td class="meta-label">Kelas / Kamar</td>
            <td class="meta-colon">:</td>
            <td class="meta-value">${rekap.santri.kelas}</td>
            <td class="meta-label">Tanggal Unduh Cetak</td>
            <td class="meta-colon">:</td>
            <td class="meta-value">${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB</td>
          </tr>
        </table>

        <!-- Ringkasan Bulanan -->
        <h4 class="summary-header">I. Ringkasan Saldo & Arus Kas Bulanan</h4>
        <table class="summary-table">
          <thead>
            <tr>
              <th style="width: 20%;">Saldo Awal Bulan</th>
              <th style="width: 20%; color: #16a34a;">Total Setoran (+)</th>
              <th style="width: 20%; color: #b45309;">Total Belanja (-)</th>
              <th style="width: 20%; color: #dc2626;">Total Tarik Tunai (-)</th>
              <th style="width: 20%; background-color: #f8fafc;">Saldo Akhir Bulan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${fmt(rekap.ringkasan.saldo_awal_bulan)}</td>
              <td style="color: #16a34a;">+${fmt(rekap.ringkasan.total_topup)}</td>
              <td style="color: #b45309;">-${fmt(rekap.ringkasan.total_pembayaran)}</td>
              <td style="color: #dc2626;">-${fmt(rekap.ringkasan.total_penarikan)}</td>
              <td style="background-color: #f8fafc; font-size: 13px; color: #047857;">${fmt(rekap.ringkasan.saldo_akhir_bulan)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Rincian Buku Kas -->
        <h4 class="summary-header">II. Rincian Log Aktivitas Belanja Santri</h4>
        <table class="trans-table">
          <thead>
            <tr>
              <th class="center" style="width: 5%; border: 1px solid #cbd5e1;">No</th>
              <th style="width: 25%; border: 1px solid #cbd5e1;">Hari, Tanggal</th>
              <th class="center" style="width: 15%; border: 1px solid #cbd5e1;">Waktu</th>
              <th style="width: 31%; border: 1px solid #cbd5e1;">Keterangan / Kategori</th>
              <th class="right" style="width: 12%; border: 1px solid #cbd5e1;">Nominal</th>
              <th class="right" style="width: 12%; border: 1px solid #cbd5e1;">Saldo Sisa</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${filteredTrans.length > 0 ? `
              <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #94a3b8;">
                <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px 6px; text-transform: uppercase;">TOTAL BELANJA PERIODE INI</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px 6px; color: #b45309;">-${fmt(totalBelanja)}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px 6px; color: #047857; font-size: 12px;">${fmt(rekap.ringkasan.saldo_akhir_bulan)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- Lembar Tanda Tangan Verifikasi -->
        <div class="sig-container">
          <div class="sig-box">
            <div>Mengetahui/Menyetujui,</div>
            <div style="font-weight: bold; margin-top: 3px;">Orang Tua / Wali Santri</div>
            <div class="sig-space"></div>
            <div class="sig-line">......................................................</div>
          </div>
          <div class="sig-box">
            <div>Garut, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style="font-weight: bold; margin-top: 3px;">Petugas Pengelola E-Saku</div>
            <div class="sig-space"></div>
            <div class="sig-line">......................................................</div>
          </div>
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

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Memuat data santri...</p>
      </div>
    );
  }

  const { santri, statistik, transaksi, total_transaksi } = detail;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Tombol Kembali ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Santri
      </button>

      {/* ── Header Profil Santri ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar & Bio */}
          <div className="flex items-center gap-5 flex-1">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center text-2xl font-extrabold shadow-inner flex-shrink-0">
              {santri.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border font-mono">{santri.nis}</span>
              <h2 className="font-black text-slate-900 text-xl mt-0.5 leading-tight">{santri.nama}</h2>
              <p className="text-sm text-slate-400 font-bold">{santri.kelas}</p>
              {/* Info Kartu */}
              {santri.card_uid ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-emerald-700">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{santri.card_uid}</span>
                  <span className="text-[9px] uppercase text-emerald-500 font-bold">{santri.tipe_kartu}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-rose-500">
                  <CreditCard className="w-3.5 h-3.5" /> Belum ada kartu terdaftar
                </div>
              )}
            </div>
          </div>

          {/* Saldo & Status */}
          <div className="flex gap-4 flex-wrap md:flex-nowrap">
            <div className="bg-emerald-600 text-white rounded-2xl px-6 py-4 shadow-lg shadow-emerald-700/20">
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Saldo E-Saku</p>
              <p className="text-2xl font-black mt-0.5">{fmt(santri.saldo)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex flex-col justify-between min-w-[130px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akun</p>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full w-fit mt-2 ${santri.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {santri.status === 'aktif' ? '● Aktif' : '○ Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistik keseluruhan mini */}
        {statistik && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            {[
              { label: 'Total Top-Up', value: fmt(statistik.total_topup), color: 'text-emerald-600', count: statistik.count_topup + 'x' },
              { label: 'Total Belanja', value: fmt(statistik.total_pembayaran), color: 'text-amber-600', count: statistik.count_pembayaran + 'x' },
              { label: 'Total Tarik Tunai', value: fmt(statistik.total_penarikan), color: 'text-rose-600', count: statistik.count_penarikan + 'x' },
              { label: 'Total Transaksi', value: statistik.total_transaksi + ' kali', color: 'text-slate-700', count: 'semua waktu' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
                <p className={`font-extrabold text-sm mt-0.5 ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{s.count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'log', label: '📋 Log Aktivitas' },
          { id: 'rekap', label: '📊 Rekap Bulanan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* TAB 1 — LOG AKTIVITAS                       */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'log' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            {/* Tipe filter */}
            <select
              value={filterTipe}
              onChange={e => { setFilterTipe(e.target.value); setLogOffset(0); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Tipe</option>
              <option value="topup">Top-Up Saldo</option>
              <option value="pembayaran">Belanja Koperasi</option>
              <option value="penarikan">Tarik Tunai</option>
            </select>
            {/* Bulan filter */}
            <select
              value={filterBulan}
              onChange={e => { setFilterBulan(e.target.value); setLogOffset(0); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Bulan</option>
              {namaBulan.slice(1).map((n, i) => (
                <option key={i + 1} value={i + 1}>{n}</option>
              ))}
            </select>
            {/* Tahun filter */}
            <select
              value={filterTahun}
              onChange={e => { setFilterTahun(e.target.value); setLogOffset(0); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Tahun</option>
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {/* Reset filter */}
            {(filterTipe || filterBulan || filterTahun) && (
              <button
                onClick={() => { setFilterTipe(''); setFilterBulan(''); setFilterTahun(''); setLogOffset(0); }}
                className="text-xs font-bold text-rose-500 hover:text-rose-700"
              >
                ✕ Reset Filter
              </button>
            )}
            {loadingDetail && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin ml-auto" />}
          </div>

          {/* Tabel log */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5">Tanggal & Hari</th>
                  <th className="py-3.5 px-5">Jam</th>
                  <th className="py-3.5 px-5 text-center">Tipe</th>
                  <th className="py-3.5 px-5">Keterangan</th>
                  <th className="py-3.5 px-5 text-right">Nominal</th>
                  <th className="py-3.5 px-5 text-right">Saldo Sesudah</th>
                  <th className="py-3.5 px-5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transaksi.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-sm text-slate-400">
                      {loadingDetail ? 'Memuat log aktivitas...' : 'Tidak ada aktivitas ditemukan dengan filter ini.'}
                    </td>
                  </tr>
                ) : (
                  transaksi.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition duration-100">
                      {/* Tanggal */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-2">
                          <div className="bg-slate-100 rounded-lg p-1.5 flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-700">{tx.tanggal_format}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{hariID[tx.hari_nama] || tx.hari_nama}</p>
                          </div>
                        </div>
                      </td>
                      {/* Jam */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <Clock className="w-3 h-3" />
                          {tx.jam_format} WIB
                        </div>
                      </td>
                      {/* Tipe badge */}
                      <td className="py-3.5 px-5 text-center">
                        <TipeBadge tipe={tx.tipe_transaksi} />
                      </td>
                      {/* Keterangan */}
                      <td className="py-3.5 px-5 max-w-[200px]">
                        <p className="text-xs font-semibold text-slate-600 truncate" title={tx.keterangan}>{tx.keterangan}</p>
                      </td>
                      {/* Nominal */}
                      <td className={`py-3.5 px-5 text-right font-extrabold text-xs ${tx.tipe_transaksi === 'topup' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.tipe_transaksi === 'topup' ? '+' : '-'}{fmt(tx.jumlah)}
                      </td>
                      {/* Saldo sesudah */}
                      <td className="py-3.5 px-5 text-right">
                        <p className="text-xs font-extrabold text-slate-800">{fmt(tx.saldo_sesudah)}</p>
                      </td>
                      {/* Operator */}
                      <td className="py-3.5 px-5">
                        <p className="text-[10px] font-semibold text-slate-400">{tx.operator}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total_transaksi > logLimit && (
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Menampilkan {logOffset + 1}–{Math.min(logOffset + logLimit, total_transaksi)} dari {total_transaksi} aktivitas
              </span>
              <div className="flex gap-2">
                <button
                  disabled={logOffset === 0}
                  onClick={() => setLogOffset(Math.max(0, logOffset - logLimit))}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                >
                  ← Kembali
                </button>
                <button
                  disabled={logOffset + logLimit >= total_transaksi}
                  onClick={() => setLogOffset(logOffset + logLimit)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* TAB 2 — REKAP BULANAN                       */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'rekap' && (
        <div className="space-y-5">
          {/* Selector bulan & tahun + tombol cetak */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap gap-3 items-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={rekapBulan}
              onChange={e => setRekapBulan(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {namaBulan.slice(1).map((n, i) => (
                <option key={i + 1} value={i + 1}>{n}</option>
              ))}
            </select>
            <select
              value={rekapTahun}
              onChange={e => setRekapTahun(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {loadingRekap && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
            <div className="ml-auto flex gap-2">
              <button
                onClick={fetchRekap}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition"
              >
                <RefreshCw className="w-4 h-4" /> Muat Ulang
              </button>
              <button
                onClick={handlePrint}
                disabled={!rekap}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-800/10 transition disabled:opacity-40"
              >
                <Printer className="w-4 h-4" /> Cetak Rekap
              </button>
            </div>
          </div>

          {/* Konten rekap */}
          {!rekap ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-sm shadow-sm">
              {loadingRekap ? 'Memuat rekap...' : 'Pilih bulan dan tahun untuk melihat rekap.'}
            </div>
          ) : (
            <div ref={printRef}>
              {/* Info santri & periode untuk print */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm mb-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg">
                      Rekap Keuangan — {rekap.periode.label}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {rekap.santri.nama} &bull; {rekap.santri.nis} &bull; {rekap.santri.kelas}
                    </p>
                  </div>
                  {rekap.ringkasan.total_transaksi === 0 && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                      Tidak ada transaksi bulan ini
                    </span>
                  )}
                </div>

                {/* Kartu ringkasan 5 metrik */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Saldo Awal */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Saldo Awal Bulan</p>
                    <p className="text-base font-black text-slate-700 mt-1">{fmt(rekap.ringkasan.saldo_awal_bulan)}</p>
                  </div>

                  {/* Total Top-Up */}
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Total Top-Up</p>
                    </div>
                    <p className="text-base font-black text-emerald-700">{fmt(rekap.ringkasan.total_topup)}</p>
                    <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">{rekap.ringkasan.count_topup} kali setoran</p>
                  </div>

                  {/* Total Belanja */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      <p className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Total Belanja</p>
                    </div>
                    <p className="text-base font-black text-amber-700">{fmt(rekap.ringkasan.total_pembayaran)}</p>
                    <p className="text-[9px] text-amber-500 font-semibold mt-0.5">{rekap.ringkasan.count_pembayaran} kali belanja</p>
                  </div>

                  {/* Total Tarik */}
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      <p className="text-[9px] text-rose-700 font-bold uppercase tracking-wider">Tarik Tunai</p>
                    </div>
                    <p className="text-base font-black text-rose-700">{fmt(rekap.ringkasan.total_penarikan)}</p>
                    <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{rekap.ringkasan.count_penarikan} kali tarik</p>
                  </div>

                  {/* Saldo Akhir */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Saldo Akhir Bulan</p>
                    <p className="text-base font-black text-emerald-400 mt-1">{fmt(rekap.ringkasan.saldo_akhir_bulan)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{rekap.ringkasan.total_transaksi} total transaksi</p>
                  </div>
                </div>
              </div>

              {/* Tabel detail transaksi bulan ini */}
              <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800">
                    Daftar Transaksi — {rekap.periode.label}
                  </h4>
                  <span className="text-xs font-bold text-slate-400">
                    {rekap.transaksi.length} transaksi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3.5 px-5">No</th>
                        <th className="py-3.5 px-5">Hari, Tanggal</th>
                        <th className="py-3.5 px-5">Jam</th>
                        <th className="py-3.5 px-5 text-center">Tipe</th>
                        <th className="py-3.5 px-5">Keterangan / Kategori</th>
                        <th className="py-3.5 px-5 text-right">Nominal</th>
                        <th className="py-3.5 px-5 text-right">Saldo Sisa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rekap.transaksi.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-14 text-center text-sm text-slate-400">
                            Belum ada transaksi pada {rekap.periode.label}.
                          </td>
                        </tr>
                      ) : (
                        rekap.transaksi.map((tx, idx) => (
                          <tr key={tx.id} className={`hover:bg-slate-50/70 transition ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                            <td className="py-3 px-5 text-[10px] text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-3 px-5">
                              <p className="text-xs font-extrabold text-slate-700">{hariID[tx.hari_nama] || tx.hari_nama}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{tx.tanggal_format}</p>
                            </td>
                            <td className="py-3 px-5">
                              <span className="text-xs font-bold text-slate-500">{tx.jam_format} WIB</span>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <TipeBadge tipe={tx.tipe_transaksi} />
                            </td>
                            <td className="py-3 px-5 max-w-[180px]">
                              <p className="text-xs font-semibold text-slate-600 truncate" title={tx.keterangan}>{tx.keterangan}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{tx.operator}</p>
                            </td>
                            <td className={`py-3 px-5 text-right font-extrabold text-xs ${tx.tipe_transaksi === 'topup' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.tipe_transaksi === 'topup' ? '+' : '-'}{fmt(tx.jumlah)}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <span className="text-xs font-extrabold text-slate-800">{fmt(tx.saldo_sesudah)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Footer total */}
                    {rekap.transaksi.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-900 text-white text-xs font-extrabold">
                          <td colSpan="4" className="py-3.5 px-5">TOTAL BULAN {rekap.periode.label.toUpperCase()}</td>
                          <td className="py-3.5 px-5 text-right text-emerald-400">+{fmt(rekap.ringkasan.total_topup)}</td>
                          <td className="py-3.5 px-5 text-right text-rose-400">-{fmt(rekap.ringkasan.total_pembayaran + rekap.ringkasan.total_penarikan)}</td>
                          <td className="py-3.5 px-5 text-right text-emerald-300">{fmt(rekap.ringkasan.saldo_akhir_bulan)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
