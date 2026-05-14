// =============================================================================
// MedSecure - Rutas de expedientes médicos
// Capa 4 + 6 + 12: RBAC, PHI cifrado, auditoría de accesos
// =============================================================================

const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { checkRole, checkPatientOwnership, ROLES } = require('../middleware/rbac');
const { requireDoubleConfirm } = require('../middleware/rbac');
const {
  createRecord,
  getRecord,
  getPatientRecords,
  updateRecord,
  deleteRecord,
} = require('./controller');

const router = Router();

router.use(authenticate);

// ===== Crear expediente =====
router.post(
  '/',
  checkRole(ROLES.DOCTOR, ROLES.ADMIN),
  [
    body('patientToken').isUUID().withMessage('Token de paciente inválido'),
    body('diagnosis').notEmpty().trim().withMessage('Diagnóstico requerido'),
    body('medications').optional().trim(),
    body('history').optional().trim(),
    body('notes').optional().trim(),
  ],
  createRecord
);

// ===== Obtener expedientes de un paciente =====
router.get(
  '/patient/:patientToken',
  checkPatientOwnership,
  [
    param('patientToken').isUUID().withMessage('Token de paciente inválido'),
  ],
  getPatientRecords
);

// ===== Obtener expediente específico =====
router.get(
  '/:recordId',
  checkRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  [
    param('recordId').isUUID().withMessage('ID de expediente inválido'),
  ],
  getRecord
);

// ===== Actualizar expediente =====
router.put(
  '/:recordId',
  checkRole(ROLES.DOCTOR, ROLES.ADMIN),
  [
    param('recordId').isUUID().withMessage('ID de expediente inválido'),
  ],
  updateRecord
);

// ===== Eliminar expediente (solo admin con doble confirmación) =====
router.delete(
  '/:recordId',
  checkRole(ROLES.ADMIN),
  requireDoubleConfirm,
  [
    param('recordId').isUUID().withMessage('ID de expediente inválido'),
  ],
  deleteRecord
);

module.exports = router;
