-- ============================================================
-- Migration: Tambah tabel users untuk manajemen akun pengurus
-- Jalankan script ini sekali di database bank_pesantren
-- ============================================================

-- Buat tabel users jika belum ada
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Kasir',
    status VARCHAR(20) NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_status CHECK (status IN ('aktif', 'nonaktif')),
    CONSTRAINT chk_user_role CHECK (role IN ('Administrator', 'Pengurus Koperasi', 'Kasir'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index untuk cepat lookup berdasarkan username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
