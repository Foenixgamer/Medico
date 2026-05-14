// =============================================================================
// MedSecure - Cliente Redis
// Capa 9: Solo accesible desde backend-net (red interna)
// Uso: Blacklist de tokens, sesiones, caché, rate-limiting distribuido
// =============================================================================
// Mitiga: Almacenamiento en memoria de tokens revocados y sesiones activas
//          para invalidación instantánea
// =============================================================================

const Redis = require('ioredis');
const { config } = require('./index');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  if (config.env === 'development') {
    console.log('[Redis] Conectado');
  }
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

module.exports = { redis };
