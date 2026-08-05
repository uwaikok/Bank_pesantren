import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, ShieldAlert, Power, UserPlus, Search } from 'lucide-react';

export default function ManajemenPengguna() {
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Admin Utama', username: 'admin', role: 'Super Admin', status: 'aktif' },
    { id: 2, name: 'Zulfikri', username: 'zulfikri_koperasi', role: 'Kasir Koperasi', status: 'aktif' },
    { id: 3, name: 'Bendahara Pesantren', username: 'bendahara', role: 'Keuangan', status: 'aktif' },
  ]);
  const [search, setSearch] = useState('');

  const handleToggleUserStatus = (userId, name) => {
    alert(`Status akun ${name} berhasil diperbarui.`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Pengurus & Role</h3>
          <p className="text-sm text-slate-500 font-medium">Buat akun pengurus koperasi/kantin pesantren, bendahara, dan atur hak aksesnya.</p>
        </div>
        
        <button 
          onClick={() => alert('Membuka formulir tambah pengurus baru...')}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-700/25 active:scale-95 transition-all text-xs w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengurus Baru</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm max-w-4xl">
        <div className="flex justify-between items-center mb-5">
          <h4 className="font-extrabold text-slate-800 text-sm">Daftar Akun Pengurus</h4>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Cari nama pengurus..."
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
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Hak Akses / Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {usersList.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-slate-850 font-bold">{u.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{u.username}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">{u.role}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.name)}
                      className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition"
                      title="Ubah Status Aktif / Nonaktifkan Akun"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
