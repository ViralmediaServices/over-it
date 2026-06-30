const jwt = require('jsonwebtoken');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function requireAuth(req) {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) throw new Error('No token provided');
  const token = header.slice(7);
  return jwt.verify(token, process.env.JWT_SECRET);
}

function handleOptions(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(204).end();
}

function setCors(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = { requireAuth, handleOptions, setCors };
