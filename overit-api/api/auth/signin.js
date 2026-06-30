const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getRedis }              = require('../_redis');
const { handleOptions, setCors } = require('../_auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const redis = getRedis();
    const key   = email.trim().toLowerCase();

    const userId = await redis.get(`email:${key}`);
    if (!userId) return res.status(401).json({ error: 'Invalid email or password' });

    const raw  = await redis.get(`user:${userId}`);
    if (!raw)  return res.status(401).json({ error: 'Invalid email or password' });

    const user  = JSON.parse(raw);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[signin]', err.message);
    return res.status(500).json({ error: 'Server error during sign-in' });
  }
};
