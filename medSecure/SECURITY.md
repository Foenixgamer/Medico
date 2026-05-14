# MedSecure - Documentación de Seguridad

## Resumen

MedSecure implementa **14 capas de seguridad** para proteger datos clínicos (Protected Health Information - PHI) y cumplir con los estándares **HIPAA** y **GDPR**. Este documento detalla cada capa, los vectores de ataque que mitiga y las referencias regulatorias aplicables.

---

## Capa 1: Autenticación con MFA

### Objetivo
Prevenir accesos no autorizados mediante autenticación multifactor.

### Implementación
- **Hash de contraseñas**: bcrypt con costo 12 (configurable vía `BCRYPT_SALT_ROUNDS`)
- **TOTP**: Compatible con Google Authenticator, Microsoft Authenticator, Authy
- **Account Lockout**: Bloqueo tras 5 intentos fallidos (configurable), duración 30 minutos
- **Roles**: `patient`, `doctor`, `nurse`, `admin` (ENUM en PostgreSQL)

### Vectores de ataque mitigados
- **Fuerza bruta**: Rate limiting + account lockout + bcrypt cost
- **Suplantación (spoofing)**: MFA requiere segundo factor físico
- **Credential stuffing**: Respuestas genéricas de error (no revelan si el email existe)
- **Replay attack**: TOTP window = 1 (tolerance ajustada al mínimo)

### Referencias regulatorias
- **HIPAA 164.312(d)**: Person or Entity Authentication
- **HIPAA 164.312(a)(2)(iii)**: Automatic logoff
- **GDPR Art. 32**: Security of processing

---

## Capa 2: Gestión de Sesiones

### Objetivo
Proteger tokens y sesiones contra robo y reutilización.

### Implementación
- **Access tokens**: JWT firmados con RS256 (4096 bits), expiración 15 minutos
- **Refresh tokens**: Opacos (UUID v4), 7 días de expiración, rotación con cada uso
- **Blacklist**: Tokens revocados almacenados en Redis hasta su expiración
- **Logout**: Invalida access token (blacklist) + refresh token (eliminación en Redis)

### Vectores de ataque mitigados
- **Token hijacking**: Rotación de refresh tokens limita ventana de ataque
- **Session fixation**: Nuevos tokens en cada refresh
- **Token replay**: Blacklist impide reuso de access tokens después de logout
- **JWT tampering**: Claves RS256 privadas requeridas para firmar

### Referencias regulatorias
- **HIPAA 164.312(a)(2)(i)**: Unique User Identification
- **HIPAA 164.312(a)(2)(ii)**: Emergency Access Procedure

---

## Capa 3: API Gateway + WAF

### Objetivo
Proteger la API contra ataques de inyección y denegación de servicio.

### Implementación
- **Rate limiting**:
  - Global: 100 requests/15 minutos por IP
  - Auth: 5 requests/minuto por IP+email
  - Registro: 3 registros/hora por IP
- **Helmet.js**: CSP, HSTS (1 año, includeSubDomains, preload), X-Frame-Options: DENY
- **Sanitización**: Limpieza recursiva de `req.body`, `req.query`, `req.params` (XSS, NoSQLi)
- **express-validator**: Validación estricta en todas las rutas

### Vectores de ataque mitigados
- **SQL Injection**: Validación + sanitización + parameterized queries (pg)
- **Cross-Site Scripting (XSS)**: Sanitización de HTML entities, CSP estricta
- **Denial of Service (DoS)**: Rate limiting por IP
- **Content Sniffing**: X-Content-Type-Options: nosniff

### Referencias regulatorias
- **HIPAA 164.312(c)(1)**: Integrity Controls
- **HIPAA 164.312(c)(2)**: Mechanism to Authenticate Electronic Protected Health Information

---

## Capa 4: Control de Acceso (RBAC)

### Objetivo
Garantizar que cada usuario solo acceda a los recursos autorizados.

### Implementación
- **checkRole()**: Middleware que verifica roles permitidos
- **checkPatientOwnership()**: Pacientes solo ven SUS propios expedientes
- **patient_assignments**: Médicos solo acceden a pacientes asignados
- **Doble confirmación**: Acciones destructivas requieren header `X-Confirm-Action: confirmed`

### Vectores de ataque mitigados
- **Escalada de privilegios**: Verificación de rol en cada ruta sensible
- **IDOR (Insecure Direct Object Reference)**: Ownership check + tokenización
- **Privilege abuse**: Auditoría de cada acceso (Capa 12)

### Referencias regulatorias
- **HIPAA 164.312(a)(1)**: Access Control
- **HIPAA 164.312(a)(2)(iv)**: Encryption and Decryption
- **GDPR Art. 5(1)(f)**: Integrity and confidentiality

---

## Capa 5: Comunicación Segura

### Objetivo
Proteger datos en tránsito contra interceptación.

### Implementación
- **HTTPS forzado**: Redirección HTTP → HTTPS en producción
- **CORS estricto**: Whitelist de orígenes, bloqueo por defecto
- **X-Powered-By**: Deshabilitado
- **HSTS**: 1 año, includeSubDomains, preload
- **Cookie flags**: Secure, HttpOnly, SameSite

### Vectores de ataque mitigados
- **Man-in-the-Middle (MitM)**: HTTPS forzado + HSTS
- **Cross-Origin attacks**: CORS whitelist
- **Information disclosure**: X-Powered-By deshabilitado

### Referencias regulatorias
- **HIPAA 164.312(e)(1)**: Transmission Security
- **HIPAA 164.312(e)(2)(i)**: Integrity Controls
- **HIPAA 164.312(e)(2)(ii)**: Encryption

---

## Capa 6: Cifrado en Reposo (PHI)

### Objetivo
Proteger datos clínicos almacenados.

### Implementación
- **Algoritmo**: AES-256-GCM (autenticación integrada)
- **IV único**: 16 bytes aleatorios por campo cifrado
- **Auth Tag**: 16 bytes por campo (detección de manipulación)
- **Formato**: `IV:ciphertext:authTag` en hex
- **Campos cifrados**: `full_name`, `date_of_birth`, `phone`, `address`, `emergency_contact`, `diagnosis`, `medications`, `history`, `notes`

### Vectores de ataque mitigados
- **Data breach**: PHI ilegible sin la clave maestra
- **Tampering**: Auth tags detectan modificación no autorizada
- **IV reuse**: IV aleatorio único por cada operación de cifrado

### Referencias regulatorias
- **HIPAA 164.312(a)(2)(iv)**: Encryption and Decryption
- **HIPAA 164.312(c)(2)**: Mechanism to Authenticate PHI
- **GDPR Art. 32**: Pseudonymization and encryption of personal data

---

## Capa 7: Tokenización

### Objetivo
Reemplazar identificadores internos con tokens públicos.

### Implementación
- **patient_token**: UUID v4 generado por usuario
- **IDs internos**: Nunca expuestos en la API
- **Datos sintéticos**: Seed usa `@faker-js/faker` para datos de prueba

### Vectores de ataque mitigados
- **ID enumeration**: UUIDs no secuenciales y no predecibles
- **Information disclosure**: IDs secuenciales nunca expuestos
- **Data correlation**: Token público independiente del ID interno

### Referencias regulatorias
- **GDPR Art. 4(5)**: Pseudonymization
- **HIPAA 164.514(b)**: De-identification

---

## Capa 8: Backups Cifrados

### Objetivo
Proteger backups contra exposición no autorizada.

### Implementación
- **Cifrado AES-256-CBC**: con PBKDF2 (100,000 iteraciones)
- **Rotación**: Retención configurable, limpieza automática
- **Integridad**: SHA-256 hash de cada backup
- **Log**: Registro de cada operación de backup

### Vectores de ataque mitigados
- **Data loss**: Backups regulares automatizados
- **Backup breach**: Cifrado AES-256 con clave separada

### Referencias regulatorias
- **HIPAA 164.308(a)(7)(ii)(A)**: Data Backup Plan
- **HIPAA 164.308(a)(7)(ii)(B)**: Disaster Recovery Plan

---

## Capa 9: Red Segmentada

### Objetivo
Aislar componentes para limitar movimiento lateral.

### Implementación
- **frontend-net**: Accesible desde host (proxy reverso)
- **backend-net**: Red interna, no expuesta al exterior
- **db-net**: Totalmente aislada, solo backend accede
- **Redis**: Solo accesible desde backend-net

### Vectores de ataque mitigados
- **Lateral movement**: Contenedores comprometidos no acceden a BD
- **Direct DB access**: PostgreSQL no expuesto al exterior
- **Pivot attacks**: Segmentación estricta entre capas

### Referencias regulatorias
- **HIPAA 164.312(a)(1)**: Access Control (network segmentation)

---

## Capa 10: Docker Hardening

### Objetivo
Minimizar superficie de ataque de contenedores.

### Implementación
- **Imagen base**: `node:20-alpine` (mínima superficie)
- **Usuario no-root**: `USER medsecure` (uid 1001)
- **Multi-stage build**: Dependencias separadas del runtime
- **.dockerignore**: Excluye `node_modules`, `.env`, `.git`, logs
- **Dependabot**: Alertas automáticas de vulnerabilidades

### Vectores de ataque mitigados
- **Container breakout**: Usuario no-root limita privilegios
- **Supply chain**: Dependabot + imágenes oficiales verificadas
- **Secret exposure**: .dockerignore excluye archivos sensibles

### Referencias regulatorias
- **CIS Docker Benchmark**: Section 4 (Container Images and Build File)

---

## Capa 11: Gestión de Secretos

### Objetivo
Eliminar hardcoding de credenciales y secretos.

### Implementación
- **.env.example**: Documentación de TODAS las variables
- **Validación al inicio**: Server NO arranca si faltan variables críticas
- **Validación de formato**: `PHI_MASTER_KEY` debe ser exactamente 64 hex chars
- **Validación de bcrypt cost**: Mínimo 12, menor causa error fatal

### Vectores de ataque mitigados
- **Secret exposure**: Sin valores reales en el repositorio
- **Misconfiguration**: Validación impide arranque con configuración inválida
- **Weak crypto**: Bcrypt cost mínimo forzado a 12

### Referencias regulatorias
- **OWASP Top 10:2021 A05:2021**: Security Misconfiguration

---

## Capa 12: Logging y Auditoría

### Objetivo
Trazabilidad completa de accesos y modificaciones.

### Implementación
- **Winston**: Niveles: error, warn, info, http, verbose, debug, audit
- **Rotación diaria**: `winston-daily-rotate-file`, retención 90 días
- **Tabla inmutable**: `audit_logs` con trigger que bloquea UPDATE/DELETE
- **Campos auditados**: `timestamp`, `userId`, `action`, `resourceId`, `ip`, `userAgent`

### Vectores de ataque mitigados
- **Non-repudiation**: Registro inmutable de todas las acciones
- **Forensic analysis**: Trazabilidad completa para investigaciones
- **Compliance**: Evidencia de controles de acceso

### Referencias regulatorias
- **HIPAA 164.312(b)**: Audit Controls
- **GDPR Art. 30**: Records of processing activities

---

## Capa 13: Detección de Intrusiones (IDS)

### Objetivo
Detectar comportamientos anómalos en tiempo real.

### Implementación
- **Mass Access Detection**: >50 expedientes en 1 hora → alerta `security_events`
- **Token Reuse Detection**: Misma sesión desde IPs diferentes → alerta
- **Endpoint**: `GET /api/admin/security-events` (solo admin)
- **Alertas en log**: `warn` level con detalles del evento

### Vectores de ataque mitigados
- **Insider threat**: Acceso masivo a expedientes detectado
- **Session hijacking**: IP geográficamente distante detectada
- **Credential sharing**: Múltiples IPs con misma sesión

### Referencias regulatorias
- **HIPAA 164.312(b)**: Audit Controls (anomaly detection)
- **NIST SP 800-53**: AU-6 (Audit Review, Analysis, and Reporting)

---

## Capa 14: Cumplimiento GDPR

### Objetivo
Implementar derechos de privacidad del paciente.

### Implementación
- **GDPR Delete**: `DELETE /api/patients/:token/gdpr-delete` anonimiza datos (no borra)
- **Consent log**: Tabla `consent_log` registra aceptación/revocación de términos
- **Data minimization**: Solo campos necesarios almacenados

### Vectores de ataque mitigados
- **Data retention**: Mecanismo para eliminar datos cuando el paciente lo solicita
- **Non-compliance**: Registro de consentimiento para auditoría regulatoria

### Referencias regulatorias
- **GDPR Art. 17**: Right to erasure ('right to be forgotten')
- **GDPR Art. 7**: Conditions for consent
- **GDPR Art. 25**: Data protection by design and by default

---

## Resumen de Vectores de Ataque Mitigados

| Vector de Ataque | Capas que lo Mitigan |
|-----------------|---------------------|
| Fuerza bruta | 1 (lockout), 3 (rate limit) |
| SQL Injection | 3 (sanitize + parameterized queries) |
| XSS | 3 (CSP + sanitize), 5 (CORS) |
| Session hijacking | 2 (rotation + blacklist), 13 (IDS) |
| Token tampering | 2 (RS256 signature) |
| Escalada de privilegios | 4 (RBAC) |
| IDOR | 4 (ownership check), 7 (tokenization) |
| PHI exposure | 6 (AES-256-GCM), 8 (backup encryption) |
| Lateral movement | 9 (network segmentation) |
| Container breakout | 10 (non-root user) |
| Hardcoded secrets | 11 (env validation) |
| Non-repudiation | 12 (immutable audit logs) |
| Insider threat | 13 (mass access detection) |
| Data retention | 14 (GDPR delete) |

## Compliance Matrix

| Requisito | HIPAA | GDPR | Estado |
|-----------|-------|------|--------|
| Autenticación única | 164.312(d) | Art. 32 | Implementado |
| Control de acceso | 164.312(a)(1) | Art. 5(1)(f) | Implementado |
| Cifrado PHI | 164.312(a)(2)(iv) | Art. 32 | Implementado |
| Auditoría | 164.312(b) | Art. 30 | Implementado |
| Integridad | 164.312(c)(1) | Art. 32 | Implementado |
| Seguridad transmisión | 164.312(e)(1) | Art. 32 | Implementado |
| Backup | 164.308(a)(7)(ii)(A) | Art. 32 | Implementado |
| Derecho al olvido | — | Art. 17 | Implementado |
| Consentimiento | — | Art. 7 | Implementado |
| Pseudonimización | — | Art. 4(5) | Implementado |
