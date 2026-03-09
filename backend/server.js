const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin:'*', credentials:true }));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// ── Health ────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status:'ok', ts: new Date() }));

// ── Serve frontend ────────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

// ── DB init & start ───────────────────────────────────────────────
async function init() {
  const { sequelize } = require('./models/index');
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Create tables
    const q = sql => sequelize.query(sql, { raw:true }).catch(e => console.warn('Migration:', e.message));
    await q(`CREATE TABLE IF NOT EXISTS "Users" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "telegramId" VARCHAR(50) UNIQUE,
      username VARCHAR(50) UNIQUE,
      "firstName" VARCHAR(100),
      "lastName" VARCHAR(100),
      email VARCHAR(200) UNIQUE,
      password VARCHAR(200),
      "avatarUrl" TEXT,
      balance DECIMAL(12,2) DEFAULT 0,
      "frozenBalance" DECIMAL(12,2) DEFAULT 0,
      "totalDeposited" DECIMAL(12,2) DEFAULT 0,
      "totalWithdrawn" DECIMAL(12,2) DEFAULT 0,
      "totalSales" INTEGER DEFAULT 0,
      "totalPurchases" INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 5.0,
      "reviewCount" INTEGER DEFAULT 0,
      "isAdmin" BOOLEAN DEFAULT false,
      "isSubAdmin" BOOLEAN DEFAULT false,
      "isBanned" BOOLEAN DEFAULT false,
      "banUntil" TIMESTAMPTZ,
      "banReason" VARCHAR(500),
      "isVerified" BOOLEAN DEFAULT false,
      "lastActive" TIMESTAMPTZ,
      "referralCode" VARCHAR(20) UNIQUE,
      "referredBy" UUID,
      "referralEarnings" DECIMAL(12,2) DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )`);

    console.log('✅ Tables ready');
  } catch (e) {
    console.error('❌ DB error:', e.message);
  }

  app.listen(PORT, () => console.log(`🚀 NEXUS MARKET running on :${PORT}`));
}

init();
