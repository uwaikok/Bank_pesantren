import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileBarChart2,
  ShoppingBag
} from 'lucide-react';

export default function Laporan() {
  const [selectedMonth, setSelectedMonth] = useState('08');
  const [selectedYear, setSelectedYear] = useState('2026');

  const reportStats = {
    totalTopup: 12450000,
    totalBelanja: 8320000,
    totalTarik: 2150000,
    netFlow: 1980000
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Laporan Keuangan Periodik</h3>
          <p className="text-sm text-slate-500 font-medium">Lihat summary, cetak rekap kas bulanan, dan ekspor data audit.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => alert('Mengekspor Laporan PDF...')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>
          <button 
            onClick={() => alert('Mengekspor Laporan Excel...')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs hover:bg-slate-50 transition active:scale-95"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Select Period Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode Laporan:</span>
        <div className="flex gap-3">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium ml-auto">Pembaruan data otomatis per 24 jam.</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-100">Setoran</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pemasukan Kas</p>
          <p className="text-xl font-black mt-1 text-slate-800">{formatRupiah(reportStats.totalTopup)}</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm border-l-4 border-l-orange-500">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-orange-50 text-orange-700 font-extrabold uppercase px-2 py-0.5 rounded border border-orange-100">Belanja</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pengeluaran Koperasi</p>
          <p className="text-xl font-black mt-1 text-slate-800">{formatRupiah(reportStats.totalBelanja)}</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm border-l-4 border-l-rose-500">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold uppercase px-2 py-0.5 rounded border border-rose-100">Tarik Tunai</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pengeluaran Tunai</p>
          <p className="text-xl font-black mt-1 text-slate-800">{formatRupiah(reportStats.totalTarik)}</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm border-l-4 border-l-sky-500">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-sky-50 text-sky-600 p-2.5 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-sky-50 text-sky-700 font-extrabold uppercase px-2 py-0.5 rounded border border-sky-100">Net Flow</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selisih Aliran Kas</p>
          <p className="text-xl font-black mt-1 text-slate-800">{formatRupiah(reportStats.netFlow)}</p>
        </div>
      </div>

      {/* Main Analysis Chart Placeholder */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h4 className="font-extrabold text-slate-800 mb-2">Grafik Tren Aliran Bulanan</h4>
        <p className="text-xs text-slate-500 font-medium mb-6">Perbandingan pemasukan, belanja koperasi, dan tarik tunai secara visual.</p>
        
        <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 shadow-sm">
            <FileBarChart2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Grafik Analisis Visual Aktif</p>
            <p className="text-xs text-slate-400 font-semibold mt-1 max-w-sm">Integrasi ChartJS otomatis dimuat pada saat data audit periode diekspor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
