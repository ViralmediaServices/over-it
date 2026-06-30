const { getRedis }              = require('./_redis');
const { requireAuth, handleOptions, setCors } = require('./_auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);

  let user;
  try {
    user = requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = getRedis();
  const mKey  = `messages:${user.userId}`;

  if (req.method === 'GET') {
    try {
      const raw = await redis.get(mKey);
      return res.json({ messages: raw ? JSON.parse(raw) : [] });
    } catch (err) {
      console.error('[get-messages]', err.message);
      return res.json({ messages: [] });
    }
  }

  if (req.method === 'PUT') {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }
    try {
      await redis.set(mKey, JSON.stringify(messages));
      return res.json({ success: true });
    } catch (err) {
      console.error('[put-messages]', err.message);
      return res.status(500).json({ error: 'Failed to save messages' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await redis.del(mKey);
      return res.json({ success: true });
    } catch (err) {
      console.error('[delete-messages]', err.message);
      return res.status(500).json({ error: 'Failed to clear messages' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
