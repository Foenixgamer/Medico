// =============================================================================
// MedSecure - Servidor Express
// Plataforma médica segura con cumplimiento HIPAA/GDPR
// =============================================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { config, validateConfig } = require('./config');
const { pool } = require('./config/database');
const { sanitizeInput } = require('./middleware/sanitize');
const { globalLimiter } = require('./middleware/rateLimit');
const { authenticate } = require('./middleware/auth');
const { logger } = require('./utils/logger');
const authRoutes = require('./auth/routes');
const patientRoutes = require('./patients/routes');
const recordRoutes = require('./records/routes');
const adminRoutes = require('./auth/adminRoutes');
const appointmentRoutes = require('./appointments/routes');
const usersRoutes = require('./users/routes');

// =============================================================================
// Validar configuración crítica ANTES de arrancar
// Capa 11: Gestión de Secretos
// =============================================================================
validateConfig();

const app = express();

// =============================================================================
// Capa 5: Seguridad en Comunicación
// =============================================================================
// Forzar HTTPS en producción
if (config.https.enabled) {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// =============================================================================
// Capa 3: WAF - Helmet con Content Security Policy
// =============================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'strict-dynamic'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.cors.whitelist[0]],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Deshabilitar X-Powered-By (Capa 5)
app.disable('x-powered-by');

// =============================================================================
// Capa 5: CORS estricto
// =============================================================================
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (apps nativas, postman, etc.)
      if (!origin) return callback(null, true);

      if (config.cors.whitelist.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('Origen CORS bloqueado', { origin });
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Confirm-Action', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Remaining'],
  })
);

// =============================================================================
// Middleware globales
// =============================================================================
app.use(compression());
app.use(cookieParser(config.sessionSecret));
app.use(express.json({ limit: '1mb' })); // Limitar tamaño del body
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitizar inputs (Capa 3)
app.use(sanitizeInput);

// Rate limiting global (Capa 3)
app.use(globalLimiter);

// =============================================================================
// Health check
// =============================================================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Base de datos no disponible',
    });
  }
});

// =============================================================================
// Rutas
// =============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', usersRoutes);

// =============================================================================
// Manejo centralizado de errores
// Nunca exponer stack traces al cliente
// =============================================================================
app.use((err, req, res, _next) => {
  // Error de CORS
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({
      error: 'Origen no permitido',
      code: 'CORS_BLOCKED',
    });
  }

  // Error de validación
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.details,
    });
  }

  logger.error('Error no manejado', {
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
});

// =============================================================================
// Iniciar servidor
// =============================================================================
async function start() {
  try {
    // Verificar conexión a BD
    const client = await pool.connect();
    logger.info('Conectado a PostgreSQL');
    client.release();

    app.listen(config.port, config.host, () => {
      logger.info(
        `MedSecure iniciado en ${config.host}:${config.port} [${config.env}]`
      );
    });
  } catch (err) {
    logger.error('Error al iniciar servidor', { error: err.message });
    process.exit(1);
  }
}

start();

module.exports = app;
