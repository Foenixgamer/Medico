/**
 * PRUEBA 2: Acceso sin autenticación (JWT)
 * Intenta acceder a endpoints protegidos sin token
 */
const { request } = require('./00-lib');

const ENDPOINTS = [
  { method: 'GET',    path: '/api/users',            desc: 'Listar usuarios' },
  { method: 'GET',    path: '/api/patients',         desc: 'Listar pacientes' },
  { method: 'GET',    path: '/api/records',          desc: 'Listar expedientes' },
  { method: 'GET',    path: '/api/appointments',     desc: 'Listar citas' },
  { method: 'POST',   path: '/api/users',            desc: 'Crear usuario' },
  { method: 'GET',    path: '/api/me',               desc: 'Obtener perfil propio' },
  { method: 'POST',   path: '/api/auth/logout',      desc: 'Cerrar sesión' },
  { method: 'POST',   path: '/api/auth/change-password', desc: 'Cambiar contraseña' },
  { method: 'GET',    path: '/api/admin/dashboard',  desc: 'Dashboard admin' },
  { method: 'POST',   path: '/api/auth/mfa/setup',   desc: 'Configurar MFA' },
];

async function runNoAuthTests(baseURL) {
  let passed = 0, failed = 0;
  const failures = [];

  for (const ep of ENDPOINTS) {
    console.log(`  Probando ${ep.method} ${ep.path} (${ep.desc})`);
    try {
      const res = await request(ep.method, `${baseURL}${ep.path}`, {});
      const blocked = [401, 403, 400].includes(res.status);

      if (blocked) {
        console.log(`    ✓ BLOQUEADO (${res.status})`);
        passed++;
      } else if (res.status === 200 || res.status === 201) {
        console.log(`    ✗ EXPUESTO (${res.status}) — accesible sin autenticación`);
        failures.push(`${ep.method} ${ep.path}`);
        failed++;
      } else {
        console.log(`    ? (${res.status})`);
        passed++;
      }
    } catch (err) {
      console.log(`    ! ERROR: ${err.message}`);
      failed++;
    }
  }

  const summary = failed === 0
    ? `Pasó: todos los endpoints requieren autenticación (${passed} verificaciones)`
    : `Falló: ${failures.join(', ')} accesible(s) sin token`;
  return { passed: failed === 0, summary, passedTests: passed, failedTests: failed };
}

module.exports = { runNoAuthTests };
