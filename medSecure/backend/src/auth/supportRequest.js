const emailService = require('../utils/emailService')
const { pool } = require('../config/database')

exports.submitSupportRequest = async (req, res) => {
  const {
    userEmail,
    userName,
    requestType,
    reason,
    additionalInfo
  } = req.body

  // Validaciones
  if (!userEmail || !requestType || !reason) {
    return res.status(400).json({
      message: 'Correo, tipo de solicitud y motivo son obligatorios'
    })
  }

  const validTypes = [
    'Cambio de contraseña',
    'Cambio de correo',
    'Recuperar cuenta bloqueada',
    'Problema con autenticación 2FA',
    'Otro'
  ]
  if (!validTypes.includes(requestType)) {
    return res.status(400).json({ message: 'Tipo de solicitud no válido' })
  }

  if (reason.trim().length < 20) {
    return res.status(400).json({
      message: 'El motivo debe tener al menos 20 caracteres'
    })
  }

  try {
    // Buscar si el usuario existe en el sistema
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [userEmail]
    )
    const userId = userResult.rows[0]?.id || null
    const resolvedName = userName ||
                         userResult.rows[0]?.name ||
                         'No proporcionado'

    // Guardar la solicitud en BD para trazabilidad
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        user_id UUID,
        request_type VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        additional_info TEXT,
        ip_address VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await pool.query(`
      INSERT INTO support_requests
        (user_email, user_name, user_id, request_type,
         reason, additional_info, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userEmail, resolvedName, userId,
      requestType, reason, additionalInfo || null, req.ip
    ])

    // Enviar email a soporte
    await emailService.sendPasswordResetRequest({
      userName: resolvedName,
      userEmail,
      userId,
      reason,
      requestType,
      additionalInfo,
      submittedAt: new Date().toLocaleString('es-DO', {
        timeZone: 'America/Santo_Domingo',
        dateStyle: 'full',
        timeStyle: 'short'
      }),
      ipAddress: req.ip
    })

    res.json({
      message: 'Solicitud enviada correctamente. El equipo de soporte te contactará pronto.',
      ticket: `TKT-${Date.now()}`
    })

  } catch (error) {
    console.error('Support request error:', error)
    if (error.message?.includes('SMTP') ||
        error.message?.includes('auth') ||
        error.code === 'EAUTH') {
      return res.status(500).json({
        message: 'Error al enviar el correo. Verifica la configuración SMTP.'
      })
    }
    res.status(500).json({
      message: 'Error al procesar la solicitud. Intenta de nuevo.'
    })
  }
}
