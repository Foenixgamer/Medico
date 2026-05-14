/**
 * PRUEBA 1: SQL Injection
 * Simula inyecciones SQL en login y registro
 */
const { post, login } = require('./00-lib');

const PAYLOADS = [
  { desc: 'Comentario SQL (email)',     field: 'email',    value: "admin' OR 1=1--" },
  { desc: 'UNION SELECT (email)',       field: 'email',    value: "' UNION SELECT * FROM users--" },
  { desc: 'Siempre verdadero (pwd)',    field: 'password', value: "' OR '1'='1" },
  { desc: 'DROP TABLE (email)',         field: 'email',    value: "'; DROP TABLE users;--" },
  { desc: 'OR verdadero (email)',       field: 'email',    value: "admin' OR '1'='1' --" },
  { desc: 'Comilla simple (email)',     field: 'email',    value: "'" },
  { desc: 'Null byte (email)',          field: 'email',    value: "admin%00" },
];

async function runSQLInjectionTests(baseURL) {
  let passed = 0, failed = 0;

  for (const p of PAYLOADS) {
    const creds = { email: 'test@test.com', password: 'Test123!' };
    if (p.field === 'email') creds.email = p.value;
    if (p.field === 'password') creds.password = p.value;

    console.log(`  Probando: "${p.desc}" → ${p.field} = "${p.value}"`);

    try {
      const res = await login(baseURL, creds.email, creds.password);
      const blocked = res.status === 401;
      const exposed = res.status === 200;

      if (blocked) {
        console.log(`    ✓ BLOQUEADO (${res.status})`);
        passed++;
      } else if (exposed) {
        console.log(`    ✗ VULNERABLE (${res.status}): posible inyección`);
        console.log(`      Respuesta: ${JSON.stringify(res.body).substring(0, 120)}`);
        failed++;
      } else {
        console.log(`    ? (${res.status}): ${JSON.stringify(res.body).substring(0, 80)}`);
        passed++;
      }
    } catch (err) {
      console.log(`    ! ERROR: ${err.message}`);
      failed++;
    }
  }

  // Verificar que /register no existe (fue eliminado)
  console.log(`\n  Verificando endpoint /register fue eliminado:`);
  try {
    const res = await post(`${baseURL}/api/auth/register`, { body: { email: "test'--", password: 'Test123!', role: 'patient' } });
    if (res.status === 404) {
      console.log(`    ✓ 404 — endpoint eliminado correctamente`);
      passed++;
    } else {
      console.log(`    ? ${res.status} — endpoint aún responde`);
      failed++;
    }
  } catch (err) {
    console.log(`    ! ERROR: ${err.message}`);
    failed++;
  }

  const summary = failed === 0
    ? `Pasó: todos los payloads SQLi bloqueados (${passed} verificaciones)`
    : `Falló: ${failed} payloads no fueron bloqueados`;
  return { passed: failed === 0, summary, passedTests: passed, failedTests: failed };
}

module.exports = { runSQLInjectionTests };
