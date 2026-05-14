import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'

type Step = 1 | 2 | 3

const REQUEST_TYPES = [
  {
    value: 'Cambio de contraseña',
    icon: 'lock',
    desc: 'No recuerdo mi contraseña actual'
  },
  {
    value: 'Cambio de correo',
    icon: 'mail',
    desc: 'Necesito cambiar mi correo de acceso'
  },
  {
    value: 'Recuperar cuenta bloqueada',
    icon: 'lock-open',
    desc: 'Mi cuenta fue bloqueada por intentos fallidos'
  },
  {
    value: 'Problema con autenticación 2FA',
    icon: 'device-mobile',
    desc: 'Perdí acceso a mi autenticador'
  },
  {
    value: 'Otro',
    icon: 'help-circle',
    desc: 'Otro tipo de problema con mi cuenta'
  },
]

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState('')

  const [form, setForm] = useState({
    userEmail: '',
    userName: '',
    requestType: '',
    reason: '',
    additionalInfo: '',
    confirmEmail: ''
  })

  const updateForm = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const validateStep1 = () => {
    if (!form.userEmail) return 'El correo es obligatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail)) {
      return 'Ingresa un correo válido'
    }
    if (form.userEmail !== form.confirmEmail) {
      return 'Los correos no coinciden'
    }
    if (!form.requestType) return 'Selecciona el tipo de solicitud'
    return null
  }

  const validateStep2 = () => {
    if (!form.reason || form.reason.trim().length < 20) {
      return 'El motivo debe tener al menos 20 caracteres'
    }
    return null
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/support-request', {
        userEmail: form.userEmail,
        userName: form.userName,
        requestType: form.requestType,
        reason: form.reason,
        additionalInfo: form.additionalInfo
      })
      setTicket(res.data.ticket || 'TKT-SOPORTE')
      setStep(3)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Error al enviar la solicitud. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px',
    border: '0.5px solid #d3d1c7', borderRadius: '8px',
    padding: '0 12px', fontSize: '14px', color: '#2c2c2a',
    background: '#fff', outline: 'none', fontFamily: 'inherit'
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '500',
    color: '#888780', letterSpacing: '0.04em',
    textTransform: 'uppercase' as const, marginBottom: '6px'
  }
  const stepCircle = (n: number, current: number) => ({
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center' as const,
    justifyContent: 'center' as const, fontSize: '12px',
    fontWeight: '500' as const, flexShrink: 0,
    background: n < current ? '#0F6E56'
              : n === current ? '#E1F5EE' : '#f1efe8',
    color: n < current ? '#fff'
         : n === current ? '#085041' : '#888780',
    border: n === current ? '1.5px solid #0F6E56' : 'none'
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f5f3',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '60px 20px 40px'
    }}>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '10px', marginBottom: '32px'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: '#0F6E56', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <i className="ti ti-shield-heart"
            style={{ fontSize: '20px', color: '#fff' }}
            aria-hidden="true" />
        </div>
        <div>
          <div style={{
            fontSize: '16px', fontWeight: '500', color: '#2c2c2a'
          }}>MedSecure</div>
          <div style={{
            fontSize: '10px', color: '#888780',
            letterSpacing: '0.05em'
          }}>RECUPERACIÓN DE CUENTA</div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '8px', marginBottom: '24px'
      }}>
        {[
          { n: 1, label: 'Identificación' },
          { n: 2, label: 'Motivo' },
          { n: 3, label: 'Confirmación' }
        ].map(({ n, label }, i) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <div style={stepCircle(n, step)}>
                {n < step
                  ? <i className="ti ti-check"
                      style={{ fontSize: '13px' }}
                      aria-hidden="true" />
                  : n}
              </div>
              <span style={{
                fontSize: '12px', fontWeight: '500',
                color: n === step ? '#085041'
                     : n < step ? '#0F6E56' : '#888780'
              }}>{label}</span>
            </div>
            {i < 2 && (
              <div style={{
                width: '40px', height: '0.5px',
                background: n < step ? '#0F6E56' : '#d3d1c7'
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff', border: '0.5px solid #d3d1c7',
        borderRadius: '12px', width: '100%', maxWidth: '480px',
        overflow: 'hidden'
      }}>

        {step === 1 && (
          <>
            <div style={{
              padding: '20px 24px', borderBottom: '0.5px solid #ebebeb'
            }}>
              <div style={{
                fontSize: '16px', fontWeight: '500', color: '#2c2c2a'
              }}>
                Identificación del solicitante
              </div>
              <div style={{
                fontSize: '13px', color: '#888780', marginTop: '4px'
              }}>
                Ingresa tu correo y el tipo de problema
              </div>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>

              <div>
                <label style={labelStyle}>
                  NOMBRE COMPLETO (opcional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.userName}
                    onChange={e => updateForm('userName', e.target.value)}
                    placeholder="Tu nombre completo"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                  />
                  <i className="ti ti-user" aria-hidden="true"
                    style={{
                      position: 'absolute', right: '10px',
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: '15px', color: '#888780'
                    }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  CORREO ELECTRÓNICO <span style={{ color: '#E24B4A' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={form.userEmail}
                    onChange={e => updateForm('userEmail', e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                  />
                  <i className="ti ti-mail" aria-hidden="true"
                    style={{
                      position: 'absolute', right: '10px',
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: '15px', color: '#888780'
                    }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  CONFIRMAR CORREO <span style={{ color: '#E24B4A' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={form.confirmEmail}
                    onChange={e => updateForm('confirmEmail', e.target.value)}
                    placeholder="Repite tu correo"
                    style={{
                      ...inputStyle, paddingRight: '36px',
                      borderColor: form.confirmEmail
                        ? form.userEmail === form.confirmEmail
                          ? '#0F6E56' : '#E24B4A'
                        : '#d3d1c7'
                    }}
                  />
                  <i className={`ti ti-${
                    !form.confirmEmail ? 'mail'
                    : form.userEmail === form.confirmEmail
                      ? 'check' : 'x'
                  }`} aria-hidden="true"
                    style={{
                      position: 'absolute', right: '10px',
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: '15px',
                      color: !form.confirmEmail ? '#888780'
                        : form.userEmail === form.confirmEmail
                          ? '#0F6E56' : '#E24B4A'
                    }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  TIPO DE SOLICITUD <span style={{ color: '#E24B4A' }}>*</span>
                </label>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {REQUEST_TYPES.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => updateForm('requestType', rt.value)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: '12px', padding: '12px 14px',
                        borderRadius: '8px', cursor: 'pointer',
                        textAlign: 'left',
                        border: form.requestType === rt.value
                          ? '1.5px solid #0F6E56'
                          : '0.5px solid #d3d1c7',
                        background: form.requestType === rt.value
                          ? '#E1F5EE' : '#fff',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: form.requestType === rt.value
                          ? '#0F6E56' : '#f5f5f3',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0
                      }}>
                        <i className={`ti ti-${rt.icon}`}
                          aria-hidden="true"
                          style={{
                            fontSize: '18px',
                            color: form.requestType === rt.value
                              ? '#fff' : '#888780'
                          }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: '500',
                          color: form.requestType === rt.value
                            ? '#085041' : '#2c2c2a'
                        }}>
                          {rt.value}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: form.requestType === rt.value
                            ? '#0F6E56' : '#888780',
                          marginTop: '2px'
                        }}>
                          {rt.desc}
                        </div>
                      </div>
                      {form.requestType === rt.value && (
                        <i className="ti ti-check"
                          aria-hidden="true"
                          style={{ fontSize: '16px', color: '#0F6E56' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{
              padding: '20px 24px', borderBottom: '0.5px solid #ebebeb'
            }}>
              <div style={{
                fontSize: '16px', fontWeight: '500', color: '#2c2c2a'
              }}>
                Describe tu situación
              </div>
              <div style={{
                fontSize: '13px', color: '#888780', marginTop: '4px'
              }}>
                Mientras más detalles des, más rápido podemos ayudarte
              </div>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>

              <div style={{
                background: '#f5f5f3', borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <i className="ti ti-info-circle"
                  aria-hidden="true"
                  style={{ fontSize: '16px', color: '#0F6E56', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#888780' }}>
                    Tipo de solicitud
                  </div>
                  <div style={{
                    fontSize: '13px', fontWeight: '500', color: '#2c2c2a'
                  }}>
                    {form.requestType}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888780' }}>
                    {form.userEmail}
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  MOTIVO DETALLADO <span style={{ color: '#E24B4A' }}>*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => updateForm('reason', e.target.value)}
                  placeholder={
                    form.requestType === 'Cambio de contraseña'
                      ? 'Ej: Olvidé mi contraseña y no puedo acceder desde hace 2 días...'
                    : form.requestType === 'Recuperar cuenta bloqueada'
                      ? 'Ej: Intenté acceder varias veces y mi cuenta fue bloqueada...'
                    : form.requestType === 'Problema con autenticación 2FA'
                      ? 'Ej: Cambié de teléfono y perdí acceso a Google Authenticator...'
                    : 'Describe detalladamente tu problema...'
                  }
                  rows={5}
                  style={{
                    ...inputStyle, height: 'auto',
                    padding: '10px 12px', resize: 'none'
                  }}
                />
                <div style={{
                  fontSize: '11px', color: '#888780',
                  marginTop: '4px', textAlign: 'right'
                }}>
                  {form.reason.length} / mínimo 20 caracteres
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  INFORMACIÓN ADICIONAL (opcional)
                </label>
                <textarea
                  value={form.additionalInfo}
                  onChange={e => updateForm('additionalInfo', e.target.value)}
                  placeholder="Último acceso exitoso, dispositivo que usabas, cualquier dato relevante..."
                  rows={3}
                  style={{
                    ...inputStyle, height: 'auto', padding: '10px 12px',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{
                background: '#f5f5f3', border: '0.5px solid #d3d1c7',
                borderRadius: '8px', padding: '12px 14px',
                fontSize: '12px', color: '#888780', lineHeight: '1.6'
              }}>
                <i className="ti ti-shield-lock"
                  aria-hidden="true"
                  style={{
                    fontSize: '14px', color: '#0F6E56',
                    marginRight: '6px'
                  }} />
                Tu información será enviada de forma segura al equipo de soporte.
                Solo se usará para resolver tu solicitud y se elimina tras 90 días.
              </div>

            </div>
          </>
        )}

        {step === 3 && !ticket && (
          <>
            <div style={{
              padding: '20px 24px', borderBottom: '0.5px solid #ebebeb'
            }}>
              <div style={{
                fontSize: '16px', fontWeight: '500', color: '#2c2c2a'
              }}>
                Confirmar y enviar
              </div>
              <div style={{
                fontSize: '13px', color: '#888780', marginTop: '4px'
              }}>
                Revisa los datos antes de enviar tu solicitud
              </div>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '14px' }}>

              {[
                { label: 'CORREO', value: form.userEmail },
                { label: 'NOMBRE', value: form.userName || 'No proporcionado' },
                { label: 'TIPO', value: form.requestType },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', padding: '10px 0',
                  borderBottom: '0.5px solid #ebebeb'
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '500',
                    color: '#888780', letterSpacing: '0.04em'
                  }}>{item.label}</span>
                  <span style={{
                    fontSize: '13px', color: '#2c2c2a',
                    fontWeight: '500', textAlign: 'right',
                    maxWidth: '60%'
                  }}>{item.value}</span>
                </div>
              ))}

              <div>
                <div style={{
                  fontSize: '11px', fontWeight: '500',
                  color: '#888780', letterSpacing: '0.04em',
                  marginBottom: '6px'
                }}>MOTIVO</div>
                <div style={{
                  background: '#f5f5f3', borderRadius: '8px',
                  padding: '10px 12px', fontSize: '13px',
                  color: '#2c2c2a', lineHeight: '1.6'
                }}>
                  {form.reason}
                </div>
              </div>

              {form.additionalInfo && (
                <div>
                  <div style={{
                    fontSize: '11px', fontWeight: '500',
                    color: '#888780', letterSpacing: '0.04em',
                    marginBottom: '6px'
                  }}>INFORMACIÓN ADICIONAL</div>
                  <div style={{
                    background: '#f5f5f3', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '13px',
                    color: '#2c2c2a', lineHeight: '1.6'
                  }}>
                    {form.additionalInfo}
                  </div>
                </div>
              )}

              <div style={{
                background: '#FAEEDA', border: '0.5px solid #e8c97a',
                borderRadius: '8px', padding: '12px 14px',
                fontSize: '13px', color: '#633806',
                display: 'flex', alignItems: 'flex-start', gap: '8px'
              }}>
                <i className="ti ti-alert-triangle"
                  aria-hidden="true"
                  style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Al enviar esta solicitud, el equipo de soporte recibirá
                  tu información y te contactará a <strong>{form.userEmail}</strong> en
                  un plazo de 24-48 horas hábiles.
                </span>
              </div>

            </div>
          </>
        )}

        {ticket && (
          <div style={{
            padding: '40px 24px', textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#E1F5EE', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="ti ti-check"
                aria-hidden="true"
                style={{ fontSize: '32px', color: '#0F6E56' }} />
            </div>
            <div style={{
              fontSize: '18px', fontWeight: '500',
              color: '#2c2c2a', marginBottom: '8px'
            }}>
              Solicitud enviada
            </div>
            <div style={{
              fontSize: '14px', color: '#888780',
              lineHeight: '1.6', marginBottom: '20px'
            }}>
              Tu solicitud fue recibida. El equipo de soporte
              revisará tu caso y te contactará a
              <strong style={{ color: '#2c2c2a' }}> {form.userEmail}</strong>
              {' '}en 24-48 horas hábiles.
            </div>
            <div style={{
              background: '#f5f5f3', border: '0.5px dashed #d3d1c7',
              borderRadius: '8px', padding: '12px 16px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '11px', color: '#888780',
                letterSpacing: '0.04em', marginBottom: '4px'
              }}>
                NÚMERO DE TICKET
              </div>
              <div style={{
                fontSize: '16px', fontWeight: '500',
                color: '#0F6E56', fontFamily: 'monospace'
              }}>
                {ticket}
              </div>
              <div style={{
                fontSize: '11px', color: '#888780', marginTop: '4px'
              }}>
                Guarda este número para dar seguimiento
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#0F6E56', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '0 24px', height: '40px',
                fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', width: '100%'
              }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {error && (
          <div style={{
            margin: '0 24px 16px',
            background: '#FCEBEB', border: '0.5px solid #f09595',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', color: '#791F1F',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <i className="ti ti-alert-circle"
              aria-hidden="true"
              style={{ fontSize: '15px', flexShrink: 0 }} />
            {error}
          </div>
        )}

        {!ticket && (
          <div style={{
            padding: '14px 24px',
            borderTop: '0.5px solid #ebebeb',
            display: 'flex', justifyContent: 'space-between',
            background: '#f9f9f7'
          }}>
            <button
              onClick={() => {
                if (step === 1) navigate('/login')
                else setStep((step - 1) as Step)
              }}
              style={{
                height: '38px', padding: '0 16px',
                borderRadius: '8px', border: '0.5px solid #d3d1c7',
                background: '#fff', fontSize: '13px',
                cursor: 'pointer', color: '#444441',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <i className="ti ti-arrow-left"
                aria-hidden="true"
                style={{ fontSize: '15px' }} />
              {step === 1 ? 'Volver al login' : 'Anterior'}
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  height: '38px', padding: '0 20px',
                  borderRadius: '8px', border: 'none',
                  background: '#0F6E56', fontSize: '13px',
                  fontWeight: '500', color: '#fff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Continuar
                <i className="ti ti-arrow-right"
                  aria-hidden="true"
                  style={{ fontSize: '15px' }} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  height: '38px', padding: '0 20px',
                  borderRadius: '8px', border: 'none',
                  background: loading ? '#7ab5a8' : '#0F6E56',
                  fontSize: '13px', fontWeight: '500',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <i className={`ti ti-${loading ? 'loader' : 'send'}`}
                  aria-hidden="true"
                  style={{ fontSize: '15px' }} />
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
