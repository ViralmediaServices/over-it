const jwt = require('jsonwebtoken');

function requireAuth(req) {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) throw new Error('No token provided');
  const token = header.slice(7);
  return jwt.verify(token, process.env.JWT_SECRET);
}

function handleOptions(res) {
  res.status(204).end();
}

module.exports = { requireAuth, handleOptions };
