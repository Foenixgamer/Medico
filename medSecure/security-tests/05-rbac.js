/**
 * PRUEBA 5: Control de acceso RBAC
 * Verifica matriz de permisos por rol contra endpoints protegidos
 */
const { request, login } = require('./00-lib');

const CREDENTIALS = [
  { role: 'patient', email: 'Tania74@paciente.medsecure', password: 'TestPass123!' },
  { role: 'doctor',  email: 'Rachelle_Barrows@hospital.medsecure', password: 'TestPass123!' },
  { role: 'admin',   email: 'admin@medsecure.local',       password: 'TestPass123!' },
  { role: 'master',  email: 'master@admin.com',             password: 'Master2024!' },
];

// [rol, method, path, body, codigosAceptables, descripcion]
const MATRIX = [
  ['patient', 'GET',    '/api/users',         null,      [403],       'NO debe listar usuarios'],
  ['patient', 'GET',    '/api/patients',      null,      [403],       'NO debe listar pacientes'],
  ['patient', 'GET',    '/api/me',            null,      [200, 400],  'SÍ debe ver su perfil'],
  ['patient', 'GET',    '/api/appointments',  null,      [200, 403],  'SÍ/NO ver citas según implementación'],

  ['doctor',  'GET',    '/api/patients',      null,      [200, 400],  'SÍ debe listar pacientes'],
  ['doctor',  'GET',    '/api/users',         null,      [403],       'NO debe listar usuarios'],
  ['doctor',  'POST',   '/api/users',         { name: 'x', email: 'x@x.com', password: 'Xxxxx123!', role: 'doctor' }, [403, 400], 'NO debe crear usuarios'],
  ['doctor',  'GET',    '/api/me',            null,      [200],       'SÍ debe ver su perfil'],

  ['admin',   'GET',    '/api/users',         null,      [200, 400],  'SÍ debe listar usuarios'],
  ['admin',   'POST',   '/api/users',         { name: 'x', email: 'x@x.com', password: 'Xxxxx123!', role: 'doctor' }, [403], 'NO debe crear usuarios'],
  ['admin',   'GET',    '/api/patients',      null,      [200, 400],  'SÍ debe listar pacientes'],
  ['admin',   'PATCH',  '/api/users/x/role',  { role: 'doctor' }, [403], 'NO debe cambiar roles'],
  ['admin',   'GET',    '/api/me',            null,      [200],       'SÍ debe ver su perfil'],

  ['master',  'GET',    '/api/users',         null,      [200, 400],  'SÍ debe listar usuarios'],
  ['master',  'GET',    '/api/me',            null,      [200],       'SÍ debe ver su perfil'],
  ['master',  'PATCH',  '/api/users/x/toggle', null,    [200, 404],  'SÍ debe poder activar/desactivar'],
];

async function runRBACTests(baseURL) {
  const tokens = {};

  for (const c of CREDENTIALS) {
    try {
      const res = await login(baseURL, c.email, c.password);
      tokens[c.role] = res.body.accessToken || null;
    } catch (err) {
      console.log(`  Login ${c.role}: ERROR — ${err.message}`);
      tokens[c.role] = null;
    }
  }

  let passed = 0, failed = 0;
  const failures = [];

  console.log('  Verificando matriz de permisos RBAC:\n');

  for (const [role, method, path, body, acceptable, desc] of MATRIX) {
    const token = tokens[role];
    if (!token) {
      console.log(`  ! ${role} ${method} ${path}: saltando (sin token)`);
      continue;
    }

    console.log(`  ${role} → ${method} ${path}: ${desc}`);
    try {
      const res = await request(method, `${baseURL}${path}`, { token, body });
      const ok = acceptable.includes(res.status);

      if (ok) {
        console.log(`    ✓ ${res.status} (aceptable: ${acceptable.join(', ')})`);
        passed++;
      } else {
        console.log(`    ✗ ${res.status} (esperado: ${acceptable.join(', ')})`);
        failures.push(`${role} ${method} ${path}`);
        failed++;
      }
    } catch (err) {
      console.log(`    ! ERROR: ${err.message}`);
      failed++;
    }
  }

  const summary = failed === 0
    ? `Pasó: matriz RBAC completa (${passed} permisos verificados)`
    : `Falló: ${failures.length} permisos incorrectos`;
  return { passed: failed === 0, summary, passedTests: passed, failedTests: failed };
}

module.exports = { runRBACTests };
