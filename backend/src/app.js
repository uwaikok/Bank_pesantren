const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const santriRoutes = require('./routes/santri.routes');
const kartuRoutes = require('./routes/kartu.routes');
const transaksiRoutes = require('./routes/transaksi.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/santri', santriRoutes);
app.use('/api/kartu', kartuRoutes);
app.use('/api/transaksi', transaksiRoutes);

// Health Check and DB Migration Trigger
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      time: dbCheck.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = app;
