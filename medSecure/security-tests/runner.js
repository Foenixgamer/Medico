/**
 * MedSecure — Suite de Pruebas de Seguridad API
 * Ejecuta: node runner.js
 * Requiere: API funcionando en localhost:4000
 */
const { runSQLInjectionTests } = require('./01-sql-injection');
const { runNoAuthTests } = require('./02-no-auth');
const { runPrivilegeEscalationTests } = require('./03-privilege-escalation');
const { runBruteForceTests } = require('./04-brute-force');
const { runRBACTests } = require('./05-rbac');

const API_BASE = 'http://localhost:4000';

async function main() {
  console.log('='.repeat(70));
  console.log('  MEDSECURE — PRUEBAS DE SEGURIDAD');
  console.log('  Target:', API_BASE);
  console.log('  Fecha:', new Date().toISOString());
  console.log('='.repeat(70));
  console.log();

  const results = [];

  const tests = [
    { name: '01 — SQL Injection', fn: () => runSQLInjectionTests(API_BASE) },
    { name: '02 — Acceso sin autenticación', fn: () => runNoAuthTests(API_BASE) },
    { name: '03 — Escalación de privilegios', fn: () => runPrivilegeEscalationTests(API_BASE) },
    { name: '04 — Fuerza bruta (account lockout)', fn: () => runBruteForceTests(API_BASE) },
    { name: '05 — Control de acceso RBAC', fn: () => runRBACTests(API_BASE) },
  ];

  for (const test of tests) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ▶ ${test.name}`);
    console.log(`${'─'.repeat(70)}`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, ...result });
    } catch (err) {
      console.error('  ERROR FATAL:', err.message);
      results.push({ name: test.name, passed: false, error: err.message });
    }
  }

  // Resumen final
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('  RESUMEN DE RESULTADOS');
  console.log(`${'='.repeat(70)}`);
  let totalPassed = 0, totalFailed = 0;
  for (const r of results) {
    const icon = r.passed === false ? '✗' : '✓';
    console.log(`  ${icon} ${r.name}: ${r.passed ? 'PASÓ' : 'FALLÓ'}${r.summary ? ' — ' + r.summary : ''}`);
    if (r.passed) totalPassed++; else totalFailed++;
  }
  console.log(`\n  Total: ${results.length} | Aprobadas: ${totalPassed} | Falladas: ${totalFailed}`);
  console.log(`${'='.repeat(70)}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
