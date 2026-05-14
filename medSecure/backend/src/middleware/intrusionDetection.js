// =============================================================================
// MedSecure - Sistema de Detección de Intrusiones (IDS)
// Capa 13: Detección de accesos anómalos
// =============================================================================
// Mitiga: Acceso masivo a expedientes, robo de sesiones, fuerza bruta
// Artículo HIPAA: 164.312(b) - Audit Controls (detección de anomalías)
// =============================================================================

const { pool } = require('../config/database');
const { redis } = require('../config/redis');
const { config } = require('../config');
const { logger } = require('../utils/logger');

/**
 * Detecta si un usuario está accediendo a más expedientes de los permitidos
 * en la ventana de tiempo configurada.
 * Capa 13: Mass Access Detection
 */
async function detectMassAccess(userId, resourceId, ip) {
  try {
    const windowSeconds = config.intrusionDetection.timeWindowHours * 3600;
    const maxAccess = config.intrusionDetection.maxRecordsAccess;
    const redisKey = `mass_access:${userId}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;

    // Incrementar contador de accesos en la ventana de tiempo
    const accessCount = await redis.incr(redisKey);
    if (accessCount === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    // Si supera el umbral, registrar alerta
    if (accessCount > maxAccess) {
      // Crear evento de seguridad en BD
      await pool.query(
        `INSERT INTO security_events (event_type, severity, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [
          'mass_access',
          'high',
          userId,
          JSON.stringify({
            accessCount,
            maxAllowed: maxAccess,
            timeWindowHours: config.intrusionDetection.timeWindowHours,
            lastResourceId: resourceId,
            ip,
          }),
        ]
      );

      logger.warn('ALERTA: Acceso masivo a expedientes', {
        userId,
        accessCount,
        maxAllowed: maxAccess,
        ip,
      });
    }

    // Detección de token reuse (múltiples IPs misma sesión - simplificado)
    // Capa 13: Token Reuse Detection
    const tokenIpKey = `token_ip:${userId}`;
    const previousIp = await redis.get(tokenIpKey);
    if (previousIp && previousIp !== ip) {
      await pool.query(
        `INSERT INTO security_events (event_type, severity, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [
          'token_reuse',
          'medium',
          userId,
          JSON.stringify({
            previousIp,
            currentIp: ip,
            message: 'Misma sesión detectada desde IPs diferentes',
          }),
        ]
      );

      logger.warn('ALERTA: Token reuse detectado', {
        userId,
        previousIp,
        currentIp: ip,
      });
    }
    await redis.set(tokenIpKey, ip, 'EX', 3600);
  } catch (err) {
    // No interrumpir el flujo si falla la detección
    logger.error('Error en IDS detectMassAccess', { error: err.message });
  }
}

module.exports = { detectMassAccess };
