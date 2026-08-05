const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'bank_pesantren',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Essential to execute schema.sql script
});

// Test connection, auto-create database & auto-migration
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully!');
    
    // Check if database tables exist. If empty, run schema.sql
    const [tables] = await connection.execute('SHOW TABLES');
    if (tables.length === 0) {
      console.log('💡 Database is empty. Loading schema migrations from schema.sql...');
      const schemaPath = path.join(__dirname, '../../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(sqlSchema);
        console.log('✅ Database schema initialized with default tables and seed records successfully!');
      } else {
        console.warn('⚠️ schema.sql not found at:', schemaPath);
      }
    }

    // Auto-create users table if it doesn't exist yet (safe for existing installs)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'Kasir',
        status VARCHAR(20) NOT NULL DEFAULT 'aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table ready.');

    // Seed default admin if empty
    const [userRows] = await connection.execute('SELECT COUNT(*) AS cnt FROM users');
    if (userRows[0].cnt === 0) {
      const bcrypt = require('bcryptjs');
      const defaultHash = await bcrypt.hash('pesantren2026', 12);
      await connection.execute(
        'INSERT INTO users (name, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        ['Administrator Utama', 'admin', defaultHash, 'Administrator', 'aktif']
      );
      console.log('✅ Default admin user "admin" seeded with password "pesantren2026".');
    }

    // Auto-migrate: Add deleted_at to santri table if not exists
    try {
      const [columns] = await connection.execute("SHOW COLUMNS FROM santri LIKE 'deleted_at'");
      if (columns.length === 0) {
        await connection.query("ALTER TABLE santri ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL");
        console.log('✅ Added deleted_at column to santri table.');
      }
    } catch (migErr) {
      console.error('❌ Failed to run deleted_at migration on santri:', migErr.message);
    }
    
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Database connection error:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Creating database "bank_pesantren" automatically...');
      try {
        const rootPool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          port: parseInt(process.env.DB_PORT || '3306')
        });
        await rootPool.query('CREATE DATABASE IF NOT EXISTS bank_pesantren');
        rootPool.end();
        console.log('✅ Database "bank_pesantren" created! Please restart server to load tables.');
      } catch (dbErr) {
        console.error('❌ Failed to auto-create database:', dbErr.message);
      }
    } else {
      console.log('💡 Please make sure MySQL is running in Laragon (click "Start All" in Laragon panel).');
    }
  }
})();

module.exports = {
  query: async (text, params) => {
    // Use pool.query (not pool.execute) so LIMIT ? OFFSET ? works with integers
    const [rows] = await pool.query(text, params);
    return { rows };
  },
  pool,
};
