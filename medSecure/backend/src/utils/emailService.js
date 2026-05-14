const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verifica conexión al iniciar
transporter.verify((error) => {
  if (error) {
    console.error('Email service error:', error.message)
  } else {
    console.log('Email service ready')
  }
})

exports.sendPasswordResetRequest = async ({
  userName,
  userEmail,
  userId,
  reason,
  requestType,
  additionalInfo,
  submittedAt,
  ipAddress
}) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f3;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 0.5px solid #d3d1c7;
      overflow: hidden;
    }
    .header {
      background: #0F6E56;
      padding: 24px 28px;
      display: flex;
      align-items: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }
    .header p {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      margin: 4px 0 0 0;
    }
    .alert-banner {
      background: #FAEEDA;
      border-bottom: 0.5px solid #e8c97a;
      padding: 12px 28px;
      font-size: 13px;
      color: #633806;
    }
    .body {
      padding: 28px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 500;
      color: #888780;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 12px;
      margin-top: 20px;
      padding-bottom: 6px;
      border-bottom: 0.5px solid #ebebeb;
    }
    .section-title:first-child { margin-top: 0; }
    .field {
      margin-bottom: 10px;
    }
    .field-label {
      font-size: 11px;
      color: #888780;
      margin-bottom: 3px;
    }
    .field-value {
      font-size: 14px;
      color: #2c2c2a;
      font-weight: 500;
    }
    .field-box {
      background: #f5f5f3;
      border: 0.5px solid #d3d1c7;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 14px;
      color: #2c2c2a;
      line-height: 1.6;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-warning {
      background: #FAEEDA;
      color: #633806;
    }
    .badge-info {
      background: #E6F1FB;
      color: #0C447C;
    }
    .footer {
      background: #f9f9f7;
      border-top: 0.5px solid #ebebeb;
      padding: 16px 28px;
      font-size: 12px;
      color: #888780;
    }
    .action-box {
      background: #E1F5EE;
      border: 0.5px solid #8ab87e;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 16px;
    }
    .action-box p {
      margin: 0;
      font-size: 13px;
      color: #085041;
      font-weight: 500;
    }
    .action-box ul {
      margin: 8px 0 0 0;
      padding-left: 18px;
      font-size: 13px;
      color: #085041;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🔐 Solicitud de recuperación de cuenta</h1>
        <p>MedSecure — Sistema Clínico Seguro</p>
      </div>
    </div>

    <div class="alert-banner">
      ⚠️ Un usuario requiere asistencia de soporte para acceder a su cuenta
    </div>

    <div class="body">

      <div class="section-title">Información del solicitante</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">NOMBRE COMPLETO</div>
          <div class="field-value">${userName || 'No proporcionado'}</div>
        </div>
        <div class="field">
          <div class="field-label">CORREO ELECTRÓNICO</div>
          <div class="field-value">${userEmail}</div>
        </div>
        <div class="field">
          <div class="field-label">ID DE USUARIO</div>
          <div class="field-value">${userId || 'No registrado'}</div>
        </div>
        <div class="field">
          <div class="field-label">TIPO DE SOLICITUD</div>
          <span class="badge badge-warning">${requestType}</span>
        </div>
      </div>

      <div class="section-title">Motivo de la solicitud</div>
      <div class="field-box">${reason}</div>

      ${additionalInfo ? `
      <div class="section-title">Información adicional</div>
      <div class="field-box">${additionalInfo}</div>
      ` : ''}

      <div class="section-title">Datos técnicos</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">FECHA Y HORA</div>
          <div class="field-value">${submittedAt}</div>
        </div>
        <div class="field">
          <div class="field-label">IP DE ORIGEN</div>
          <div class="field-value">${ipAddress || 'No disponible'}</div>
        </div>
      </div>

      <div class="action-box">
        <p>✅ Acciones requeridas por el equipo de soporte:</p>
        <ul>
          <li>Verificar la identidad del solicitante antes de proceder</li>
          <li>Contactar al usuario al correo: <strong>${userEmail}</strong></li>
          <li>Registrar la acción tomada en el sistema de auditoría</li>
          ${requestType === 'Cambio de contraseña'
            ? '<li>Generar contraseña temporal y enviarla de forma segura</li>'
            : ''}
          ${requestType === 'Cambio de correo'
            ? '<li>Verificar el nuevo correo con documento de identidad</li>'
            : ''}
          ${requestType === 'Recuperar cuenta bloqueada'
            ? '<li>Revisar los logs de intentos fallidos antes de desbloquear</li>'
            : ''}
        </ul>
      </div>

    </div>

    <div class="footer">
      Este mensaje fue generado automáticamente por MedSecure.
      No responder a este correo — contactar directamente al usuario.
      · Ticket generado: ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SUPPORT_EMAIL,
    subject: `[MedSecure] Solicitud de soporte — ${requestType} — ${userEmail}`,
    html,
    replyTo: userEmail,
  })
}
