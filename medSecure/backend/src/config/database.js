// =============================================================================
// MedSecure - Configuración de base de datos PostgreSQL
// Capa 9: Solo accesible desde backend-net (red interna)
// =============================================================================
// Mitiga: Exposición directa de la BD a internet
// =============================================================================

const { Pool } = require('pg');
const { config } = require('./index');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  min: config.db.poolMin,
  max: config.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Eventos del pool para monitoreo
pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool:', err.message);
});

pool.on('connect', () => {
  if (config.env === 'development') {
    console.log('[DB] Nueva conexión establecida');
  }
});

module.exports = { pool };
