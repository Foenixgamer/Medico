# MedSecure — Pruebas de Seguridad API

Suite de pruebas de seguridad automatizadas para la API de MedSecure.

## Requisitos

- Node.js 18+
- Backend de MedSecure corriendo en `http://localhost:4000`
- Datos seed cargados (usuarios de prueba)

## Ejecución

```bash
cd security-tests
node runner.js
```

O ejecutar una prueba individual:

```bash
node -e "require('./01-sql-injection').runSQLInjectionTests('http://localhost:4000').then(r => console.log(JSON.stringify(r, null, 2)))"
```

## Pruebas incluidas

| #  | Prueba                 | Descripción |
|----|------------------------|-------------|
| 01 | SQL Injection          | 7 payloads de inyección SQL contra login + verifica /register eliminado |
| 02 | Acceso sin JWT         | 10 endpoints protegidos sin token de autenticación |
| 03 | Escalación privilegios | Paciente/doctor intentan acciones de admin/master |
| 04 | Fuerza bruta           | 10+ intentos fallidos hasta account lockout |
| 05 | RBAC                   | Matriz de 16 permisos por rol contra endpoints |

## Automatización (CI/CD)

### GitHub Actions

```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: test }
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d backend --wait
      - run: node security-tests/runner.js
```

### Integración continua local

```bash
# Cada vez que haces cambios:
docker compose restart backend
node security-tests/runner.js
```

### npm scripts sugeridos (package.json)

```json
{
  "scripts": {
    "test:security": "node security-tests/runner.js",
    "test:security:sql": "node -e \"require('./security-tests/01-sql-injection').runSQLInjectionTests('http://localhost:4000').then(console.log)\"",
    "test:security:brute": "node -e \"require('./security-tests/04-brute-force').runBruteForceTests('http://localhost:4000').then(console.log)\"",
    "pretest:security": "docker compose restart backend"
  }
}
```

### Extender las pruebas

Agrega nuevos endpoints a los arrays en cada archivo:

- `01-sql-injection.js`: agrega payloads a `PAYLOADS`
- `02-no-auth.js`: agrega endpoints a `ENDPOINTS`
- `03-privilege-escalation.js`: agrega tests a `TESTS`
- `05-rbac.js`: agrega filas a `MATRIX`
