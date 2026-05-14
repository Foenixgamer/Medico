// =============================================================================
// MedSecure - Middleware de autenticación JWT
// Capa 2: Gestión de Sesiones - Access tokens con RS256
// =============================================================================
// Mitiga: Suplantación de identidad, acceso no autorizado
// =============================================================================

const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { redis } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * Middleware de autenticación.
 * Verifica el access token JWT del header Authorization.
 * El token debe estar firmado con RS256 y no estar en la blacklist.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar si el token está en la blacklist (logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      logger.warn('Token revocado usado', { ip: req.ip });
      return res.status(401).json({
        error: 'Token revocado',
        code: 'TOKEN_REVOKED',
      });
    }

    // Verificar y decodificar el token JWT con RS256
    const decoded = jwt.verify(token, config.jwt.publicKey, {
      algorithms: ['RS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    // Adjuntar información del usuario a la request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      patientToken: decoded.patientToken,
    };
    req.token = token;
    req.tokenJti = decoded.jti;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'TOKEN_INVALID',
      });
    }

    logger.error('Error de autenticación', { error: err.message, ip: req.ip });
    return res.status(500).json({
      error: 'Error de autenticación',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Middleware opcional de autenticación.
 * Si hay token, lo valida; si no, continúa sin usuario.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.publicKey, {
      algorithms: ['RS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      ignoreExpiration: false,
    });

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      patientToken: decoded.patientToken,
    };
  } catch (_) {
    // Token inválido, continuar sin usuario
  }

  next();
}

module.exports = { authenticate, optionalAuth };
