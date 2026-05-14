// =============================================================================
// MedSecure - Rate Limiting
// Capa 3: API Gateway + WAF
// =============================================================================
// Mitiga: Ataques de fuerza bruta, DoS, enumeración de usuarios
// =============================================================================

const rateLimit = require('express-rate-limit');
const { config } = require('../config');

// Límite global: 100 requests por 15 minutos por IP
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000) + 's',
  },
});

// Límite estricto para rutas de autenticación: 5 requests por minuto
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación. Intenta de nuevo en 1 minuto.',
    code: 'AUTH_RATE_LIMIT',
    retryAfter: '60s',
  },
  // Contar por IP + email (si está presente) para evitar bloquear a todos
  keyGenerator: (req) => {
    return `${req.ip}:${req.body?.email || 'anon'}`;
  },
});

// Límite para registro: 3 registros por hora por IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas cuentas creadas desde esta IP. Intenta más tarde.',
    code: 'SIGNUP_RATE_LIMIT',
  },
});

module.exports = { globalLimiter, authLimiter, signupLimiter };
