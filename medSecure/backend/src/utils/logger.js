// =============================================================================
// MedSecure - Sistema de logging
// Capa 12: Logging y Auditoría - Winston con rotación diaria
// =============================================================================
// Mitiga: Falta de trazabilidad en accesos y modificaciones
// Artículo HIPAA: 164.312(b) - Audit Controls
// Artículo GDPR: Artículo 30 - Registros de actividades de tratamiento
// =============================================================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');
const { config } = require('../config');

// Crear directorio de logs si no existe
const logDir = path.resolve(config.logging.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Nivel de auditoría personalizado
const AUDIT_LEVEL = 'audit';
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    [AUDIT_LEVEL]: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    verbose: 'magenta',
    debug: 'gray',
    [AUDIT_LEVEL]: 'blue',
  },
};

winston.addColors(customLevels.colors);

// Formato para auditoría (JSON plano para facilitar análisis)
const auditFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  transports: [
    // Archivo de logs generales con rotación diaria
    new DailyRotateFile({
      filename: path.join(logDir, 'medsecure-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: `${config.logging.retentionDays}d`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Archivo separado solo para auditoría (inmutable: solo append)
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: `${config.logging.retentionDays}d`,
      format: auditFormat,
      level: AUDIT_LEVEL,
    }),
    // Consola en desarrollo
    ...(config.env !== 'production'
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),
  ],
});

/**
 * Registra un evento de auditoría.
 * Los audit logs son inmutables (solo INSERT en la tabla correspondiente).
 * @param {Object} auditData - Datos del evento
 * @param {string} auditData.userId - ID del usuario
 * @param {string} auditData.action - Acción realizada (READ, UPDATE, DELETE, etc.)
 * @param {string} auditData.resourceId - ID del recurso accedido
 * @param {string} auditData.ip - Dirección IP
 * @param {string} auditData.userAgent - User agent del cliente
 */
function auditLog(auditData) {
  logger.log(AUDIT_LEVEL, 'Audit event', {
    ...auditData,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { logger, auditLog };
