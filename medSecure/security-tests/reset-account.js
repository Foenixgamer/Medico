/**
 * Desbloquear cuenta bloqueada por fuerza bruta
 * Ejecuta: node reset-account.js <email>
 * Ejemplo: node reset-account.js master@admin.com
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432,
  user: 'medsecure_admin', password: 'Desarrollo2024$',
  database: 'medsecure',
});

const email = process.argv[2];
if (!email) {
  console.log('Uso: node reset-account.js <email>');
  console.log('Ejemplo: node reset-account.js master@admin.com');
  process.exit(1);
}

pool.query(
  'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = $1',
  [email]
).then(r => {
  if (r.rowCount > 0) {
    console.log(`✓ Cuenta "${email}" desbloqueada`);
  } else {
    console.log(`✗ No se encontró la cuenta "${email}"`);
  }
  pool.end();
}).catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
