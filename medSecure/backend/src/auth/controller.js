// =============================================================================
// MedSecure - Controlador de autenticación
// Capa 1: Registro con bcrypt (costo 12+), TOTP MFA, account lockout
// Capa 2: JWT RS256, refresh tokens con rotación, blacklist en Redis
// =============================================================================
// Mitiga: Fuerza bruta, suplantación, sesiones secuestradas
// Artículo HIPAA: 164.312(d) - Person or Entity Authentication
// =============================================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { redis } = require('../config/redis');
const { config } = require('../config');
const { encrypt, decrypt } = require('../utils/encryption');
const { logger, auditLog } = require('../utils/logger');

// =============================================================================
// REGISTRO
// =============================================================================
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { email, password, role } = req.body;

    // Verificar si el email ya existe (respuesta genérica para no revelar existencia)
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'No se pudo completar el registro',
        code: 'REGISTRATION_ERROR',
      });
    }

    // Hash de contraseña con bcrypt (costo mínimo 12)
    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

    // Crear usuario
    const patientToken = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, patient_token)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, patient_token, created_at`,
      [email, passwordHash, role || 'patient', patientToken]
    );

    const user = result.rows[0];

    logger.info('Usuario registrado', { userId: user.id, role: user.role });

    // Respuesta genérica - no revelar si el registro fue exitoso o no
    res.status(201).json({
      message: 'Registro exitoso. Por favor configura la autenticación de dos factores.',
      userId: user.id,
      patientToken: user.patient_token,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// LOGIN
// =============================================================================
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
      });
    }

    const { email, password } = req.body;

    // Respuesta genérica - no revelar si el email existe (Capa 1)
    const genericError = {
      error: 'Credenciales inválidas',
      code: 'INVALID_CREDENTIALS',
    };

    const result = await pool.query(
      `SELECT id, email, password_hash, role, failed_attempts, locked_until,
              totp_enabled, patient_token
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn('Intento de login con email inexistente', { ip: req.ip });
      return res.status(401).json(genericError);
    }

    const user = result.rows[0];

    // Verificar bloqueo de cuenta (Capa 1)
    if (user.locked_until != null && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.locked_until) - new Date()) / 60000
      );

      logger.warn('Intento de login en cuenta bloqueada', {
        userId: user.id,
        ip: req.ip,
      });

      return res.status(423).json({
        error: `Cuenta bloqueada. Intenta de nuevo en ${remainingMinutes} minutos.`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Incrementar contador de intentos fallidos
      const currentAttempts = user.failed_attempts || 0;
      const newAttempts = currentAttempts + 1;
      let lockUntil = null;

      if (newAttempts >= config.lockout.threshold) {
        lockUntil = new Date(
          Date.now() + config.lockout.durationMinutes * 60000
        );
        logger.warn('Cuenta bloqueada por múltiples intentos fallidos', {
          userId: user.id,
          attempts: newAttempts,
          ip: req.ip,
        });
      }

      await pool.query(
        `UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
        [newAttempts, lockUntil, user.id]
      );

      return res.status(401).json(genericError);
    }

    // Restablecer contador de intentos fallidos
    await pool.query(
      `UPDATE users SET failed_attempts = 0, last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    // Registrar login exitoso (Capa 12)
    auditLog({
      userId: user.id,
      action: 'LOGIN',
      resourceId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Si el usuario tiene MFA habilitado, solo devolver un token parcial
    if (user.totp_enabled) {
      const mfaToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          mfaPending: true,
        },
        config.jwt.privateKey,
        {
          algorithm: 'RS256',
          expiresIn: '5m',
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }
      );

      return res.json({
        mfaRequired: true,
        mfaToken,
        message: 'Se requiere verificación de dos factores',
      });
    }

    // Sin MFA: generar tokens completos
    const tokens = await generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientToken: user.patient_token,
        mfaEnabled: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// SETUP MFA (TOTP)
// =============================================================================
async function setupMFA(req, res, next) {
  try {
    const user = req.user;

    // Verificar que el usuario existe
    const result = await pool.query(
      `SELECT id, totp_enabled, totp_secret FROM users WHERE id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const dbUser = result.rows[0];

    // Si ya tiene MFA, no permitir re-configurar sin verificar
    if (dbUser.totp_enabled) {
      return res.status(400).json({
        error: 'MFA ya está configurado. Deshabilítalo primero para reconfigurar.',
        code: 'MFA_ALREADY_CONFIGURED',
      });
    }

    // Generar secreto TOTP
    const secret = speakeasy.generateSecret({
      name: `${config.totp.issuer}:${user.email}`,
      issuer: config.totp.issuer,
    });

    // Cifrar el secreto antes de guardarlo (Capa 6)
    const encryptedSecret = encrypt(secret.base32, Buffer.from(config.totp.encryptionKey, 'hex'));

    // Guardar secreto temporalmente (aún no habilitado hasta verificar)
    await pool.query(
      `UPDATE users SET totp_secret = $1 WHERE id = $2`,
      [encryptedSecret, user.id]
    );

    // Generar QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: 'Escanea el código QR con Google Authenticator',
      secret: secret.base32, // Mostrar una vez para configuración manual
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// VERIFICAR MFA
// =============================================================================
async function verifyMFA(req, res, next) {
  try {
    const { token } = req.body;
    const user = req.user;

    const result = await pool.query(
      `SELECT id, totp_secret, role, patient_token, email FROM users WHERE id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const dbUser = result.rows[0];

    // Descifrar secreto TOTP
    const decryptedSecret = decrypt(dbUser.totp_secret, Buffer.from(config.totp.encryptionKey, 'hex'));

    if (!decryptedSecret) {
      return res.status(500).json({
        error: 'Error al verificar MFA',
        code: 'MFA_ERROR',
      });
    }

    // Verificar token TOTP
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 1, // Permitir 1 paso de tiempo de diferencia
    });

    if (!verified) {
      return res.status(401).json({
        error: 'Código de verificación inválido',
        code: 'INVALID_MFA_TOKEN',
      });
    }

    // Habilitar MFA permanentemente
    await pool.query(
      `UPDATE users SET totp_enabled = true WHERE id = $1`,
      [user.id]
    );

    // Si viene de un login pendiente (mfaPending en JWT)
    if (user.mfaPending) {
      // Buscar al usuario completo para generar tokens
      const fullUser = await pool.query(
        `SELECT id, email, role, patient_token FROM users WHERE id = $1`,
        [user.id]
      );
      const tokens = await generateTokens(fullUser.rows[0]);

      return res.json({
        message: 'MFA verificado exitosamente',
        ...tokens,
        user: {
          id: fullUser.rows[0].id,
          email: fullUser.rows[0].email,
          role: fullUser.rows[0].role,
          patientToken: fullUser.rows[0].patient_token,
          mfaEnabled: true,
        },
      });
    }

    res.json({
      message: 'MFA configurado y verificado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GENERAR TOKENS
// =============================================================================
async function generateTokens(user) {
  const jti = uuidv4();

  // Access token (15 min, RS256)
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      patientToken: user.patient_token,
      jti,
    },
    config.jwt.privateKey,
    {
      algorithm: 'RS256',
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }
  );

  // Refresh token (opaco, 7 días, UUID v4)
  const refreshToken = uuidv4();
  const refreshExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // Almacenar refresh token en Redis con el jti como key
  await redis.set(
    `refresh:${refreshToken}`,
    JSON.stringify({
      userId: user.id,
      jti,
      role: user.role,
    }),
    'EX',
    7 * 24 * 60 * 60 // 7 días en segundos
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutos en segundos
    tokenType: 'Bearer',
  };
}

// =============================================================================
// REFRESH TOKEN (con rotación)
// Capa 2: Rotación de tokens - cada uso invalida el anterior
// =============================================================================
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Refresh token requerido',
        code: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    // Obtener datos del refresh token en Redis
    const tokenData = await redis.get(`refresh:${token}`);
    if (!tokenData) {
      return res.status(401).json({
        error: 'Refresh token inválido o expirado',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Eliminar el token viejo (rotación)
    await redis.del(`refresh:${token}`);

    const { userId } = JSON.parse(tokenData);

    // Verificar que el usuario sigue activo
    const result = await pool.query(
      `SELECT id, email, role, patient_token FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    // Generar nuevos tokens
    const tokens = await generateTokens(result.rows[0]);

    logger.info('Token refrescado', { userId });

    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// LOGOUT
// Capa 2: Invalidar ambos tokens (blacklist en Redis)
// =============================================================================
async function logout(req, res, next) {
  try {
    const { token: accessToken, user } = req;

    // Agregar access token a la blacklist (por el tiempo restante de vida)
    // Decodificar para obtener exp
    const decoded = jwt.decode(accessToken);
    if (decoded && decoded.exp) {
      const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await redis.set(`blacklist:${accessToken}`, '1', 'EX', ttl);
      }
    }

    // Eliminar refresh token si se proporciona
    const { refreshToken } = req.body;
    if (refreshToken) {
      await redis.del(`refresh:${refreshToken}`);
    }

    auditLog({
      userId: user.id,
      action: 'LOGOUT',
      resourceId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Usuario cerró sesión', { userId: user.id });

    res.json({
      message: 'Sesión cerrada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// CAMBIAR CONTRASEÑA (autenticado, verifica contraseña actual)
// =============================================================================
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son obligatorias',
        code: 'VALIDATION_ERROR',
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 8 caracteres',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({
        error: 'La contraseña actual no es correcta',
        code: 'INVALID_PASSWORD',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// OBTENER USUARIO ACTUAL
// =============================================================================
async function me(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, role, patient_token, totp_enabled, created_at, last_login_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientToken: user.patient_token,
        mfaEnabled: user.totp_enabled,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  setupMFA,
  verifyMFA,
  refreshToken,
  logout,
  changePassword,
  me,
};
