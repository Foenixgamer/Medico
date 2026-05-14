// =============================================================================
// MedSecure - Middleware de Control de Acceso (RBAC)
// Capa 4: Control de Acceso Basado en Roles
// =============================================================================
// Mitiga: Escalada de privilegios, acceso a datos no autorizados
// Artículo HIPAA: 164.312(a)(1) - Access Control
// Artículo GDPR: Artículo 5(1)(f) - Integridad y confidencialidad
// =============================================================================

const { logger } = require('../utils/logger');

// Roles definidos como enum (deben coincidir con la BD)
const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ADMIN: 'admin',
  MASTER: 'master',
};

// Jerarquía de roles (para permisos heredados)
const ROLE_HIERARCHY = {
  [ROLES.MASTER]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.DOCTOR]: 3,
  [ROLES.NURSE]: 2,
  [ROLES.PATIENT]: 1,
};

/**
 * Middleware que verifica que el usuario tenga uno de los roles permitidos.
 * @param  {...string} allowedRoles - Roles permitidos para acceder a la ruta
 * @returns {Function} Middleware de Express
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Acceso denegado por rol', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        ip: req.ip,
      });

      return res.status(403).json({
        error: 'No tienes permisos para esta acción',
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
}

/**
 * Middleware que verifica que un paciente solo acceda a sus propios datos.
 * Requiere que la ruta tenga un parámetro :patientToken
 */
function checkPatientOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED',
    });
  }

  // Los admins y doctores pueden acceder a cualquier paciente
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.DOCTOR) {
    return next();
  }

  // Los pacientes solo pueden ver sus propios datos
  const patientToken = req.params.patientToken;
  if (req.user.role === ROLES.PATIENT) {
    // req.user.patientToken se setea en el login
    if (req.user.patientToken !== patientToken) {
      logger.warn('Intento de acceso a expediente ajeno', {
        userId: req.user.id,
        targetPatientToken: patientToken,
        ip: req.ip,
      });

      return res.status(403).json({
        error: 'Solo puedes acceder a tus propios datos',
        code: 'FORBIDDEN_OWNERSHIP',
      });
    }
  }

  next();
}

// =============================================================================
// Doble confirmación para acciones destructivas (admin)
// Capa 4: Los admins requieren doble confirmación
// =============================================================================
function requireDoubleConfirm(req, res, next) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return next();
  }

  const confirmHeader = req.headers['x-confirm-action'];
  if (confirmHeader !== 'confirmed') {
    return res.status(400).json({
      error: 'Acción destructiva requiere doble confirmación',
      code: 'CONFIRM_REQUIRED',
      message: 'Envía header X-Confirm-Action: confirmed para proceder',
    });
  }

  next();
}

module.exports = {
  checkRole,
  checkPatientOwnership,
  requireDoubleConfirm,
  ROLES,
};
