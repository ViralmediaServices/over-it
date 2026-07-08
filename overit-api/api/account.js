const { getRedis }              = require('./_redis');
const { requireAuth, handleOptions, setCors } = require('./_auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  let user;
  try {
    user = requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const redis = getRedis();
    const userKey = `user:${user.userId}`;

    const raw = await redis.get(userKey);
    if (!raw) {
      return res.status(404).json({ error: 'Account not found' });
    }
    const { email } = JSON.parse(raw);

    await redis.del(
      userKey,
      `email:${email}`,
      `profile:${user.userId}`,
      `messages:${user.userId}`,
      `pushtoken:${user.userId}`
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[delete-account]', err.message);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
};
