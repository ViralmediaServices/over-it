const { getRedis }              = require('./_redis');
const { requireAuth, handleOptions } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let user;
  try {
    user = requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });

  try {
    const redis = getRedis();
    await redis.set(`pushtoken:${user.userId}`, token);
    return res.json({ success: true });
  } catch (err) {
    console.error('[push-token]', err.message);
    return res.status(500).json({ error: 'Failed to save push token' });
  }
};
