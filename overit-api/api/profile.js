const { getRedis }              = require('./_redis');
const { requireAuth, handleOptions } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(res);

  let user;
  try {
    user = requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = getRedis();
  const pKey  = `profile:${user.userId}`;

  if (req.method === 'GET') {
    try {
      const raw = await redis.get(pKey);
      if (!raw) return res.json({ profile: {}, questionnaireComplete: false });
      const { data, questionnaireComplete } = JSON.parse(raw);
      return res.json({ profile: data || {}, questionnaireComplete: !!questionnaireComplete });
    } catch (err) {
      console.error('[get-profile]', err.message);
      return res.json({ profile: {}, questionnaireComplete: false });
    }
  }

  if (req.method === 'PUT') {
    const { profile, questionnaireComplete } = req.body || {};
    try {
      const existing = await redis.get(pKey);
      const current  = existing ? JSON.parse(existing) : {};
      const updated = {
        ...current,
        data:      profile ?? current.data ?? {},
        updatedAt: new Date().toISOString(),
      };
      if (typeof questionnaireComplete === 'boolean') {
        updated.questionnaireComplete = questionnaireComplete;
      }
      await redis.set(pKey, JSON.stringify(updated));
      return res.json({ success: true });
    } catch (err) {
      console.error('[put-profile]', err.message);
      return res.status(500).json({ error: 'Failed to save profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
