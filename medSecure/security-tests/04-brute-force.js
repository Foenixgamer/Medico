/**
 * PRUEBA 4: Fuerza bruta (account lockout)
 * Envía múltiples intentos de login fallidos hasta bloquear la cuenta
 */
const { request } = require('./00-lib');

async function runBruteForceTests(baseURL) {
  let passed = 0, failed = 0;
  const targetEmail = 'admin@medsecure.local';
  const MAX_ATTEMPTS = 10;

  console.log(`  Enviando ${MAX_ATTEMPTS} intentos fallidos para "${targetEmail}"...`);

  let lockedAt = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const res = await request('POST', `${baseURL}/api/auth/login`, {
        body: { email: targetEmail, password: `WrongPass${i}_${Date.now()}` },
      });

      const show = [0, 1, MAX_ATTEMPTS - 1].includes(i) || res.status === 423 || res.status === 429;
      if (show) {
        const errMsg = res.body?.error || res.body?.message || res.raw?.substring(0, 60) || '';
        console.log(`    #${i + 1}: ${res.status} — ${errMsg}`);
      }

      if (res.status === 423 || res.status === 429) {
        lockedAt = i + 1;
        console.log(`    🔒 BLOQUEADO en intento #${i + 1}`);
        break;
      }
    } catch (err) {
      if (lockedAt === null) {
        console.log(`    #${i + 1}: ERROR — ${err.message}`);
      }
    }
  }

  if (lockedAt) {
    console.log(`\n  ✓ Account lockout activado en intento #${lockedAt}/${MAX_ATTEMPTS}`);
    passed++;
  } else {
    console.log(`\n  ✗ No se bloqueó la cuenta después de ${MAX_ATTEMPTS} intentos`);
    failed++;
  }

  // Verificar que login correcto también falla mientras la cuenta esté bloqueada
  console.log(`\n  Verificando login correcto durante bloqueo:`);
  try {
    const res = await request('POST', `${baseURL}/api/auth/login`, {
      body: { email: targetEmail, password: 'TestPass123!' },
    });
    console.log(`    → ${res.status}: ${res.body?.error || res.body?.message || 'bloqueado'}`);
    if (res.status === 423 || res.status === 429) {
      console.log('    ✓ Cuenta permanece bloqueada');
    }
  } catch (err) {
    console.log(`    ! ${err.message}`);
  }

  const summary = lockedAt
    ? `Pasó: account lockout en intento #${lockedAt}`
    : 'Falló: no se detectó bloqueo por fuerza bruta';
  return { passed: failed === 0, summary, passedTests: passed, failedTests: failed };
}

module.exports = { runBruteForceTests };
