import React, { useState } from 'react';
import { Settings, ShieldCheck, HelpCircle, Save } from 'lucide-react';

export default function Pengaturan() {
  const [minSaldo, setMinSaldo] = useState('10000');
  const [biayaAdmin, setBiayaAdmin] = useState('500');
  const [pesantrenName, setPesantrenName] = useState('Pondok Pesantren Miftahul Huda As-Syadzili');
  const [sistemMode, setSistemMode] = useState('online');

  const handleSave = (e) => {
    e.preventDefault();
    alert('Pengaturan preferensi sistem berhasil disimpan!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pengaturan Sistem</h3>
        <p className="text-sm text-slate-500 font-medium">Ubah parameter operasional, batas saldo minimum santri, dan preferensi bank pesantren.</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Batas Saldo Minimum */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batas Saldo Minimum Santri (Rupiah)</label>
              <input 
                type="number" 
                value={minSaldo}
                onChange={(e) => setMinSaldo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-semibold"
                required
              />
              <span className="text-[10px] text-slate-400">Santri tidak bisa melakukan belanja jika sisa saldo menyentuh limit ini.</span>
            </div>

            {/* Biaya Admin Transaksi */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biaya Admin per Tarik Tunai (Rupiah)</label>
              <input 
                type="number" 
                value={biayaAdmin}
                onChange={(e) => setBiayaAdmin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-semibold"
                required
              />
              <span className="text-[10px] text-slate-400">Biaya administrasi yang dikenakan otomatis saat melakukan transaksi tunai.</span>
            </div>
          </div>

          {/* Nama Lembaga / Pesantren */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lembaga Pendidikan / Pesantren</label>
            <input 
              type="text" 
              value={pesantrenName}
              onChange={(e) => setPesantrenName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mode Operasional */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode Sinkronisasi Sistem</label>
              <select 
                value={sistemMode}
                onChange={(e) => setSistemMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
              >
                <option value="online">Online Cloud Real-time (Sangat Direkomendasikan)</option>
                <option value="offline">Lokal Server Offline (Manual Backup)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-emerald-700/25 active:scale-95 transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
