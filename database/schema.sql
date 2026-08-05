-- Database Schema for Santri Pocket Money Management System (Bank Pesantren) - MySQL Version

-- Drop tables if they exist (for migration / fresh setup)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS kartu;
DROP TABLE IF EXISTS santri;
SET FOREIGN_KEY_CHECKS = 1;

-- Create Santri Table
CREATE TABLE santri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    saldo DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_saldo CHECK (saldo >= 0),
    CONSTRAINT chk_status_santri CHECK (status IN ('aktif', 'nonaktif'))
) ENGINE=InnoDB;

-- Create Kartu Table
CREATE TABLE kartu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_uid VARCHAR(50) UNIQUE NOT NULL,
    tipe_kartu VARCHAR(20) NOT NULL,
    santri_id INT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE SET NULL,
    CONSTRAINT chk_status_kartu CHECK (status IN ('aktif', 'hilang', 'nonaktif')),
    CONSTRAINT chk_tipe_kartu CHECK (tipe_kartu IN ('RFID', 'NFC', 'MagneticStripe'))
) ENGINE=InnoDB;

-- Create Transaksi Table
CREATE TABLE transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kartu_id INT NULL,
    santri_id INT NOT NULL,
    tipe_transaksi VARCHAR(20) NOT NULL,
    jumlah DECIMAL(12, 2) NOT NULL,
    saldo_sebelum DECIMAL(12, 2) NOT NULL,
    saldo_sesudah DECIMAL(12, 2) NOT NULL,
    keterangan TEXT NULL,
    operator VARCHAR(50) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kartu_id) REFERENCES kartu(id) ON DELETE SET NULL,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    CONSTRAINT chk_jumlah CHECK (jumlah > 0),
    CONSTRAINT chk_tipe_transaksi CHECK (tipe_transaksi IN ('topup', 'penarikan', 'pembayaran'))
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_santri_nis ON santri(nis);
CREATE INDEX idx_kartu_uid ON kartu(card_uid);
CREATE INDEX idx_transaksi_santri_id ON transaksi(santri_id);
CREATE INDEX idx_transaksi_created_at ON transaksi(created_at);

-- Seed data for testing and initial demonstration
INSERT INTO santri (nis, nama, kelas, saldo, status) VALUES
('SNT001', 'Ahmad Fauzi', '10-A / Tahfidz', 150000.00, 'aktif'),
('SNT002', 'Muhammad Rizky', '11-B / Kitab', 75000.00, 'aktif'),
('SNT003', 'Siti Aminah', '10-C / Banat', 250000.00, 'aktif');

INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES
('1234567890', 'RFID', 1, 'aktif'),
('0987654321', 'NFC', 2, 'aktif'),
('1122334455', 'MagneticStripe', 3, 'aktif');

INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) VALUES
(1, 1, 'topup', 150000.00, 0.00, 150000.00, 'Setoran awal saldo santri', 'Admin Utama'),
(2, 2, 'topup', 100000.00, 0.00, 100000.00, 'Setoran awal saldo santri', 'Admin Utama'),
(2, 2, 'pembayaran', 25000.00, 100000.00, 75000.00, 'Pembelian kitab kuning di koperasi', 'Kasir Koperasi'),
(3, 3, 'topup', 250000.00, 0.00, 250000.00, 'Top up bulanan wali santri', 'Admin Utama');
