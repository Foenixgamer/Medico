// =============================================================================
// MedSecure - Controlador de expedientes médicos
// Capa 6 + 12: PHI cifrado, auditoría de cada acceso
// =============================================================================
// Artículo HIPAA: 164.312(b) - Audit Controls
// Artículo HIPAA: 164.312(a)(2)(iv) - Encryption and decryption
// =============================================================================

const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const { logger, auditLog } = require('../utils/logger');
const { detectMassAccess } = require('../middleware/intrusionDetection');

// =============================================================================
// CREAR EXPEDIENTE
// =============================================================================
async function createRecord(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { patientToken, diagnosis, medications, history, notes } = req.body;

    // Verificar que el paciente existe
    const patientCheck = await pool.query(
      'SELECT patient_token FROM patients WHERE patient_token = $1',
      [patientToken]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    // Cifrar campos PHI (Capa 6)
    const result = await pool.query(
      `INSERT INTO medical_records
         (patient_token, diagnosis, medications, history, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        patientToken,
        encrypt(diagnosis),
        encrypt(medications || '[]'),
        encrypt(history || ''),
        encrypt(notes || ''),
        req.user.id,
      ]
    );

    const record = result.rows[0];

    auditLog({
      userId: req.user.id,
      action: 'CREATE',
      resourceId: record.id,
      resourceType: 'medical_record',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: { patientToken },
    });

    logger.info('Expediente creado', {
      userId: req.user.id,
      recordId: record.id,
      patientToken,
    });

    res.status(201).json({
      message: 'Expediente creado exitosamente',
      recordId: record.id,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// OBTENER EXPEDIENTES DE UN PACIENTE
// =============================================================================
async function getPatientRecords(req, res, next) {
  try {
    const { patientToken } = req.params;

    // Detección de acceso masivo (Capa 13)
    await detectMassAccess(req.user.id, patientToken, req.ip);

    const result = await pool.query(
      `SELECT id, diagnosis, medications, history, notes,
              created_by, created_at, updated_at
       FROM medical_records
       WHERE patient_token = $1
       ORDER BY created_at DESC`,
      [patientToken]
    );

    auditLog({
      userId: req.user.id,
      action: 'READ',
      resourceId: patientToken,
      resourceType: 'medical_record.list',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Descifrar campos PHI
    const records = result.rows.map((record) => ({
      id: record.id,
      diagnosis: decrypt(record.diagnosis),
      medications: decrypt(record.medications),
      history: decrypt(record.history),
      notes: decrypt(record.notes),
      createdBy: record.created_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    res.json({
      records,
      total: records.length,
      patientToken,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// OBTENER EXPEDIENTE ESPECÍFICO
// =============================================================================
async function getRecord(req, res, next) {
  try {
    const { recordId } = req.params;

    const result = await pool.query(
      `SELECT mr.*, u.patient_token
       FROM medical_records mr
       JOIN users u ON u.patient_token = mr.patient_token
       WHERE mr.id = $1`,
      [recordId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Expediente no encontrado',
        code: 'RECORD_NOT_FOUND',
      });
    }

    const record = result.rows[0];

    // Verificar ownership si es paciente
    if (
      req.user.role === 'patient' &&
      req.user.patientToken !== record.patient_token
    ) {
      return res.status(403).json({
        error: 'No tienes permiso para ver este expediente',
        code: 'FORBIDDEN',
      });
    }

    // Detección de acceso masivo (Capa 13)
    await detectMassAccess(req.user.id, recordId, req.ip);

    auditLog({
      userId: req.user.id,
      action: 'READ',
      resourceId: recordId,
      resourceType: 'medical_record',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    const decrypted = {
      id: record.id,
      patientToken: record.patient_token,
      diagnosis: decrypt(record.diagnosis),
      medications: decrypt(record.medications),
      history: decrypt(record.history),
      notes: decrypt(record.notes),
      createdBy: record.created_by,
      updatedBy: record.updated_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };

    res.json({ record: decrypted });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// ACTUALIZAR EXPEDIENTE
// =============================================================================
async function updateRecord(req, res, next) {
  try {
    const { recordId } = req.params;
    const { diagnosis, medications, history, notes } = req.body;

    const existing = await pool.query(
      'SELECT id FROM medical_records WHERE id = $1',
      [recordId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Expediente no encontrado',
        code: 'RECORD_NOT_FOUND',
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (diagnosis) {
      updates.push(`diagnosis = $${paramIndex++}`);
      values.push(encrypt(diagnosis));
    }
    if (medications !== undefined) {
      updates.push(`medications = $${paramIndex++}`);
      values.push(encrypt(medications));
    }
    if (history !== undefined) {
      updates.push(`history = $${paramIndex++}`);
      values.push(encrypt(history));
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(encrypt(notes));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No hay campos para actualizar',
        code: 'NO_UPDATES',
      });
    }

    updates.push('updated_at = NOW()');
    updates.push(`updated_by = $${paramIndex++}`);
    values.push(req.user.id);
    values.push(recordId);

    await pool.query(
      `UPDATE medical_records SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    auditLog({
      userId: req.user.id,
      action: 'UPDATE',
      resourceId: recordId,
      resourceType: 'medical_record',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Expediente actualizado', {
      userId: req.user.id,
      recordId,
    });

    res.json({
      message: 'Expediente actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// ELIMINAR EXPEDIENTE (solo admin)
// =============================================================================
async function deleteRecord(req, res, next) {
  try {
    const { recordId } = req.params;

    const result = await pool.query(
      'DELETE FROM medical_records WHERE id = $1 RETURNING id',
      [recordId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Expediente no encontrado',
        code: 'RECORD_NOT_FOUND',
      });
    }

    auditLog({
      userId: req.user.id,
      action: 'DELETE',
      resourceId: recordId,
      resourceType: 'medical_record',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Expediente eliminado', {
      userId: req.user.id,
      recordId,
    });

    res.json({
      message: 'Expediente eliminado',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRecord,
  getRecord,
  getPatientRecords,
  updateRecord,
  deleteRecord,
};
