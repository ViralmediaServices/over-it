const Redis = require('ioredis');

let client;

function getRedis() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    client.on('error', err => console.error('[redis]', err.message));
  }
  return client;
}

module.exports = { getRedis };
