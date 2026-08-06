import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Lock, KeyRound, ShieldCheck, CheckCircle2,
  Save, Camera, Phone, Mail, UserCheck, UserX,
  Edit2, X, Plus, Shield, AlertCircle, Eye, EyeOff, Trash2
} from 'lucide-react';

const API_BASE = '/api';

export default function Profil() {
  const currentUser = localStorage.getItem('esaku_user') || 'admin';
  const token = localStorage.getItem('esaku_token');
  const userRole = localStorage.getItem('esaku_role') || 'Kasir';
  const isAdmin = userRole.toLowerCase() === 'administrator';

  const [activeTab, setActiveTab] = useState('profil');
  const tabs = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'keamanan', label: 'Keamanan', icon: Lock },
    ...(isAdmin ? [{ id: 'manajemen', label: 'Manajemen Akun', icon: Shield }] : []),
  ];

  // Profile states
  const [fullName, setFullName] = useState(currentUser.toLowerCase() === 'admin' ? 'Administrator Utama' : currentUser);
  const [phone, setPhone] = useState('081234567890');
  const [email, setEmail] = useState('admin@miftahulhuda.sch.id');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast
  const [msg, setMsg] = useState(null);

  // Admin: users list
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'Kasir' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { user, hasTransactions }

  const showNotif = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 6000);
  };

  // Fetch users list for admin
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setUsersList(json.data);
      else showNotif('error', json.message || 'Gagal memuat daftar pengurus.');
    } catch {
      showNotif('error', 'Server tidak dapat dijangkau saat memuat daftar pengguna.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'manajemen') fetchUsers();
  }, [activeTab]);

  // Avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target.result);
      showNotif('success', 'Foto profil berhasil diubah.');
    };
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showNotif('success', 'Informasi profil berhasil diperbarui.');
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return showNotif('error', 'Semua kolom wajib diisi.');
    if (newPassword !== confirmPassword) return showNotif('error', 'Konfirmasi password tidak cocok.');
    if (newPassword.length < 6) return showNotif('error', 'Password baru minimal 6 karakter.');

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        showNotif('success', 'Password berhasil diperbarui!');
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        showNotif('error', json.message || 'Gagal memperbarui password.');
      }
    } catch {
      showNotif('error', 'Server tidak dapat dijangkau.');
    }
  };

  // Save user (add or edit)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.username) return showNotif('error', 'Nama dan username wajib diisi.');

    const url = editingUser ? `${API_BASE}/users/${editingUser.id}` : `${API_BASE}/users`;
    const method = editingUser ? 'PUT' : 'POST';
    const body = editingUser 
      ? { name: userForm.name, role: userForm.role }
      : { name: userForm.name, username: userForm.username, password: userForm.password, role: userForm.role };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showNotif('success', editingUser ? `Akun ${userForm.name} berhasil diperbarui.` : `Akun ${userForm.name} berhasil ditambahkan dan langsung bisa digunakan untuk login.`);
        setIsModalOpen(false);
        setEditingUser(null);
        setUserForm({ name: '', username: '', password: '', role: 'Kasir' });
        fetchUsers();
      } else {
        showNotif('error', json.message || 'Gagal menyimpan akun pengurus.');
      }
    } catch {
      showNotif('error', 'Server tidak dapat dijangkau.');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    const next = user.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (json.success) {
        showNotif('success', `Akun ${user.name} sekarang ${next.toUpperCase()}. ${next === 'nonaktif' ? 'Akun ini tidak dapat login.' : ''}`);
        fetchUsers();
      } else {
        showNotif('error', json.message || 'Gagal mengubah status akun.');
      }
    } catch {
      showNotif('error', 'Server tidak dapat dijangkau.');
    }
  };

  // Delete user with check for transactions
  const handleDeleteClick = async (user) => {
    // Check if user has any transactions as operator
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/check-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setDeleteConfirm({ user, hasTransactions: json.success && json.data?.hasTransactions });
    } catch {
      setDeleteConfirm({ user, hasTransactions: false });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`${API_BASE}/users/${deleteConfirm.user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        showNotif('success', `Akun ${deleteConfirm.user.name} berhasil dihapus.`);
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        showNotif('error', json.message || 'Gagal menghapus akun.');
      }
    } catch {
      showNotif('error', 'Server tidak dapat dijangkau.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-7 py-6 md:px-8 md:py-6 rounded-[1.5rem] shadow-xl border border-emerald-800/40">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif">Pengaturan Profil Pengurus</h3>
        <p className="text-xs md:text-sm text-emerald-100/80 font-medium mt-1">Kelola data diri, kontak, password akses, dan akun staf pengurus bank pesantren.</p>
      </div>

      {/* Toast Notification */}
      {msg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border text-xs font-bold shadow-sm animate-fade-in ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tab Menu */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: PROFIL */}
          {activeTab === 'profil' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Avatar */}
              <div className="lg:col-span-4 flex flex-col items-center gap-4 text-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover shadow-md border-4 border-white" />
                    : <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black text-3xl flex items-center justify-center shadow-lg border-4 border-white">{currentUser.substring(0, 2).toUpperCase()}</div>
                  }
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                    <Camera className="w-4 h-4" /><span>Ubah</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs transition active:scale-95">
                  <Camera className="w-3.5 h-3.5 text-slate-500" /><span>Ubah Foto Profil</span>
                </button>
                <div className="w-full border-t border-slate-100 pt-4 space-y-2 text-left text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Username:</span>
                    <span className="font-mono font-bold text-slate-800">{currentUser}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">Status:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Aktif</span>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 block">Nama Lengkap</label>
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 block">Username (Read-Only)</label>
                      <input type="text" disabled value={currentUser} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold text-slate-400 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 block">Nomor HP / WhatsApp</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 block">Email (Opsional)</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition text-xs">
                      <Save className="w-4 h-4" /><span>Simpan Perubahan Profil</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: KEAMANAN */}
          {activeTab === 'keamanan' && (
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-5">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-800 text-sm">Ubah Kata Sandi (Password)</h4>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {[
                  { label: 'Password Saat Ini', value: oldPassword, set: setOldPassword, show: showOld, toggle: () => setShowOld(!showOld) },
                  { label: 'Password Baru', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
                  { label: 'Konfirmasi Password Baru', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                ].map(({ label, value, set, show, toggle }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        required value={value}
                        onChange={(e) => set(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                      <button type="button" onClick={toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button type="submit" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition text-xs">
                    <Lock className="w-4 h-4" /><span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: MANAJEMEN AKUN (Admin only) */}
          {activeTab === 'manajemen' && isAdmin && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <p className="text-xs text-slate-500 font-medium">Akun yang dibuat di sini langsung aktif dan dapat digunakan untuk login sesuai role yang dipilih.</p>
                <button
                  onClick={() => { setEditingUser(null); setUserForm({ name: '', username: '', password: '', role: 'Kasir' }); setIsModalOpen(true); }}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition text-xs shrink-0"
                >
                  <Plus className="w-4 h-4" /><span>+ Tambah Akun Baru</span>
                </button>
              </div>

              {usersLoading ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">Memuat daftar pengurus...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[520px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Nama Lengkap</th>
                        <th className="py-3 px-4">Username</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {usersList.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Belum ada pengurus terdaftar.</td></tr>
                      )}
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{u.name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{u.username}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${u.role === 'Administrator' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{u.role}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${u.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{u.status}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingUser(u); setUserForm({ name: u.name, username: u.username, password: '', role: u.role }); setIsModalOpen(true); }} className="p-1.5 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-lg transition" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleToggleStatus(u)} className={`p-1.5 rounded-lg border transition ${u.status === 'aktif' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`} title={u.status === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}>
                                {u.status === 'aktif' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDeleteClick(u)} className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition" title="Hapus Akun">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 animate-scale-up overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-extrabold text-slate-800 text-sm">{editingUser ? 'Edit Akun Pengurus' : 'Tambah Akun Pengurus Baru'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Nama Lengkap</label>
                <input type="text" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Username {editingUser && <span className="text-slate-400">(tidak dapat diubah)</span>}</label>
                <input type="text" required disabled={!!editingUser} value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${editingUser ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-mono' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} />
              </div>
              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold block">Password Awal <span className="text-slate-400">(di-hash otomatis)</span></label>
                  <input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Min. 6 karakter" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Role / Hak Akses</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer">
                  <option value="Administrator">Administrator</option>
                  <option value="Pengurus Koperasi">Pengurus Koperasi</option>
                  <option value="Kasir">Kasir Koperasi / Kantin</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition">Batal</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition shadow-md">{editingUser ? 'Simpan Edit' : 'Tambah Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 animate-scale-up overflow-hidden">
            <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50">
              <div className="bg-rose-100 p-2.5 rounded-xl flex-shrink-0"><Trash2 className="w-5 h-5 text-rose-600" /></div>
              <h4 className="font-extrabold text-rose-800 text-sm">Konfirmasi Hapus Akun</h4>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 font-semibold leading-relaxed">
                Yakin ingin menghapus akun <strong className="text-slate-900">"{deleteConfirm.user.name}"</strong>? Tindakan ini tidak bisa dibatalkan.
              </p>
              {deleteConfirm.hasTransactions && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Peringatan: Akun Ini Punya Riwayat Transaksi</p>
                    <p className="text-amber-700 font-medium mt-0.5 leading-relaxed">Akun ini tercatat sebagai operator pada sejumlah transaksi di Riwayat Log. Menghapusnya dapat merusak jejak audit. <strong>Disarankan untuk Nonaktifkan saja</strong> agar riwayat tetap utuh.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition">Batal</button>
                {deleteConfirm.hasTransactions && (
                  <button onClick={() => { handleToggleStatus(deleteConfirm.user); setDeleteConfirm(null); }} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition">Nonaktifkan Saja</button>
                )}
                <button onClick={handleConfirmDelete} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold transition shadow-md">Hapus Permanen</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
