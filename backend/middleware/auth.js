const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_secret_change_me';

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    const { User } = require('../models/index');
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    if (user.isBanned) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Нет доступа' });
    next();
  });
}

module.exports = { auth, adminAuth };
