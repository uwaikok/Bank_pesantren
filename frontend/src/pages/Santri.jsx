import React, { useState, useEffect } from 'react';
import { useCardReader } from '../context/CardReaderContext';
import { 
  Plus, 
  Search, 
  Trash2, 
  CreditCard, 
  X, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Eye,
  Edit2
} from 'lucide-react';

export default function Santri({ onViewDetail }) {
  const { registerListener } = useCardReader();

  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modals status
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignCardModalOpen, setIsAssignCardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [showManualAddUid, setShowManualAddUid] = useState(false);
  const [showManualEditUid, setShowManualEditUid] = useState(false);
  const [cardWarning, setCardWarning] = useState('');
  const [checkingCard, setCheckingCard] = useState(false);

  // Edit form states
  const [editFormData, setEditFormData] = useState({
    id: '',
    nis: '',
    nama: '',
    kelas: '',
    status: 'aktif',
    card_uid: '',
    tipe_kartu: 'RFID'
  });

  // Form states
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '',
    saldo_awal: '0',
    card_uid: '',
    tipe_kartu: 'RFID'
  });
  const [saldoAwalDisplay, setSaldoAwalDisplay] = useState('0');

  const [assignCardData, setAssignCardData] = useState({
    card_uid: '',
    tipe_kartu: 'RFID'
  });

  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

  const formatInputRupiah = (rawDigits) => {
    if (!rawDigits) return '';
    const num = parseInt(rawDigits, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const parseRawAmount = (str) => {
    return str.replace(/[^0-9]/g, '');
  };

  const handleSaldoAwalChange = (val) => {
    const raw = parseRawAmount(val);
    setFormData({ ...formData, saldo_awal: raw });
    setSaldoAwalDisplay(formatInputRupiah(raw));
  };

  const fetchSantri = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set('search', search);
      if (filterKelas)  params.set('kelas', filterKelas);
      const url = `/api/santri${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSantriList(json.data);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Koneksi gagal saat memuat daftar santri.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
  }, [search, filterKelas]);

  const checkCardAvailability = async (uid, type = 'add') => {
    if (!uid) {
      setCardWarning('');
      return;
    }
    setCheckingCard(true);
    try {
      const res = await fetch(`/api/kartu/${uid}`);
      const json = await res.json();
      if (json.success) {
        const card = json.data;
        if (card.santri_id) {
          // If we are editing, check if it belongs to this student
          if (type === 'edit' && card.santri_id === parseInt(editFormData.id)) {
            setCardWarning('');
          } else {
            setCardWarning(`Kartu ini sudah terdaftar atas nama ${card.nama} (${card.nis}) di kelas ${card.kelas}.`);
          }
        } else {
          setCardWarning('');
        }
      } else {
        setCardWarning('');
      }
    } catch (err) {
      console.error(err);
      setCardWarning('Gagal memverifikasi status kartu di server.');
    } finally {
      setCheckingCard(false);
    }
  };

  // Hook global card listener for automatic UID capture when modal is open
  useEffect(() => {
    if (isAddModalOpen) {
      const unsubscribe = registerListener((card) => {
        const cleanedUid = card.uid;
        setFormData(prev => ({
          ...prev,
          card_uid: cleanedUid,
          tipe_kartu: card.tipe === 'KeyboardEmulation' ? 'RFID' : card.tipe
        }));
        checkCardAvailability(cleanedUid, 'add');
        showBanner('success', `ID Kartu ${cleanedUid} berhasil ditangkap!`);
      });
      return () => {
        unsubscribe();
        setCardWarning('');
      };
    }
  }, [isAddModalOpen]);

  // Hook global card listener for edit modal
  useEffect(() => {
    if (isEditModalOpen) {
      const unsubscribe = registerListener((card) => {
        const cleanedUid = card.uid;
        setEditFormData(prev => ({
          ...prev,
          card_uid: cleanedUid,
          tipe_kartu: card.tipe === 'KeyboardEmulation' ? 'RFID' : card.tipe
        }));
        checkCardAvailability(cleanedUid, 'edit');
        showBanner('success', `ID Kartu ${cleanedUid} berhasil ditangkap!`);
      });
      return () => {
        unsubscribe();
        setCardWarning('');
      };
    }
  }, [isEditModalOpen]);

  const handleEditClick = (santri) => {
    setEditFormData({
      id: santri.id,
      nis: santri.nis,
      nama: santri.nama,
      kelas: santri.kelas,
      status: santri.status,
      card_uid: santri.card_uid || '',
      tipe_kartu: santri.tipe_kartu || 'RFID'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSantri = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/santri/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: editFormData.nis,
          nama: editFormData.nama,
          kelas: editFormData.kelas,
          status: editFormData.status,
          card_uid: editFormData.card_uid
        })
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Data santri ${editFormData.nama} berhasil diperbarui.`);
        setIsEditModalOpen(false);
        setShowManualEditUid(false);
        fetchSantri();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memperbarui data santri.');
    }
  };

  const showBanner = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateSantri = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Santri ${formData.nama} berhasil didaftarkan.`);
        setIsAddModalOpen(false);
        setFormData({ nis: '', nama: '', kelas: '', saldo_awal: '0', card_uid: '', tipe_kartu: 'RFID' });
        setSaldoAwalDisplay('0');
        setShowManualAddUid(false);
        fetchSantri();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memproses pendaftaran santri baru.');
    }
  };

  const handleAssignCard = async (e) => {
    e.preventDefault();
    if (!assignCardData.card_uid) {
      showBanner('error', 'Silakan gesek/tap kartu terlebih dahulu.');
      return;
    }
    try {
      const res = await fetch('/api/kartu/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santri_id: selectedSantri.id,
          card_uid: assignCardData.card_uid,
          tipe_kartu: assignCardData.tipe_kartu
        })
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Kartu baru berhasil dipasangkan ke ${selectedSantri.nama}.`);
        setIsAssignCardModalOpen(false);
        setAssignCardData({ card_uid: '', tipe_kartu: 'RFID' });
        fetchSantri();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal memetakan kartu baru.');
    }
  };

  const handleDeleteSantri = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data santri: ${nama}?\nSemua log transaksi akan tetap tersimpan tetapi tautan kartu akan dilepas.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/santri/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Data santri ${nama} berhasil dihapus.`);
        fetchSantri();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal menghapus data.');
    }
  };

  const handleDeactivateCard = async (cardId, cardUid) => {
    if (!window.confirm(`Apakah Anda yakin ingin MENONAKTIFKAN kartu dengan UID: ${cardUid}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/kartu/${cardId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'nonaktif' })
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Kartu ${cardUid} dinonaktifkan.`);
        fetchSantri();
      } else {
        showBanner('error', json.message);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Gagal menonaktifkan kartu.');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const isFormInvalid = 
    !formData.nis.trim() || 
    !formData.kelas || 
    !formData.nama.trim() || 
    !formData.card_uid.trim() || 
    cardWarning !== '' || 
    checkingCard;

  const isEditFormInvalid = 
    !editFormData.nis.trim() || 
    !editFormData.kelas || 
    !editFormData.nama.trim() || 
    cardWarning !== '' || 
    checkingCard;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-7 py-6 md:px-8 md:py-6 rounded-[1.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 border border-emerald-800/40">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif">Manajemen Santri &amp; Kartu</h3>
          <p className="text-xs md:text-sm text-emerald-100/80 font-medium mt-1">Tambah data santri baru, pasang/ganti RFID, dan kelola status akun.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Santri Baru</span>
        </button>
      </div>

      {/* Floating Status Notification banner */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Cari berdasarkan NIS, Nama Lengkap, atau Rombel Kelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-transparent text-sm focus:outline-none text-slate-700 font-medium"
        />
        <div className="h-4 w-px bg-slate-200"></div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="bg-transparent border-0 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
        >
          <option value="">Semua Kelas</option>
          <option value="Imdad Putra">Imdad Putra</option>
          <option value="Imdad Putri">Imdad Putri</option>
          <option value="Ibtida 1 Putra">Ibtida 1 Putra</option>
          <option value="Ibtida 1 Putri">Ibtida 1 Putri</option>
          <option value="Ibtida 2 Putra">Ibtida 2 Putra</option>
          <option value="Ibtida 2 Putri">Ibtida 2 Putri</option>
          <option value="Ibtida 3">Ibtida 3</option>
          <option value="Tsanawi">Tsanawi</option>
        </select>
        {loading && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
      </div>

      {/* Grid of Santri Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {santriList.length === 0 ? (
          <div className="col-span-full bg-white text-center py-20 rounded-2xl border border-dashed border-slate-200 text-slate-400">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <p className="text-sm font-medium">Memuat data santri...</p>
              </div>
            ) : (
              <p className="text-sm font-medium">Tidak ada data santri ditemukan.</p>
            )}
          </div>
        ) : (
          santriList.map((santri) => (
            <div key={santri.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-mono border border-slate-200">{santri.nis}</span>
                    <h4 className="font-extrabold text-slate-800 mt-1.5 group-hover:text-emerald-700 transition-colors leading-tight">{santri.nama}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{santri.kelas}</p>
                  </div>
                  
                  {/* Status Indicator */}
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${
                    santri.status === 'aktif' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {santri.status}
                  </span>
                </div>

                {/* Pocket Balance Card UI */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Saldo E-Saku</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">{formatRupiah(santri.saldo)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Kartu</p>
                    {santri.card_uid ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-500 flex items-center justify-end gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        Kosong
                      </span>
                    )}
                  </div>
                </div>

                {/* RFID Meta Details */}
                {santri.card_uid && (
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-4">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{santri.card_uid}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3.5 border-t border-slate-100">
                <button
                  onClick={() => onViewDetail && onViewDetail(santri.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-800/10 active:scale-95"
                  title="Lihat detail & rekap santri"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Detail</span>
                </button>
                <button
                  onClick={() => handleEditClick(santri)}
                  className="flex items-center justify-center gap-1 border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 p-2 rounded-xl text-xs font-bold transition"
                  title="Edit profil / kartu santri"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSantri(santri.id, santri.nama)}
                  className="border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 p-2 rounded-xl transition"
                  title="Hapus Santri"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: REGISTRASI SANTRI & KARTU BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Pendaftaran Santri Baru</h3>
                <p className="text-xs text-slate-500 font-medium">Lengkapi biodata dan dekatkan kartu ke reader untuk merekam UID.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSantri} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Nomor Induk Santri (NIS)</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({...formData, nis: e.target.value})}
                    placeholder="SNT004"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Kelas / Rombel</label>
                  <select
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Kelas / Rombel --</option>
                    <optgroup label="Imdad">
                      <option value="Imdad Putra">Imdad Putra</option>
                      <option value="Imdad Putri">Imdad Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 1">
                      <option value="Ibtida 1 Putra">Ibtida 1 Putra</option>
                      <option value="Ibtida 1 Putri">Ibtida 1 Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 2">
                      <option value="Ibtida 2 Putra">Ibtida 2 Putra</option>
                      <option value="Ibtida 2 Putri">Ibtida 2 Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 3">
                      <option value="Ibtida 3">Ibtida 3</option>
                    </optgroup>
                    <optgroup label="Tsanawi">
                      <option value="Tsanawi">Tsanawi</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  placeholder="Ahmad Nur Chamid"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Setoran Saldo Awal (Rp)</label>
                <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <span className="text-sm font-bold text-slate-400 mr-2 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={saldoAwalDisplay}
                    onChange={(e) => handleSaldoAwalChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none font-bold text-slate-800 tabular-nums"
                  />
                  {saldoAwalDisplay && saldoAwalDisplay !== '0' && (
                    <button
                      type="button"
                      onClick={() => { setFormData({...formData, saldo_awal: '0'}); setSaldoAwalDisplay('0'); }}
                      className="ml-2 text-slate-300 hover:text-slate-500 text-lg leading-none transition"
                      tabIndex={-1}
                    >×</button>
                  )}
                </div>
                {formData.saldo_awal && parseInt(formData.saldo_awal, 10) > 0 && (
                  <p className="text-[10px] text-slate-400 font-semibold pl-1">
                    = <span className="font-bold text-slate-600">{formatRupiah(parseInt(formData.saldo_awal, 10))}</span>
                  </p>
                )}
              </div>

              {/* CARD DETECTING BOX */}
              <div className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                cardWarning
                  ? 'bg-rose-50 border-rose-450 text-rose-800'
                  : formData.card_uid 
                  ? 'bg-emerald-50/50 border-emerald-500/40 text-emerald-800' 
                  : 'bg-slate-50 border-slate-300/80 text-slate-500 animate-pulse'
              }`}>
                {checkingCard ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500">Memverifikasi UID kartu...</p>
                  </div>
                ) : (
                  <>
                    <CreditCard className={`w-8 h-8 ${cardWarning ? 'text-rose-550' : formData.card_uid ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {formData.card_uid ? (
                      <div className="text-center w-full">
                        <p className={`text-xs font-extrabold ${cardWarning ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {cardWarning ? 'KARTU DUPLIKAT / BERMASALAH' : 'KARTU TERTAUT'}
                        </p>
                        <p className={`font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border mt-1 inline-block ${cardWarning ? 'border-rose-250 text-rose-800' : 'border-emerald-200/50'}`}>
                          {formData.card_uid}
                        </p>
                        {cardWarning && (
                          <p className="text-[10px] font-bold text-rose-600 mt-2 max-w-[250px] mx-auto leading-tight">{cardWarning}</p>
                        )}
                        <button 
                          type="button" 
                          onClick={() => { setFormData({...formData, card_uid: ''}); setCardWarning(''); setShowManualAddUid(false); }} 
                          className="text-[10px] text-rose-500 font-bold underline mt-1.5 block w-full text-center"
                        >
                          Batal Tautkan
                        </button>
                      </div>
                    ) : showManualAddUid ? (
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          placeholder="Ketik UID Kartu Manual..."
                          value={formData.card_uid}
                          onChange={(e) => setFormData({...formData, card_uid: e.target.value})}
                          onBlur={(e) => checkCardAvailability(e.target.value, 'add')}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowManualAddUid(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-700 font-bold block mx-auto underline"
                        >
                          Kembali ke Scan Otomatis
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-600">Dekatkan Kartu RFID/NFC pada Scanner...</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Sistem akan menangkap input ID secara otomatis</p>
                        <button
                          type="button"
                          onClick={() => setShowManualAddUid(true)}
                          className="text-[10px] text-emerald-700 hover:underline mt-2 font-bold block mx-auto cursor-pointer"
                        >
                          Atau Ketik UID Manual
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isFormInvalid}
                  className={`flex-1 font-bold px-4 py-2.5 rounded-xl text-sm transition ${
                    isFormInvalid
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-800/10 active:scale-95'
                  }`}
                >
                  Daftarkan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA & KARTU SANTRI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Edit Profil & Kartu Santri</h3>
                <p className="text-xs text-slate-500 font-medium">Ubah informasi biodata, status, atau perbarui/hapus kartu santri.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateSantri} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Nomor Induk Santri (NIS)</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nis}
                    onChange={(e) => setEditFormData({...editFormData, nis: e.target.value})}
                    placeholder="SNT001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Kelas / Rombel</label>
                  <select
                    required
                    value={editFormData.kelas}
                    onChange={(e) => setEditFormData({...editFormData, kelas: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Kelas / Rombel --</option>
                    <optgroup label="Imdad">
                      <option value="Imdad Putra">Imdad Putra</option>
                      <option value="Imdad Putri">Imdad Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 1">
                      <option value="Ibtida 1 Putra">Ibtida 1 Putra</option>
                      <option value="Ibtida 1 Putri">Ibtida 1 Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 2">
                      <option value="Ibtida 2 Putra">Ibtida 2 Putra</option>
                      <option value="Ibtida 2 Putri">Ibtida 2 Putri</option>
                    </optgroup>
                    <optgroup label="Ibtida 3">
                      <option value="Ibtida 3">Ibtida 3</option>
                    </optgroup>
                    <optgroup label="Tsanawi">
                      <option value="Tsanawi">Tsanawi</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama}
                  onChange={(e) => setEditFormData({...editFormData, nama: e.target.value})}
                  placeholder="Ahmad Nur Chamid"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Status Akun</label>
                <select
                  required
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* CARD DETECTING BOX FOR EDIT */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nomor Kartu (UID RFID)</label>
                <div className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                  cardWarning
                    ? 'bg-rose-50 border-rose-450 text-rose-800'
                    : editFormData.card_uid 
                    ? 'bg-emerald-50/50 border-emerald-500/40 text-emerald-800' 
                    : 'bg-slate-50 border-slate-300/80 text-slate-500 animate-pulse'
                }`}>
                  {checkingCard ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-semibold text-slate-500">Memverifikasi UID kartu...</p>
                    </div>
                  ) : (
                    <>
                      <CreditCard className={`w-8 h-8 ${cardWarning ? 'text-rose-550' : editFormData.card_uid ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {editFormData.card_uid ? (
                        <div className="text-center w-full">
                          <p className={`text-xs font-extrabold ${cardWarning ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {cardWarning ? 'KARTU DUPLIKAT / BERMASALAH' : 'KARTU TERPASANG'}
                          </p>
                          <p className={`font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border mt-1 inline-block ${cardWarning ? 'border-rose-250 text-rose-800' : 'border-emerald-200/50'}`}>
                            {editFormData.card_uid}
                          </p>
                          {cardWarning && (
                            <p className="text-[10px] font-bold text-rose-600 mt-2 max-w-[250px] mx-auto leading-tight">{cardWarning}</p>
                          )}
                          <button 
                            type="button" 
                            onClick={() => { setEditFormData({...editFormData, card_uid: ''}); setCardWarning(''); setShowManualEditUid(false); }} 
                            className="text-[10px] text-rose-500 font-bold underline mt-1.5 block w-full text-center"
                          >
                            ✕ Lepas Tautan Kartu
                          </button>
                        </div>
                      ) : showManualEditUid ? (
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            placeholder="Ketik UID Kartu Manual..."
                            value={editFormData.card_uid}
                            onChange={(e) => setEditFormData({...editFormData, card_uid: e.target.value})}
                            onBlur={(e) => checkCardAvailability(e.target.value, 'edit')}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => setShowManualEditUid(false)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 font-bold block mx-auto underline"
                          >
                            Kembali ke Scan Otomatis
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-600">TAP/GESEK KARTU PADA ALAT SCANNER...</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Sistem akan menangkap UID kartu secara otomatis</p>
                          <button
                            type="button"
                            onClick={() => setShowManualEditUid(true)}
                            className="text-[10px] text-emerald-700 hover:underline mt-2 font-bold block mx-auto cursor-pointer"
                          >
                            Atau Ketik UID Manual
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditFormInvalid}
                  className={`flex-1 font-bold px-4 py-2.5 rounded-xl text-sm transition ${
                    isEditFormInvalid
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-800/10 active:scale-95'
                  }`}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
