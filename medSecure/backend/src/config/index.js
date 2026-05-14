// =============================================================================
// MedSecure - Configuración centralizada
// Capa 11: Gestión de Secretos - Validación al inicio
// =============================================================================
// Mitiga: Exposición de configuraciones, hardcoding de secretos,
// arranque del servidor con configuración inválida
// =============================================================================

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Variables críticas que deben existir para que el servidor arranque
const CRITICAL_VARS = [
  'DB_PASSWORD',
  'JWT_PRIVATE_KEY_B64',
  'JWT_PUBLIC_KEY_B64',
  'PHI_MASTER_KEY',
  'CSRF_SECRET',
  'SESSION_SECRET',
  'REDIS_HOST',
  'REDIS_PORT',
];

function validateConfig() {
  const missing = CRITICAL_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `[FATAL] Variables de entorno críticas faltantes: ${missing.join(', ')}`
    );
    console.error('[FATAL] Revisa el archivo .env o .env.example');
    process.exit(1);
  }

  // Validar que PHI_MASTER_KEY tenga el tamaño correcto (32 bytes = 64 hex chars)
  const phiKey = process.env.PHI_MASTER_KEY;
  if (!/^[0-9a-f]{64}$/i.test(phiKey)) {
    console.error(
      '[FATAL] PHI_MASTER_KEY debe ser 64 caracteres hex (32 bytes para AES-256)'
    );
    process.exit(1);
  }

  // Validar que BCRYPT_SALT_ROUNDS sea al menos 12
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  if (saltRounds < 12) {
    console.error('[FATAL] BCRYPT_SALT_ROUNDS debe ser al menos 12');
    process.exit(1);
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'medsecure',
    user: process.env.DB_USER || 'medsecure_admin',
    password: process.env.DB_PASSWORD,
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    privateKey: Buffer.from(process.env.JWT_PRIVATE_KEY_B64 || '', 'base64'),
    publicKey: Buffer.from(process.env.JWT_PUBLIC_KEY_B64 || '', 'base64'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'MedSecure',
    audience: process.env.JWT_AUDIENCE || 'MedSecure-API',
  },

  totp: {
    issuer: process.env.TOTP_ISSUER || 'MedSecure',
    encryptionKey: process.env.TOTP_ENCRYPTION_KEY,
  },

  phi: {
    masterKey: process.env.PHI_MASTER_KEY,
  },

  cors: {
    whitelist: (process.env.CORS_WHITELIST || 'http://localhost:5173').split(','),
  },

  csrf: {
    secret: process.env.CSRF_SECRET,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
  },

  lockout: {
    threshold: parseInt(process.env.LOCKOUT_THRESHOLD || '5', 10),
    durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),
  },

  intrusionDetection: {
    maxRecordsAccess: parseInt(process.env.ID_MAX_RECORDS_ACCESS || '50', 10),
    timeWindowHours: parseInt(process.env.ID_TIME_WINDOW_HOURS || '1', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
  },

  backup: {
    dir: process.env.BACKUP_DIR || './backups',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },

  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    certPath: process.env.HTTPS_CERT_PATH,
    keyPath: process.env.HTTPS_KEY_PATH,
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  sessionSecret: process.env.SESSION_SECRET,
};

module.exports = { config, validateConfig };
