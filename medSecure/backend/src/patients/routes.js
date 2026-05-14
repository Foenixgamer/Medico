// =============================================================================
// MedSecure - Rutas de pacientes
// Capa 4 + 6 + 7: RBAC, PHI cifrado, tokenización
// =============================================================================
// Mitiga: Exposición de PHI, IDOR, acceso no autorizado a datos de pacientes
// Artículo HIPAA: 164.512 - Uses and disclosures of PHI
// =============================================================================

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { checkRole, checkPatientOwnership, ROLES } = require('../middleware/rbac');
const {
  createPatient,
  getPatient,
  updatePatient,
  listPatients,
  gdprDelete,
  deletePatient,
} = require('./controller');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ===== Crear paciente (solo doctores y admins) =====
router.post(
  '/',
  checkRole(ROLES.DOCTOR, ROLES.ADMIN),
  [
    body('fullName').notEmpty().trim().withMessage('Nombre completo requerido'),
    body('dateOfBirth').isISO8601().withMessage('Fecha de nacimiento inválida'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('userId').isUUID().withMessage('ID de usuario inválido'),
  ],
  createPatient
);

// ===== Listar pacientes (doctores, nurses, admins) =====
router.get(
  '/',
  checkRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN),
  listPatients
);

// ===== Obtener paciente por token (Capa 7: solo token público) =====
router.get(
  '/:patientToken',
  checkPatientOwnership,
  [
    param('patientToken').isUUID().withMessage('Token de paciente inválido'),
  ],
  getPatient
);

// ===== Actualizar paciente =====
router.put(
  '/:patientToken',
  checkRole(ROLES.DOCTOR, ROLES.ADMIN),
  [
    param('patientToken').isUUID().withMessage('Token de paciente inválido'),
  ],
  updatePatient
);

// ===== Eliminar paciente (anonimizar) =====
router.delete(
  '/:patientToken',
  checkRole(ROLES.DOCTOR, ROLES.ADMIN),
  [
    param('patientToken').isUUID().withMessage('Token de paciente inválido'),
  ],
  deletePatient
);

// ===== GDPR Delete (Derecho al olvido - Capa 14) =====
router.delete(
  '/:patientToken/gdpr-delete',
  checkRole(ROLES.ADMIN, ROLES.PATIENT),
  [
    param('patientToken').isUUID().withMessage('Token de paciente inválido'),
  ],
  gdprDelete
);

module.exports = router;
