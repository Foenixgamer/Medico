# MedSecure - Plataforma Médica Segura

Plataforma de gestión médica con cumplimiento **HIPAA/GDPR**, diseñada con 14 capas de seguridad para proteger datos clínicos (PHI).

## Stack Tecnológico

- **Backend**: Node.js + Express + RS256 JWT
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Base de Datos**: PostgreSQL 16 (datos clínicos) + Redis 7 (sesiones/caché)
- **Autenticación**: JWT RS256 + TOTP (Google Authenticator) + bcrypt (costo 12)
- **Contenedores**: Docker + docker-compose con redes segmentadas

## Arquitectura de Seguridad (14 Capas)

| Capa | Nombre | Mitiga |
|------|--------|--------|
| 1 | Autenticación MFA | Fuerza bruta, suplantación |
| 2 | Gestión de Sesiones | Token hijacking, sesiones fijas |
| 3 | API Gateway + WAF | SQLi, XSS, DoS |
| 4 | RBAC | Escalada de privilegios, IDOR |
| 5 | Comunicación Segura | MitM, sniffing |
| 6 | Cifrado en Reposo | Exposición de PHI en BD |
| 7 | Tokenización | Exposición de IDs internos |
| 8 | Backups Cifrados | Pérdida de datos |
| 9 | Red Segmentada | Movimiento lateral |
| 10 | Hardening | Ejecución como root |
| 11 | Gestión de Secretos | Hardcoding de claves |
| 12 | Logging y Auditoría | Falta de trazabilidad |
| 13 | Detección de Intrusiones | Acceso anómalo |
| 14 | Cumplimiento GDPR | Derecho al olvido |

## Requisitos

- **Docker** 24+ y **Docker Compose** v2.20+
- **Node.js** 20+ (para desarrollo sin Docker)
- **PostgreSQL** 16+ y **Redis** 7+ (para desarrollo sin Docker)
- **OpenSSL** (para generar claves)

## Setup Rápido (Docker)

### 1. Clonar y configurar

```bash
git clone <repo> medSecure
cd medSecure
cp .env.example .env
```

### 2. Generar claves y secretos

```bash
# Claves RSA para JWT RS256
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -pubout -out public.pem

# Codificar en base64
cat private.pem | base64 -w0
cat public.pem | base64 -w0

# Clave maestra PHI (AES-256)
openssl rand -hex 32

# TOTP encryption key
openssl rand -hex 32

# CSRF Secret
openssl rand -hex 32

# Session Secret
openssl rand -hex 64

# Backup encryption key
openssl rand -hex 32

# Contraseña BD (mín. 32 chars)
openssl rand -base64 32
```

### 3. Editar .env

Completa todas las variables en `.env` con los valores generados.

### 4. Iniciar

```bash
docker-compose up -d
```

### 5. Poblar BD con datos sintéticos

```bash
docker exec medsecure-backend npm run seed
```

### 6. Acceder

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000/api/health
- **Credenciales por defecto**: `admin@medsecure.local` / `TestPass123!`

## Setup Manual (sin Docker)

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de Entorno Críticas

Ver `.env.example` para documentación completa de cada variable.

| Variable | Descripción | Generación |
|----------|-------------|------------|
| `DB_PASSWORD` | Contraseña de PostgreSQL | `openssl rand -base64 32` |
| `JWT_PRIVATE_KEY_B64` | Clave RSA privada en base64 | `openssl genrsa 4096` + base64 |
| `JWT_PUBLIC_KEY_B64` | Clave RSA pública en base64 | `openssl rsa -pubout` + base64 |
| `PHI_MASTER_KEY` | Clave AES-256 para PHI | `openssl rand -hex 32` |
| `TOTP_ENCRYPTION_KEY` | Clave para cifrar secrets TOTP | `openssl rand -hex 32` |
| `CSRF_SECRET` | Secreto CSRF | `openssl rand -hex 32` |
| `SESSION_SECRET` | Secreto de sesión | `openssl rand -hex 64` |

## Scripts Disponibles

```bash
# Backend
npm run dev       # Desarrollo con nodemon
npm run seed      # Poblar BD con datos sintéticos
npm run test      # Tests (incluye seguridad)
npm run lint      # ESLint

# Backups
bash scripts/backup.sh    # Backup manual
# Ver scripts/cron.example para automatización

# Docker
docker-compose up -d        # Iniciar todo
docker-compose down         # Detener
docker-compose logs -f      # Ver logs
```

## Tests de Seguridad

```bash
cd backend
npm run test:security
```

Incluye pruebas para: SQL Injection, XSS, Auth Bypass, IDOR, CORS, Rate Limiting, PHI Encryption, Token Management.

## Endpoints API

Ver `api-collection.http` para colección completa de rutas.

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/mfa/setup` - Configurar 2FA
- `POST /api/auth/mfa/verify` - Verificar 2FA
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

### Pacientes
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:token` - Obtener paciente
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:token` - Actualizar paciente
- `DELETE /api/patients/:token/gdpr-delete` - GDPR delete

### Expedientes
- `GET /api/records/patient/:token` - Expedientes por paciente
- `GET /api/records/:id` - Expediente específico
- `POST /api/records` - Crear expediente
- `PUT /api/records/:id` - Actualizar expediente
- `DELETE /api/records/:id` - Eliminar expediente

### Admin
- `GET /api/admin/security-events` - Eventos de seguridad
- `POST /api/admin/security-events/:id/resolve` - Resolver evento
- `GET /api/admin/audit-logs` - Logs de auditoría
