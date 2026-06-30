const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { getRedis }              = require('../_redis');
const { handleOptions, setCors } = require('../_auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const redis = getRedis();
    const key   = email.trim().toLowerCase();

    const existing = await redis.get(`email:${key}`);
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId       = crypto.randomUUID();

    const user = {
      id: userId,
      name: (name || '').trim(),
      email: key,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`user:${userId}`, JSON.stringify(user));
    await redis.set(`email:${key}`, userId);

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: { id: userId, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[signup]', err.message);
    return res.status(500).json({ error: 'Server error during sign-up' });
  }
};
