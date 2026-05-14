// =============================================================================
// MedSecure - Rutas de autenticación
// Capa 1 + 2: MFA, JWT, refresh tokens, account lockout
// =============================================================================

const { Router } = require('express');
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const {
  login,
  setupMFA,
  verifyMFA,
  refreshToken,
  logout,
  changePassword,
  me,
} = require('./controller');
const { submitSupportRequest } = require('./supportRequest');

const router = Router();

// ===== Login =====
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  login
);

// ===== Setup MFA (requiere autenticación) =====
router.post('/mfa/setup', authenticate, setupMFA);

// ===== Verificar MFA =====
router.post(
  '/mfa/verify',
  authenticate,
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Token TOTP inválido (6 dígitos)'),
  ],
  verifyMFA
);

// ===== Enable MFA (alias de verify para frontend setup flow) =====
router.post(
  '/mfa/enable',
  authenticate,
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Token TOTP inválido (6 dígitos)'),
  ],
  verifyMFA
);

// ===== Refresh Token =====
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requerido'),
  ],
  refreshToken
);

// ===== Logout =====
router.post('/logout', authenticate, logout);

// ===== Cambiar contraseña (autenticado) =====
router.post('/change-password', authenticate, changePassword);

// ===== Obtener usuario actual =====
router.get('/me', authenticate, me);

// ===== Solicitud de soporte (pública) =====
router.post('/support-request', submitSupportRequest);

module.exports = router;
