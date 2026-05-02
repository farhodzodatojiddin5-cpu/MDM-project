/**
 * MDM Console — Node.js + Express + MongoDB Backend
 * Project UAS: Mobile Device Management System
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const deviceRoutes  = require('./routes/devices');
const policyRoutes  = require('./routes/policies');
const appRoutes     = require('./routes/apps');
const remoteRoutes  = require('./routes/remote');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mdm_console')
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => { console.error('❌  DB error:', err); process.exit(1); });

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/policies',policyRoutes);
app.use('/api/apps',    appRoutes);
app.use('/api/remote',  remoteRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  MDM API running → http://localhost:${PORT}`));
