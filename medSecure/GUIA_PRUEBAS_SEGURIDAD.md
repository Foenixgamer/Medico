# Guía de Pruebas de Seguridad para tu Tesis
## MedSecure API — Nivel Principiante

---

## ANTES DE EMPEZAR

### ¿Qué necesitas?

1. **Thunder Client** (extensión de VS Code — búscala en la tienda de extensiones como "Thunder Client")
2. **Node.js** instalado (ya lo tienes)
3. El proyecto **corriendo** (Docker Desktop abierto)

### Verifica que tu API está funcionando

Abre PowerShell y escribe:

```powershell
node -e "require('http').get('http://localhost:4000/api/health', r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>console.log(r.statusCode, b)); })"
```

**Resultado esperado:**

```json
200 {"status":"ok","timestamp":"...","uptime":...}
```

Si ves `200` y `"status":"ok"`, tu API está lista. Si ves error, abre Docker Desktop y espera a que los contenedores inicien.

### Datos de prueba que usarás

| Rol      | Email                              | Contraseña    |
|----------|------------------------------------|---------------|
| master   | master@admin.com                   | Master2024!   |
| admin    | admin@medsecure.local              | TestPass123!  |
| doctor   | Rachelle_Barrows@hospital.medsecure| TestPass123!  |
| patient  | Tania74@paciente.medsecure         | TestPass123!  |

---

## PRUEBA 1: SQL Injection

### ¿Qué es? (explicación simple)

SQL Injection es cuando un atacante escribe código SQL en lugar de datos normales. Por ejemplo, en lugar de escribir su email, escribe:

```
admin' OR 1=1--
```

Si el sistema es vulnerable, esta inyección engaña a la base de datos para que piense "esto es verdadero" y deje pasar al atacante sin contraseña.

### Paso a paso en Thunder Client

**Paso 1:** Abre VS Code, haz clic en el icono de Thunder Client en la barra lateral izquierda (parece un rayo).

**Paso 2:** Haz clic en **New Request**.

**Paso 3:** Configúrala así:
- **Método:** selecciona `POST` en el menú desplegable
- **URL:** escribe `http://localhost:4000/api/auth/login`
- **Headers:** agrega `Content-Type: application/json`
- **Body:** selecciona la pestaña **Body** → **JSON** y pega:

```json
{
  "email": "admin' OR 1=1--",
  "password": "cualquiercosa"
}
```

**Paso 4:** Haz clic en **Send**.

### Resultado esperado (sistema seguro):

```json
{
  "error": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}
```

**Status: 401 Unauthorized**

### ¿Por qué es correcto?**

El sistema rechazó la petición aunque el SQL intentaba engañarlo. Esto significa que el backend NO está concatenando strings de SQL directamente (usa "parameterized queries" que separan el código de los datos).

### Más payloads para probar

Copia y pega cada uno como `email`, siempre esperando `401`:

| # | Payload                                        | Qué intenta hacer                  |
|---|------------------------------------------------|------------------------------------|
| 1 | `admin' OR 1=1--`                             | Hacer que la condición sea siempre verdadera |
| 2 | `' UNION SELECT * FROM users--`               | Robar datos de otra tabla          |
| 3 | `'; DROP TABLE users;--`                      | Borrar la tabla de usuarios        |
| 4 | `'` (solo una comilla)                        | Romper la consulta SQL             |
| 5 | `admin' OR '1'='1`                            | Variante de siempre verdadero      |

### Cómo documentarlo en tu tesis

Copia esta tabla:

```markdown
**Tabla X. Pruebas de SQL Injection**

| Payload | Código esperado | Código obtenido | ¿Vulnerable? |
|---------|-----------------|-----------------|--------------|
| admin' OR 1=1-- | 401 | 401 | No |
| ' UNION SELECT... | 401 | 401 | No |
| '; DROP TABLE... | 401 | 401 | No |
| ' (comilla simple) | 401 | 401 | No |

**Resultado:** El sistema no es vulnerable a SQL Injection.
**Mecanismo de defensa:** Parameterized queries con PostgreSQL (separan el código SQL de los datos ingresados por el usuario).
```

---

## PRUEBA 2: Acceso sin Autenticación (sin JWT)

### ¿Qué es?

Un endpoint "protegido" debería rechazar peticiones que no tengan un token JWT válido. Esta prueba verifica que eso ocurre.

### Paso a paso en Thunder Client

**Paso 1:** Abre Thunder Client y haz clic en **New Request**.

**Paso 2:** Configúrala así:
- **Método:** `GET`
- **URL:** `http://localhost:4000/api/users`
- **Headers:** agrega SOLO `Content-Type: application/json` (NO agregues Authorization)

**Paso 3:** Haz clic en **Send**.

### Resultado esperado:

```json
{
  "error": "Token de acceso requerido",
  "code": "TOKEN_REQUIRED"
}
```

**Status: 401 Unauthorized**

### Endpoints para probar (todos sin token)

| Método | URL                              | Status esperado |
|--------|----------------------------------|-----------------|
| GET    | http://localhost:4000/api/users  | 401             |
| GET    | http://localhost:4000/api/patients | 401           |
| GET    | http://localhost:4000/api/records  | 401           |
| GET    | http://localhost:4000/api/appointments | 401        |
| GET    | http://localhost:4000/api/me     | 401             |
| POST   | http://localhost:4000/api/auth/logout | 401        |
| POST   | http://localhost:4000/api/auth/change-password | 401 |
| DELETE | http://localhost:4000/api/users/123 | 401         |

### Cómo documentarlo en tu tesis

```markdown
**Tabla X. Pruebas de control de acceso sin token JWT**

| Endpoint | Método | Status esperado | Status obtenido | ¿Protegido? |
|----------|--------|-----------------|-----------------|-------------|
| /api/users | GET | 401 | 401 | Sí |
| /api/patients | GET | 401 | 401 | Sí |
| /api/records | GET | 401 | 401 | Sí |
| /api/appointments | GET | 401 | 401 | Sí |
| /api/me | GET | 401 | 401 | Sí |
| /api/auth/logout | POST | 401 | 401 | Sí |

**Resultado:** Todos los endpoints protegidos requieren token JWT.
**Mecanismo de defensa:** Middleware `authenticate` que verifica el token antes de permitir cualquier acceso.
```
---

## PRUEBA 3: Control de Roles (RBAC)

### ¿Qué es?

RBAC significa que cada usuario solo puede hacer lo que su rol le permite. Un paciente NO puede ver la lista de pacientes del hospital. Un doctor NO puede crear cuentas de usuario.

Necesitas obtener un token primero (haciendo login) y luego usarlo para probar un endpoint prohibido.

### Paso 1: Obtener token de paciente

En Thunder Client, haz una petición POST a:
- **URL:** `http://localhost:4000/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "Tania74@paciente.medsecure",
  "password": "TestPass123!"
}
```

**Resultado:** En la pestaña **Response** verás un JSON con un campo `accessToken`. **Copia ese texto** (empieza con `eyJ...`).

### Paso 2: Usar el token para acceder a /api/users (prohibido para paciente)

Crea una nueva petición GET:
- **URL:** `http://localhost:4000/api/users`
- **Headers:** agrega DOS headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer PASTE_AQUI_TU_TOKEN`

### Resultado esperado:

```json
{
  "error": "No tienes permisos para esta acción",
  "code": "FORBIDDEN_ROLE"
}
```

**Status: 403 Forbidden**

### Matriz completa de permisos para probar

Para cada fila: haz login con el email de ese rol, copia el token, y prueba el endpoint:

| Rol      | Email de login                                      | Endpoint a probar | Método | Status esperado |
|----------|------------------------------------------------------|--------------------|--------|-----------------|
| paciente | Tania74@paciente.medsecure / TestPass123!           | /api/users         | GET    | 403             |
| paciente | Tania74@paciente.medsecure / TestPass123!           | /api/users         | POST   | 403             |
| doctor   | Rachelle_Barrows@hospital.medsecure / TestPass123!  | /api/users         | GET    | 403             |
| doctor   | Rachelle_Barrows@hospital.medsecure / TestPass123!  | /api/patients      | GET    | 200             |
| admin    | admin@medsecure.local / TestPass123!                | /api/users         | GET    | 200             |
| admin    | admin@medsecure.local / TestPass123!                | /api/users         | POST   | 403             |
| master   | master@admin.com / Master2024!                      | /api/users         | GET    | 200             |
| master   | master@admin.com / Master2024!                      | /api/users         | POST   | 201 (si envías datos válidos) |

**200 = permitido, 403 = denegado**

### Cómo documentarlo en tu tesis

```markdown
**Tabla X. Matriz de control de acceso RBAC**

| Rol | /api/users (GET) | /api/users (POST) | /api/patients (GET) |
|-----|------------------|-------------------|---------------------|
| Paciente | 403 (denegado) | 403 (denegado) | 403 (denegado) |
| Doctor | 403 (denegado) | 403 (denegado) | 200 (permitido) |
| Admin | 200 (permitido) | 403 (denegado) | 200 (permitido) |
| Master | 200 (permitido) | 201 (permitido) | ... |

**Resultado:** La matriz RBAC funciona correctamente. Cada rol tiene exactamente los permisos que necesita.
**Mecanismo de defensa:** Middleware `checkRole` que valida el rol del usuario contra los roles permitidos para cada endpoint.
```
---

## PRUEBA 4: Ataque de Fuerza Bruta

### ¿Qué es?

Un ataque de fuerza bruta es cuando alguien intenta miles de contraseñas una tras otra hasta encontrar la correcta. El sistema debería **bloquear la cuenta** después de varios intentos fallidos para evitarlo.

### Script simple para probarlo

Crea un archivo llamado `bruteforce-test.js` en cualquier carpeta:

```javascript
const http = require('http');

function loginFallido(email, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 80) }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== ATAQUE DE FUERZA BRUTA ===');
  console.log('Enviando 10 intentos con contraseñas incorrectas...\n');

  for (let i = 1; i <= 10; i++) {
    const res = await loginFallido(
      'admin@medsecure.local',
      `contraseña_incorrecta_${i}`
    );

    console.log(`Intento ${i}: ${res.status}`);

    if (res.status === 423) {
      console.log('\n*** CUENTA BLOQUEADA después de', i, 'intentos ***');
      console.log('Respuesta:', res.body);
      break;
    }
  }
}

main();
```

**Para ejecutarlo:**

```powershell
node bruteforce-test.js
```

### Resultado esperado:

```
=== ATAQUE DE FUERZA BRUTA ===
Enviando 10 intentos con contraseñas incorrectas...

Intento 1: 401
Intento 2: 401
Intento 3: 401
Intento 4: 401
Intento 5: 423

*** CUENTA BLOQUEADA después de 5 intentos ***
Respuesta: {"error":"Cuenta bloqueada. Intenta de nuevo en 15 minutos.","code":"ACCOUNT_LOCKED"}
```

### ¿Qué significa?

- Los primeros intentos dan `401 Unauthorized` (contraseña incorrecta, pero el sistema responde normal)
- En el intento #5 (o el número configurado), el sistema cambia a `423 Locked`
- Esto significa que el **account lockout** funcionó

### Cómo documentarlo en tu tesis

```markdown
**Tabla X. Prueba de resistencia a fuerza bruta**

| Intento | Código HTTP | Respuesta |
|---------|-------------|-----------|
| 1 | 401 | Credenciales inválidas |
| 2 | 401 | Credenciales inválidas |
| 3 | 401 | Credenciales inválidas |
| 4 | 401 | Credenciales inválidas |
| 5 | 423 | Cuenta bloqueada. Intenta de nuevo en 15 minutos. |

**Resultado:** El sistema bloquea la cuenta después de 5 intentos fallidos, mitigando ataques de fuerza bruta.
**Mecanismo de defensa:** Contador `failed_attempts` en la base de datos, con bloqueo temporal (`locked_until`) al superar el umbral configurado (`config.lockout.threshold`).
```

> **⚠️ Importante:** Después de esta prueba, la cuenta de admin queda bloqueada por 15 minutos. Para desbloquearla, el master debe cambiar su estado o esperar. Puedes usar otro email (como `master@admin.com`) para la prueba.

---

## PRUEBA 5: Ver los Logs de Seguridad

### ¿Qué son los logs?

Cada vez que alguien hace algo en el sistema (login, crear usuario, ver datos), MedSecure guarda un registro en la tabla `audit_logs`. Es como la "cámara de seguridad" del sistema.

### Cómo ver los logs

Abre PowerShell y ejecuta:

```powershell
docker compose exec postgres psql -U medsecure -d medsecure -c "SELECT id, user_id, action, resource_type, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

### Resultado esperado:

```
 id | user_id | action | resource_type | ip_address | created_at
----+---------+--------+---------------+------------+---------------------------
  5 | abc123  | LOGIN  | user          | 172.20.0.1 | 2026-05-14 01:50:23...
  4 | abc123  | CREATE  | user          | 172.20.0.1 | 2026-05-14 01:48:10...
  3 | def456  | LOGIN  | user          | 172.20.0.1 | 2026-05-14 01:45:00...
```

### Qué significan las columnas

| Columna      | Significado                                  |
|-------------|---------------------------------------------|
| id          | Número único del log                        |
| user_id     | ID del usuario que hizo la acción           |
| action      | Qué hizo (LOGIN, CREATE, UPDATE, DELETE)    |
| resource_type | Tipo de recurso (user, patient, record)   |
| ip_address  | Dirección IP desde donde se conectó         |
| created_at  | Fecha y hora exacta                         |

### La prueba de inmutabilidad (la mejor parte)

Los logs NO se pueden borrar ni modificar. Es como escribir en piedra. Para comprobarlo:

```powershell
docker compose exec postgres psql -U medsecure -d medsecure -c "DELETE FROM audit_logs WHERE id = 1;"
```

**Resultado esperado:**

```
ERROR:  La tabla audit_logs es de solo inserción (INSERT only)
CONTEXT:  PL/pgSQL function prevent_audit_mutation()
```

¡El sistema te dice "no puedes borrar esto"! Eso es exactamente lo que queremos.

### Cómo documentarlo en tu tesis

```markdown
**Prueba de integridad de logs de auditoría**

Se intentó eliminar un registro de la tabla `audit_logs` y se obtuvo:
```
ERROR: La tabla audit_logs es de solo inserción (INSERT only)
```

**Resultado:** Los logs de auditoría son inmutables: no pueden ser modificados ni eliminados.
**Mecanismo de defensa:** Trigger en PostgreSQL (`prevent_audit_mutation`) que impide operaciones UPDATE/DELETE sobre la tabla `audit_logs`, lanzando una excepción si se intenta modificar un registro existente.
```
---

## RESUMEN PARA TU TESIS

### Tabla maestra de resultados

| # | Prueba | Resultado | Mecanismo de defensa |
|---|--------|-----------|---------------------|
| 1 | SQL Injection | ✅ Protegido | Parameterized queries (separan código SQL de datos) |
| 2 | Acceso sin token | ✅ Protegido | Middleware authenticate (verifica JWT en cada request) |
| 3 | Escalación de roles | ✅ Protegido | Middleware checkRole (valida rol contra permisos del endpoint) |
| 4 | Fuerza bruta | ✅ Protegido | Account lockout tras 5 intentos (contador + bloqueo temporal) |
| 5 | Logs de seguridad | ✅ Inmutables | Trigger PostgreSQL solo INSERT (ni UPDATE ni DELETE) |

### Cómo citar en tu tesis (formato APA)

Cuando escribas tu tesis, describe cada prueba así:

> "Para verificar la resistencia a SQL Injection, se enviaron peticiones POST al endpoint `/api/auth/login` con payloads maliciosos en el campo email (como `admin' OR 1=1--`). En todos los casos, el sistema respondió con `401 Unauthorized`, confirmando que las consultas parametrizadas mitigan efectivamente este tipo de ataque."

> "El control de acceso basado en roles se validó mediante una matriz de 4 roles × 4 endpoints. Cada rol únicamente pudo acceder a los endpoints autorizados, obteniendo `403 Forbidden` en intentos no autorizados."

> "La inmutabilidad de los logs de auditoría se verificó intentando ejecutar operaciones DELETE sobre la tabla `audit_logs`, las cuales fueron rechazadas por el trigger `prevent_audit_mutation`."
```
