# E-Saku Santri - Pengelolaan Uang Jajan Berbasis Kartu RFID/NFC & Magnetic Stripe

Aplikasi Pengelolaan Uang Jajan Santri (Bank Pesantren) dirancang khusus untuk administrator pesantren (Admin/Server Only) guna memantau, mengontrol, dan melakukan transaksi keuangan santri (Top-Up, Tarik Tunai, & Pembayaran Koperasi) secara efisien berbasis kartu pintar.

---

## 🚀 Fitur Utama

1. **Single User / Single Role (Server Only)**: Hanya diakses oleh Admin Pengurus Pesantren. Santri tidak memiliki login.
2. **Dual-Mode Pembaca Kartu (Hardware Integration)**:
   - **Keyboard Emulation Mode (Plug-and-Play)**: Menangkap tap kartu secara instan di form manapun tanpa fokus input manual dengan menyaring kecepatan ketukan (kecepatan tap sensor < 40ms).
   - **Serial COM Port Mode (WebSockets Broadcaster)**: Membaca data port COM serial fisik (COM3, /dev/ttyUSB0) dari Arduino/Card Reader menggunakan Node.js dan menyiarkannya ke frontend secara real-time via WebSocket.
3. **Kasir Pintar**: Proses transaksi Pembayaran Belanja, Top-Up Saldo, dan Tarik Tunai secara cepat dengan nominal pintasan sekali klik.
4. **CRUD Santri & Pemetaan RFID**: Pendaftaran santri baru, pengisian saldo awal, penonaktifan kartu lama, dan pencatatan kartu baru jika hilang.
5. **Aman & Transaksional**: Operasi database dibungkus dengan query transaksi SQL (BEGIN/COMMIT/ROLLBACK) untuk mencegah kebocoran saldo/inkonsistensi data.

---

## 🛠️ Arsitektur Sistem

Aplikasi ini dibagi menjadi 3 bagian utama:
1. **Database PostgreSQL**: Menyimpan data `santri`, `kartu`, dan logs `transaksi`.
2. **Node.js + Express API**: Melayani REST API untuk CRUD data dan menampung server WebSocket.
3. **React + Tailwind CSS Frontend**: Dashboard modern dan responsif untuk admin/kasir koperasi.

---

## 📁 Struktur Folder Proyek

```text
bank-pesantren/
├── database/
│   └── schema.sql              # Skema tabel database PostgreSQL & Seed data
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Koneksi Pool PostgreSQL
│   │   ├── controllers/
│   │   │   ├── santri.controller.js
│   │   │   ├── kartu.controller.js
│   │   │   └── transaksi.controller.js
│   │   └── routes/
│   │       ├── santri.routes.js
│   │       ├── kartu.routes.js
│   │       └── transaksi.routes.js
│   │   └── app.js              # Inisialisasi Express & routing middleware
│   ├── server.js               # Entry point Express HTTP & WebSocket Server
│   ├── hardware_listener.js    # Listener Serial Port Reader (Broadcaster)
│   ├── .env                    # Konfigurasi database & hardware port COM
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx       # Layout sidebar admin & status RFID
│   │   ├── context/
│   │   │   └── CardReaderContext.jsx # Penanganan Tap Kartu (HID & WebSockets)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Ringkasan finansial & transaksi terbaru
│   │   │   ├── Kasir.jsx        # Halaman tap transaksi/pembayaran & top-up
│   │   │   ├── Santri.jsx       # Manajemen CRUD & pemetaan RFID/Gesek
│   │   │   └── Riwayat.jsx      # Audit log transaksi lengkap
│   │   ├── App.jsx              # Router & state halaman aktif
│   │   ├── index.css            # Custom CSS & Tailwind imports
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Petunjuk Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
* Node.js versi 18+ terinstal di server/komputer.
* PostgreSQL berjalan lokal.

### 2. Setup Database PostgreSQL
Buat database baru bernama `bank_pesantren` lalu eksekusi file `database/schema.sql` untuk membuat tabel dan data uji coba (seeding):
```bash
# Contoh menggunakan command line psql (ganti username dengan postgres Anda)
psql -U postgres -d bank_pesantren -f database/schema.sql
```

### 3. Konfigurasi Backend & Server
Masuk ke direktori `backend` dan install dependensi:
```bash
cd backend
npm install
```
Sesuaikan konfigurasi koneksi database Anda di file `backend/.env`:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=bank_pesantren

# Sesuaikan COM port jika Anda menggunakan card reader berbasis Serial/COM (misal COM3 di Windows)
SERIAL_PORT=COM3
SERIAL_BAUD_RATE=9600
```
Jalankan server API dan WebSocket:
```bash
# Menjalankan server dalam mode development
npm run dev
```

### 4. Setup Frontend Dashboard
Buka terminal baru, masuk ke direktori `frontend`, dan pasang modul:
```bash
cd frontend
npm install
```
Jalankan server Vite lokal:
```bash
npm run dev
```
Akses dashboard admin di browser Anda melalui alamat: **`http://localhost:3000`**

### 5. Menjalankan Hardware Reader Listener (Opsional)
Jika Anda menggunakan mesin RFID Reader / NFC Reader / Magnetic Stripe Reader yang terhubung melalui port Serial/COM ke komputer, jalankan script listener berikut untuk menyiarkan pembacaan kartu:
```bash
cd backend
npm run hardware
```
*Catatan: Jika modul fisik tidak terdeteksi, script ini akan secara otomatis berjalan dalam **Simulator Mode** yang mensimulasikan tap kartu mock setiap 30 detik untuk pengujian.*

---

## 🔌 Cara Kerja Integrasi Mesin Pembaca Kartu (Card Reader)

### A. Keyboard Emulation (HID Mode)
Mayoritas USB RFID/NFC/Magnetic Stripe Reader di pasaran bekerja layaknya keyboard eksternal (mengirim karakter ID lalu mengirim tombol `Enter`). 
Di dalam file `CardReaderContext.jsx`, terdapat sistem buffer keydown:
* Menghitung jeda waktu pengetikan (karakter pembaca kartu biasanya terkirim dalam waktu `< 30 milidetik`).
* Jika kecepatan ketukan sesuai dan ditutup dengan tombol `Enter`, input ditangkap sebagai tap kartu dan otomatis dikirimkan ke formulir yang sedang aktif (misalnya di Halaman Kasir atau Pendaftaran Santri) tanpa mengganggu posisi kursor admin.

### B. Serial WebSockets Broadcast Mode
Untuk developer/embedded engineer yang merakit modul custom (misalnya Arduino / ESP32 terhubung dengan scanner RFID RC522/PN532 lewat koneksi USB-Serial):
* File `backend/hardware_listener.js` akan memantau port Serial (misal `COM3`).
* Begitu ada baris ID kartu masuk ke port serial, listener akan mengirimkannya ke server backend via koneksi WebSocket (`ws://localhost:5000`).
* Server backend meneruskan data tap tersebut ke halaman browser admin yang sedang aktif secara real-time.
