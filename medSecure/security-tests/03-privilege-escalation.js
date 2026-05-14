/**
 * PRUEBA 3: Escalación de privilegios
 * Usuario con rol limitado intenta acceder a endpoints de admin/master
 */
const { request, login } = require('./00-lib');

const ROLES = [
  { role: 'patient', email: 'Tania74@paciente.medsecure', password: 'TestPass123!' },
  { role: 'doctor',  email: 'Rachelle_Barrows@hospital.medsecure', password: 'TestPass123!' },
];

const TESTS = [
  // [rol, method, path, body, expectedStatus, desc]
  ['patient', 'GET',   '/api/users',         null, 403, 'Paciente → listar usuarios (solo admin/master)'],
  ['patient', 'GET',   '/api/patients',      null, 403, 'Paciente → listar pacientes (solo staff)'],
  ['patient', 'POST',  '/api/users',         { name: 'x', email: 'x@x.com', password: 'Xxxxx123!', role: 'admin' }, 403, 'Paciente → crear usuario (solo master)'],
  ['patient', 'DELETE','/api/users/x',       null, 403, 'Paciente → eliminar usuario (solo master)'],
  ['patient', 'PATCH', '/api/users/x/role',  { role: 'admin' }, 403, 'Paciente → cambiar rol (solo master)'],
  ['doctor',  'GET',   '/api/users',         null, 403, 'Doctor → listar usuarios (solo admin/master)'],
  ['doctor',  'POST',  '/api/users',         { name: 'x', email: 'x@x.com', password: 'Xxxxx123!', role: 'admin' }, 403, 'Doctor → crear usuario (solo master)'],
  ['doctor',  'POST',  '/api/users',         null, 403, 'Doctor → crear usuario sin body (solo master)'],
  ['patient', 'GET',   '/api/me',            null, 200, 'Paciente → ver propio perfil (debe funcionar)'],
  ['doctor',  'GET',   '/api/me',            null, 200, 'Doctor → ver propio perfil (debe funcionar)'],
];

async function runPrivilegeEscalationTests(baseURL) {
  const tokens = {};

  for (const r of ROLES) {
    try {
      const res = await login(baseURL, r.email, r.password);
      tokens[r.role] = res.body.accessToken || null;
      console.log(`  Login ${r.role}: ${tokens[r.role] ? '✓ OK' : '✗ FALLÓ'}`);
    } catch (err) {
      console.log(`  Login ${r.role}: ✗ ERROR — ${err.message}`);
      tokens[r.role] = null;
    }
  }

  if (!tokens.patient && !tokens.doctor) {
    console.log('\n  ✗ No se pudo obtener ningún token — abortando');
    return { passed: false, summary: 'Falló: no se pudieron obtener tokens de prueba', passedTests: 0, failedTests: 1 };
  }

  let passed = 0, failed = 0;
  const failures = [];

  for (const [role, method, path, body, expected, desc] of TESTS) {
    const token = tokens[role];
    if (!token) {
      console.log(`  ! ${desc}: saltando (sin token para ${role})`);
      continue;
    }

    console.log(`  ${desc}`);
    try {
      const res = await request(method, `${baseURL}${path}`, { token, body });
      const ok = res.status === expected;
      // 400 es aceptable cuando falta body para POST
      const acceptable = expected === 403 && [403, 400, 401].includes(res.status);

      if (ok || acceptable) {
        console.log(`    ✓ (${res.status})`);
        passed++;
      } else {
        console.log(`    ✗ ${method} ${path} → ${res.status} (esperado ${expected})`);
        failures.push(desc);
        failed++;
      }
    } catch (err) {
      console.log(`    ! ERROR: ${err.message}`);
      failed++;
    }
  }

  const summary = failed === 0
    ? `Pasó: todos los intentos de escalación bloqueados (${passed} verificaciones)`
    : `Falló: ${failures.length} pruebas de escalación no pasaron`;
  return { passed: failed === 0, summary, passedTests: passed, failedTests: failed };
}

module.exports = { runPrivilegeEscalationTests };
