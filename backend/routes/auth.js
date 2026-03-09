const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const https    = require('https');

const JWT_SECRET  = process.env.JWT_SECRET  || 'nexus_secret_change_me';
const BOT_TOKEN   = process.env.BOT_TOKEN   || process.env.TELEGRAM_BOT_TOKEN;

// ── In-memory code store (Redis в продакшене) ─────────────────────
// code → { telegramId, telegramUsername, firstName, createdAt }
const pendingCodes = new Map();

// Clean expired codes every minute
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingCodes) {
    if (now - data.createdAt > 10 * 60 * 1000) pendingCodes.delete(code); // 10min TTL
  }
}, 60_000);

// ── Send Telegram message ─────────────────────────────────────────
function sendTg(chatId, text) {
  return new Promise((resolve) => {
    if (!BOT_TOKEN) return resolve(false);
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req  = https.request({
      hostname: 'api.telegram.org',
      path:     `/bot${BOT_TOKEN}/sendMessage`,
      method:   'POST',
      headers:  { 'Content-Type':'application/json' },
    }, res => { res.resume(); res.on('end', () => resolve(true)); });
    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

// ── Generate 6-digit code ─────────────────────────────────────────
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── DB helper (lazy require to avoid circular) ────────────────────
function getDB() {
  return require('../models/index');
}

// ── POST /auth/bot-webhook — receives updates from Telegram bot ───
// Set webhook: https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://YOUR_DOMAIN/api/auth/bot-webhook
router.post('/bot-webhook', async (req, res) => {
  res.json({ ok: true }); // Always respond fast

  try {
    const update = req.body;
    const msg    = update.message;
    if (!msg) return;

    const chatId   = msg.chat.id;
    const text     = msg.text || '';
    const tgUser   = msg.from;

    if (text.startsWith('/start')) {
      const param = text.split(' ')[1] || '';

      if (param === 'reset') {
        // Password reset flow
        const code = genCode();
        pendingCodes.set(code, {
          telegramId:       String(chatId),
          telegramUsername: tgUser.username || null,
          firstName:        tgUser.first_name || 'User',
          createdAt:        Date.now(),
          purpose:          'reset',
        });
        await sendTg(chatId,
          `🔑 <b>NEXUS MARKET — Восстановление пароля</b>\n\n` +
          `Твой код для сброса пароля:\n\n` +
          `<code><b>${code}</b></code>\n\n` +
          `⏱ Код действует <b>10 минут</b>\n` +
          `⚠️ Никому не сообщай этот код!`
        );
      } else {
        // Auth / register flow
        const code = genCode();
        pendingCodes.set(code, {
          telegramId:       String(chatId),
          telegramUsername: tgUser.username || null,
          firstName:        tgUser.first_name || 'User',
          createdAt:        Date.now(),
          purpose:          'auth',
        });
        await sendTg(chatId,
          `⚡ <b>NEXUS MARKET — Добро пожаловать!</b>\n\n` +
          `Твой код для входа/регистрации:\n\n` +
          `<code><b>${code}</b></code>\n\n` +
          `⏱ Код действует <b>10 минут</b>\n` +
          `⚠️ Никому не сообщай этот код!\n\n` +
          `Введи код на сайте чтобы продолжить.`
        );
      }
    }
  } catch (e) {
    console.error('Bot webhook error:', e.message);
  }
});

// ── POST /auth/verify-code — check code, return if user exists ────
router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.length !== 6) return res.status(400).json({ error: 'Неверный код' });

    const data = pendingCodes.get(code);
    if (!data) return res.status(400).json({ error: 'Код не найден или истёк. Запросите новый в боте' });
    if (Date.now() - data.createdAt > 10*60*1000) {
      pendingCodes.delete(code);
      return res.status(400).json({ error: 'Код истёк. Запросите новый в боте' });
    }

    const { User } = getDB();
    const user = await User.findOne({ where: { telegramId: data.telegramId } });

    if (user && data.purpose === 'auth') {
      // Existing user — issue token (login)
      pendingCodes.delete(code);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ exists: true, token, user: sanitize(user) });
    }

    // New user or registration
    res.json({ exists: false, telegramId: data.telegramId, firstName: data.firstName, telegramUsername: data.telegramUsername });
  } catch (e) {
    console.error('verify-code error:', e.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── POST /auth/register — complete registration ───────────────────
router.post('/register', async (req, res) => {
  try {
    const { code, username, email, password } = req.body;
    if (!code || !username?.trim() || !password) return res.status(400).json({ error: 'Заполните все поля' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

    const data = pendingCodes.get(code);
    if (!data) return res.status(400).json({ error: 'Код не найден или истёк' });

    const { User, sequelize } = getDB();

    // Check username uniqueness
    const exists = await User.findOne({ where: { username: username.trim().toLowerCase() } });
    if (exists) return res.status(400).json({ error: 'Имя пользователя уже занято' });

    if (email) {
      const emailExists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (emailExists) return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    await sequelize.query(
      `INSERT INTO "Users" (id, "telegramId", username, "firstName", email, password, balance, "frozenBalance", "isAdmin", "isBanned", "isVerified", "createdAt", "updatedAt")
       VALUES (:id, :telegramId, :username, :firstName, :email, :password, 0, 0, false, false, false, NOW(), NOW())`,
      { replacements: {
        id:         userId,
        telegramId: data.telegramId,
        username:   username.trim().toLowerCase(),
        firstName:  data.firstName || username.trim(),
        email:      email?.trim().toLowerCase() || null,
        password:   hash,
      }}
    );

    pendingCodes.delete(code);

    const user  = await User.findByPk(userId);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    // Welcome message
    await sendTg(data.telegramId,
      `🎉 <b>Добро пожаловать в NEXUS MARKET, ${user.firstName}!</b>\n\n` +
      `✅ Аккаунт успешно создан\n` +
      `👤 Username: @${user.username}\n\n` +
      `Ты будешь получать все уведомления здесь — в этом чате.`
    );

    res.status(201).json({ token, user: sanitize(user) });
  } catch (e) {
    console.error('register error:', e.message);
    res.status(500).json({ error: 'Ошибка регистрации: ' + e.message });
  }
});

// ── POST /auth/reset-password ─────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code || !password || password.length < 6) return res.status(400).json({ error: 'Неверные данные' });

    const data = pendingCodes.get(code);
    if (!data || data.purpose !== 'reset') return res.status(400).json({ error: 'Код не найден или истёк' });

    const { User } = getDB();
    const user = await User.findOne({ where: { telegramId: data.telegramId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const hash = await bcrypt.hash(password, 12);
    await user.update({ password: hash });
    pendingCodes.delete(code);

    await sendTg(data.telegramId, `✅ <b>Пароль успешно изменён</b>\n\nЕсли это были не вы — немедленно обратитесь в поддержку.`);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const { User } = getDB();
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ error: 'Не авторизован' });
    res.json({ user: sanitize(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function sanitize(u) {
  return {
    id:         u.id,
    username:   u.username,
    firstName:  u.firstName,
    telegramId: u.telegramId,
    email:      u.email,
    balance:    parseFloat(u.balance) || 0,
    frozenBalance: parseFloat(u.frozenBalance) || 0,
    isAdmin:    u.isAdmin || false,
    isVerified: u.isVerified || false,
    rating:     parseFloat(u.rating) || 5.0,
    reviewCount:u.reviewCount || 0,
    createdAt:  u.createdAt,
    avatarUrl:  u.avatarUrl || null,
  };
}

module.exports = router;
module.exports.sendTg = sendTg;
