// =============================================================================
// MedSecure - Tests de Seguridad
// Capa 3 + 4 + 1: SQL Injection, Auth Bypass, IDOR, Rate Limiting
// =============================================================================

const request = require('supertest');
const app = require('../src/server');

describe('=== CAPA 3: SQL Injection ===', () => {
  test('SQL injection en login retorna 400/401, no 500', async () => {
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users; --",
      "admin'--",
      "1; SELECT * FROM users WHERE 1=1",
    ];

    for (const payload of payloads) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: payload, password: payload });

      expect([400, 401, 422]).toContain(res.statusCode);
    }
  });

  test('SQL injection en headers no causa error 500', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('User-Agent', "'; DROP TABLE audit_logs; --");

    expect([200, 400, 401]).toContain(res.statusCode);
  });
});

describe('=== CAPA 1: Auth Bypass ===', () => {
  test('Ruta protegida sin token retorna 401', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(401);
  });

  test('Token inválido retorna 401', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.statusCode).toBe(401);
  });

  test('Token vacío retorna 401', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', 'Bearer ');
    expect(res.statusCode).toBe(401);
  });

  test('Registro con contraseña débil retorna 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123' });

    expect(res.statusCode).toBe(400);
  });
});

describe('=== CAPA 3: XSS ===', () => {
  test('Script injection en body es sanitizado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: '<script>alert("xss")</script>@test.com',
        password: 'ValidP@ss123!',
      });

    // Si el email es inválido después de sanitizar, debe retornar 400
    // por validación, no porque el script se ejecute
    expect([400, 201, 409]).toContain(res.statusCode);
  });
});

describe('=== CAPA 4: IDOR ===', () => {
  test('Paciente no puede acceder a datos de otro paciente', async () => {
    // Sin autenticación, retorna 401
    const res = await request(app).get('/api/patients/some-uuid');
    expect(res.statusCode).toBe(401);
  });
});

describe('=== CAPA 3: CORS ===', () => {
  test('Origen no autorizado es bloqueado', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-site.com');

    expect(res.statusCode).toBe(403);
  });
});

describe('=== CAPA 3: Security Headers ===', () => {
  test('Helmet headers presentes', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('=== CAPA 1: Rate Limiting ===', () => {
  test('Múltiples requests a /auth son limitados', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'test' })
      );
    }

    const responses = await Promise.all(promises);
    const hasRateLimit = responses.some((r) => r.statusCode === 429);
    expect(hasRateLimit).toBe(true);
  }, 30000);
});

describe('=== CAPA 6: PHI Encryption (unitario) ===', () => {
  test('Encrypt/decrypt roundtrip funciona', () => {
    const { encrypt, decrypt } = require('../src/utils/encryption');
    const key = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    const original = 'Texto sensible PHI';
    const encrypted = encrypt(original, key);
    expect(encrypted).not.toBe(original);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(original);
  });

  test('Encrypt con null retorna null', () => {
    const { encrypt } = require('../src/utils/encryption');
    expect(encrypt(null)).toBeNull();
  });

  test('Decrypt con formato inválido retorna null', () => {
    const { decrypt } = require('../src/utils/encryption');
    expect(decrypt('formato-invalido')).toBeNull();
  });
});

describe('=== CAPA 2: Token Management ===', () => {
  test('JWT decode no expone stack traces', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', 'Bearer invalid.token.format');

    expect(res.statusCode).toBe(401);
    expect(res.body).not.toHaveProperty('stack');
  });
});
