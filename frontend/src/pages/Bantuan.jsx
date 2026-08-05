import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export default function Bantuan() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'Bagaimana cara mendaftarkan kartu RFID baru untuk santri?',
      a: 'Masuk ke menu "Data Santri", klik tombol "Tambah Santri Baru". Lengkapi identitas santri, kemudian dekatkan kartu RFID baru Anda ke alat pembaca. Sistem akan secara otomatis menangkap kode UID kartu tersebut.'
    },
    {
      q: 'Bagaimana jika kartu RFID santri hilang?',
      a: 'Buka menu "Kelola Kartu RFID". Temukan kartu milik santri tersebut, lalu klik tombol "Nonaktifkan / Blokir Kartu" (ikon Power). Setelah itu, Anda dapat memetakan kartu baru ke santri tersebut lewat menu edit pada "Data Santri".'
    },
    {
      q: 'Bagaimana cara melakukan penarikan tunai uang saku?',
      a: 'Buka menu "Kasir & Transaksi", tempelkan kartu RFID santri. Pilih tab "Tarik Tunai", ketik jumlah nominal penarikan, lalu klik tombol "Proses Transaksi". Saldo santri akan terpotong secara otomatis.'
    },
    {
      q: 'Di mana saya bisa melihat total pengeluaran belanja harian?',
      a: 'Seluruh riwayat log harian kasir koperasi/kantin dapat diakses secara detail pada menu "Riwayat Log". Gunakan filter pencarian atau rentang tanggal untuk mempersempit hasil pencarian.'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pusat Bantuan & Panduan</h3>
        <p className="text-sm text-slate-500 font-medium">Temukan jawaban atas pertanyaan umum dan solusi kendala teknis sistem E-Saku.</p>
      </div>

      {/* Guide Card banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-2xl shadow-md flex items-center gap-4 max-w-3xl">
        <div className="bg-white/10 p-3 rounded-full flex-shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm">Butuh Panduan Manual Lengkap?</h4>
          <p className="text-[11px] text-emerald-1050/80 leading-relaxed mt-1">Kami menyediakan modul petunjuk penggunaan dalam bentuk PDF lengkap dengan panduan instalasi hardware reader. Hubungi tim IT support pesantren untuk detailnya.</p>
        </div>
      </div>

      {/* FAQ Accordions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm max-w-3xl space-y-3">
        <h4 className="font-extrabold text-slate-800 text-sm mb-4">Tanya Jawab Umum (FAQ)</h4>

        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden transition-all duration-200">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex justify-between items-center px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 text-left focus:outline-none"
              >
                <span className="text-xs font-bold text-slate-700">{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
              </button>
              {isOpen && (
                <div className="px-4 py-3 text-xs text-slate-500 leading-relaxed bg-white border-t border-slate-100 animate-fade-in font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
