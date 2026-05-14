const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { checkRole, ROLES } = require('../middleware/rbac');
const {
  createAppointment,
  listAppointments,
  cancelAppointment,
} = require('./controller');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  checkRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN),
  [
    body('patient_token').notEmpty().withMessage('Paciente requerido'),
    body('doctor_id').notEmpty().withMessage('Médico requerido'),
    body('fecha').notEmpty().withMessage('Fecha requerida'),
    body('hora').notEmpty().withMessage('Hora requerida'),
    body('motivo').notEmpty().trim().withMessage('Motivo de consulta requerido'),
  ],
  createAppointment
);

router.get(
  '/',
  checkRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  listAppointments
);

router.delete(
  '/:id',
  checkRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN),
  cancelAppointment
);

module.exports = router;