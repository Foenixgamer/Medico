const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger, auditLog } = require('../utils/logger');

async function createAppointment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { patient_token, doctor_id, fecha, hora, tipo_consulta, especialidad, motivo, notas } = req.body;

    const appointmentDate = new Date(`${fecha}T${hora}:00`);

    if (appointmentDate < new Date()) {
      return res.status(400).json({
        error: 'La fecha de la cita debe ser futura',
        code: 'PAST_DATE',
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_token, doctor_id, appointment_date, reason, tipo_consulta, especialidad, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, appointment_date, status, created_at`,
      [patient_token, doctor_id, appointmentDate, motivo, tipo_consulta || null, especialidad || null, notas || null, req.user.id]
    );

    const appointment = result.rows[0];

    auditLog({
      userId: req.user.id,
      action: 'CREATE',
      resourceId: appointment.id,
      resourceType: 'appointment',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Cita creada', {
      userId: req.user.id,
      appointmentId: appointment.id,
    });

    res.status(201).json({
      message: 'Cita creada exitosamente',
      appointment: {
        id: appointment.id,
        fecha: appointment.appointment_date,
        status: appointment.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listAppointments(req, res, next) {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT a.id, a.appointment_date, a.status, a.reason, a.tipo_consulta, a.especialidad,
               u.email as patient_email, d.email as doctor_email,
               a.appointment_date as fecha,
               to_char(a.appointment_date, 'HH24:MI') as hora
        FROM appointments a
        JOIN users u ON u.patient_token = a.patient_token
        JOIN users d ON d.id = a.doctor_id
        ORDER BY a.appointment_date DESC
      `;
      params = [];
    } else if (req.user.role === 'doctor') {
      query = `
        SELECT a.id, a.appointment_date, a.status, a.reason, a.tipo_consulta, a.especialidad,
               u.email as patient_email, d.email as doctor_email,
               a.appointment_date as fecha,
               to_char(a.appointment_date, 'HH24:MI') as hora
        FROM appointments a
        JOIN users u ON u.patient_token = a.patient_token
        JOIN users d ON d.id = a.doctor_id
        WHERE a.doctor_id = $1
        ORDER BY a.appointment_date DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'nurse') {
      query = `
        SELECT a.id, a.appointment_date, a.status, a.reason, a.tipo_consulta, a.especialidad,
               u.email as patient_email, d.email as doctor_email,
               a.appointment_date as fecha,
               to_char(a.appointment_date, 'HH24:MI') as hora
        FROM appointments a
        JOIN users u ON u.patient_token = a.patient_token
        JOIN users d ON d.id = a.doctor_id
        ORDER BY a.appointment_date DESC
      `;
      params = [];
    } else {
      query = `
        SELECT a.id, a.appointment_date, a.status, a.reason, a.tipo_consulta, a.especialidad,
               u.email as patient_email, d.email as doctor_email,
               a.appointment_date as fecha,
               to_char(a.appointment_date, 'HH24:MI') as hora
        FROM appointments a
        JOIN users u ON u.patient_token = a.patient_token
        JOIN users d ON d.id = a.doctor_id
        WHERE a.patient_token = $1
        ORDER BY a.appointment_date DESC
      `;
      params = [req.user.patientToken];
    }

    const result = await pool.query(query, params);

    res.json({
      appointments: result.rows.map(a => ({
        id: a.id,
        patient_email: a.patient_email,
        doctor_email: a.doctor_email,
        fecha: a.fecha,
        hora: a.hora,
        tipo: a.tipo_consulta,
        estado: a.status,
        motivo: a.reason,
      })),
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        code: 'APPOINTMENT_NOT_FOUND',
      });
    }

    auditLog({
      userId: req.user.id,
      action: 'DELETE',
      resourceId: id,
      resourceType: 'appointment',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Cita cancelada', {
      userId: req.user.id,
      appointmentId: id,
    });

    res.json({
      message: 'Cita cancelada',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  cancelAppointment,
};