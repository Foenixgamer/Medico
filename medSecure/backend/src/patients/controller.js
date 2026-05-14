// =============================================================================
// MedSecure - Controlador de pacientes
// Capa 6: Cifrado de campos PHI con AES-256-GCM
// Capa 7: Tokenización - IDs internos nunca expuestos
// Capa 14: GDPR - Derecho al olvido (anonimización)
// =============================================================================
// Mitiga: Exposición de PHI si la BD es comprometida
// Artículo HIPAA: 164.312(a)(2)(iv) - Encrypt PHI
// Artículo GDPR: Artículo 17 - Right to erasure ('right to be forgotten')
// =============================================================================

const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const { logger, auditLog } = require('../utils/logger');
const { detectMassAccess } = require('../middleware/intrusionDetection');

// =============================================================================
// CREAR PACIENTE
// =============================================================================
async function createPatient(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { fullName, dateOfBirth, phone, address, emergencyContact, userId } = req.body;

    // Obtener patient_token del usuario
    const userResult = await pool.query(
      'SELECT patient_token FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const patientToken = userResult.rows[0].patient_token;

    // Cifrar campos PHI (Capa 6)
    const encryptedData = {
      full_name: encrypt(fullName),
      date_of_birth: encrypt(dateOfBirth),
      phone: encrypt(phone || ''),
      address: encrypt(address || ''),
      emergency_contact: encrypt(emergencyContact || ''),
    };

    const result = await pool.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, phone, address,
                             emergency_contact, patient_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, patient_token, created_at`,
      [
        userId,
        encryptedData.full_name,
        encryptedData.date_of_birth,
        encryptedData.phone,
        encryptedData.address,
        encryptedData.emergency_contact,
        patientToken,
      ]
    );

    const patient = result.rows[0];

    // Audit log (Capa 12)
    auditLog({
      userId: req.user.id,
      action: 'CREATE',
      resourceId: patientToken,
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Paciente creado', {
      userId: req.user.id,
      patientToken,
    });

    res.status(201).json({
      message: 'Paciente creado exitosamente',
      patientToken: patient.patient_token,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// OBTENER PACIENTE POR TOKEN
// =============================================================================
async function getPatient(req, res, next) {
  try {
    const { patientToken } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.email, u.role, u.created_at as user_since
       FROM patients p
       JOIN users u ON u.id = p.user_id
       WHERE p.patient_token = $1`,
      [patientToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    const patient = result.rows[0];

    // Detección de acceso masivo (Capa 13)
    await detectMassAccess(req.user.id, patientToken, req.ip);

    // Audit log (Capa 12)
    auditLog({
      userId: req.user.id,
      action: 'READ',
      resourceId: patientToken,
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Descifrar campos PHI (Capa 6)
    const decryptedPatient = {
      patientToken: patient.patient_token,
      email: patient.email,
      role: patient.role,
      fullName: decrypt(patient.full_name),
      dateOfBirth: decrypt(patient.date_of_birth),
      phone: decrypt(patient.phone),
      address: decrypt(patient.address),
      emergencyContact: decrypt(patient.emergency_contact),
      createdAt: patient.created_at,
      updatedAt: patient.updated_at,
    };

    res.json({ patient: decryptedPatient });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// ACTUALIZAR PACIENTE
// =============================================================================
async function updatePatient(req, res, next) {
  try {
    const { patientToken } = req.params;
    const { fullName, dateOfBirth, phone, address, emergencyContact } = req.body;

    // Verificar que existe
    const existing = await pool.query(
      'SELECT id FROM patients WHERE patient_token = $1',
      [patientToken]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    // Construir UPDATE dinámico con campos cifrados
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(encrypt(fullName));
    }
    if (dateOfBirth) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(encrypt(dateOfBirth));
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(encrypt(phone));
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(encrypt(address));
    }
    if (emergencyContact !== undefined) {
      updates.push(`emergency_contact = $${paramIndex++}`);
      values.push(encrypt(emergencyContact));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No hay campos para actualizar',
        code: 'NO_UPDATES',
      });
    }

    updates.push('updated_at = NOW()');
    values.push(patientToken);

    await pool.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE patient_token = $${paramIndex}`,
      values
    );

    auditLog({
      userId: req.user.id,
      action: 'UPDATE',
      resourceId: patientToken,
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Paciente actualizado', {
      userId: req.user.id,
      patientToken,
    });

    res.json({
      message: 'Paciente actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// LISTAR PACIENTES (médicos ven solo los asignados)
// =============================================================================
async function listPatients(req, res, next) {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      // Admin: todos los pacientes
      query = `
        SELECT p.patient_token, u.email, p.created_at
        FROM patients p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `;
      params = [];
    } else if (req.user.role === 'doctor') {
      // Doctor: solo pacientes asignados
      query = `
        SELECT p.patient_token, u.email, p.created_at
        FROM patients p
        JOIN users u ON u.id = p.user_id
        JOIN patient_assignments pa ON pa.patient_token = p.patient_token
        WHERE pa.doctor_id = $1
        ORDER BY p.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Nurse: ver todos pero sin detalle PHI
      query = `
        SELECT p.patient_token, u.email, p.created_at
        FROM patients p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);

    auditLog({
      userId: req.user.id,
      action: 'READ',
      resourceId: 'list',
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      patients: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GDPR DELETE - Derecho al olvido (Capa 14)
// Anonimiza datos en lugar de borrar (mantiene historial clínico anónimo)
// Artículo GDPR: Artículo 17 - Right to erasure
// =============================================================================
async function gdprDelete(req, res, next) {
  try {
    const { patientToken } = req.params;

    // Verificar ownership si es paciente
    if (req.user.role === 'patient' && req.user.patientToken !== patientToken) {
      return res.status(403).json({
        error: 'Solo puedes eliminar tus propios datos',
        code: 'FORBIDDEN',
      });
    }

    const result = await pool.query(
      `SELECT p.id, p.user_id FROM patients p WHERE p.patient_token = $1`,
      [patientToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    const patient = result.rows[0];

    // Anonimizar datos del paciente (no borrar)
    const anonymizedToken = 'anon-' + patientToken.split('-').slice(1).join('-');
    await pool.query(
      `UPDATE patients SET
         full_name = 'ANONYMIZED',
         date_of_birth = 'ANONYMIZED',
         phone = 'ANONYMIZED',
         address = 'ANONYMIZED',
         emergency_contact = 'ANONYMIZED',
         patient_token = $1,
         updated_at = NOW()
       WHERE id = $2`,
      [anonymizedToken, patient.id]
    );

    // Anonimizar expedientes médicos (mantener datos clínicos anónimos)
    await pool.query(
      `UPDATE medical_records SET
         patient_token = $1
       WHERE patient_token = $2`,
      [anonymizedToken, patientToken]
    );

    // Marcar usuario como anonimizado
    await pool.query(
      `UPDATE users SET
         email = $1,
         patient_token = $2,
         consent_revoked_at = NOW()
       WHERE id = $3`,
      [`anon-${patient.user_id}@medsecure.local`, anonymizedToken, patient.user_id]
    );

    // Registrar consentimiento revocado (Capa 14)
    await pool.query(
      `INSERT INTO consent_log (user_id, action, terms_version, ip_address)
       VALUES ($1, 'revoked', 'gdpr-delete', $2)`,
      [patient.user_id, req.ip]
    );

    auditLog({
      userId: req.user.id,
      action: 'GDPR_DELETE',
      resourceId: patientToken,
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('GDPR Delete ejecutado', {
      userId: req.user.id,
      originalToken: patientToken,
    });

    res.json({
      message: 'Datos anonimizados conforme al derecho al olvido (GDPR Art. 17)',
    });
  } catch (err) {
    next(err);
  }
}

async function deletePatient(req, res, next) {
  try {
    const { patientToken } = req.params;

    const existing = await pool.query(
      'SELECT id FROM patients WHERE patient_token = $1',
      [patientToken]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    const patientId = existing.rows[0].id;

    await pool.query(
      `UPDATE patients SET
         full_name = 'ANONIMIZADO',
         date_of_birth = 'ANONIMIZADO',
         phone = NULL,
         address = NULL,
         emergency_contact = NULL,
         updated_at = NOW()
       WHERE id = $1`,
      [patientId]
    );

    auditLog({
      userId: req.user.id,
      action: 'DELETE',
      resourceId: patientToken,
      resourceType: 'patient',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Paciente anonimizado', {
      userId: req.user.id,
      patientToken,
    });

    res.json({
      message: 'Paciente eliminado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPatient,
  getPatient,
  updatePatient,
  listPatients,
  gdprDelete,
  deletePatient,
};
