import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { StatsCard } from '../components/ui/StatsCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { rolePermissions, PermissionDots, PermissionLegend } from '../components/ui/PermissionDots'

interface Patient { patient_token: string; email: string; created_at: string }
interface Record { id: string; diagnosis: string; medications: string; history: string; notes: string; created_at: string }

const roleConfig: Record<string, { bg: string; color: string; icon: string }> = {
  admin:   { bg: '#E1F5EE', color: '#085041', icon: 'shield' },
  doctor:  { bg: '#E6F1FB', color: '#0C447C', icon: 'stethoscope' },
  nurse:   { bg: '#FAEEDA', color: '#633806', icon: 'heart-rate-monitor' },
  patient: { bg: '#F1EFE8', color: '#444441', icon: 'user' },
}

const avBgs = ['#E1F5EE', '#E6F1FB', '#FCEBEB', '#F1EFE8']
const avColors = ['#085041', '#0C447C', '#791F1F', '#444441']
const patientStatuses: Array<{ label: string; bg: string; color: string }> = [
  { label: 'En espera', bg: '#FAEEDA', color: '#633806' },
  { label: 'Atendido', bg: '#EAF3DE', color: '#27500A' },
  { label: 'Urgente', bg: '#FCEBEB', color: '#791F1F' },
  { label: 'Atendido', bg: '#EAF3DE', color: '#27500A' },
]

function initials(email: string) {
  return email.split('@')[0].split(/[._-]/).map(s => s[0]).join('').toUpperCase().slice(0, 2)
}

const roles = ['admin', 'doctor', 'nurse', 'patient'] as const

function PatientDashboard({ user }: { user: any }) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.patientToken) { setLoading(false); return }
    api.get(`/api/records/patient/${user.patientToken}`)
      .then(res => setRecords(res.data.records || []))
      .catch(() => toast.error('Error al cargar tu historial'))
      .finally(() => setLoading(false))
  }, [user?.patientToken])

  return (
    <>
      {/* Bienvenida */}
      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1EFE8', color: '#444441', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '500' }}>
          {initials(user?.email || '')}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c2c2a' }}>Bienvenido, {user?.email?.split('@')[0] || 'Paciente'}</div>
          <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>Panel de diagnósticos — {records.length} registro(s) en tu historial</div>
        </div>
      </div>

      {/* Diagnósticos */}
      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-notes" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Mis Diagnósticos</span>
        </div>
        <div style={{ padding: '14px 18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888780', fontSize: '13px', padding: '24px' }}>
              <i className="ti ti-loader" style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }} aria-hidden="true" />
              Cargando tu historial...
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <i className="ti ti-file-off" style={{ fontSize: '36px', color: '#d3d1c7', display: 'block', marginBottom: '12px' }} aria-hidden="true" />
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#888780' }}>No tienes diagnósticos registrados</div>
              <div style={{ fontSize: '12px', color: '#b0b0ab', marginTop: '4px' }}>Tu médico agregará diagnósticos durante tus consultas</div>
            </div>
          ) : (
            records.map((r, i) => (
              <div key={r.id} style={{ padding: '14px 0', borderBottom: i < records.length - 1 ? '0.5px solid #ebebeb' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-clipboard-text" style={{ fontSize: '14px', color: '#085041' }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#085041' }}>{r.diagnosis || 'Sin diagnóstico'}</span>
                  </div>
                  <Badge variant="info" icon="calendar">{new Date(r.created_at).toLocaleDateString('es-DO')}</Badge>
                </div>
                {r.medications && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '500' }}>Medicamentos:</span>
                    <span style={{ fontSize: '13px', color: '#2c2c2a' }}>{r.medications}</span>
                  </div>
                )}
                {r.notes && (
                  <div style={{ marginTop: '6px', background: '#f5f5f3', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#5f5e5a', lineHeight: 1.5 }}>
                    {r.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function MasterPasswordChange({ user }: { user: any }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Ingresa tu contraseña actual'); return }
    if (!newPassword || newPassword.length < 8) { toast.error('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return }

    setLoading(true)
    try {
      await api.patch(`/api/users/${user.id}`, { password: newPassword })
      toast.success('Contraseña cambiada exitosamente')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  const cardInput: React.CSSProperties = {
    width: '100%', height: '36px', border: '0.5px solid #d3d1c7', borderRadius: '8px',
    padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-crown" style={{ fontSize: '16px', color: '#ffd700' }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>Seguridad de cuenta Master</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Cambia tu contraseña de acceso al sistema</div>
        </div>
      </div>
      <div style={{ padding: '18px', display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px' }}>CONTRASEÑA ACTUAL</label>
          <div style={{ position: 'relative' }}>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" style={cardInput} />
            <i className="ti ti-lock" aria-hidden="true" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#888780' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px' }}>NUEVA CONTRASEÑA</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mín. 8 caracteres" style={cardInput} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px' }}>CONFIRMAR</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite" style={{ ...cardInput, borderColor: confirmPassword && newPassword !== confirmPassword ? '#E24B4A' : '#d3d1c7' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleChangePassword} disabled={loading}
            style={{ height: '36px', padding: '0 18px', borderRadius: '8px', border: 'none', background: loading ? '#555' : '#0F6E56', fontSize: '13px', fontWeight: '500', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className={`ti ti-${loading ? 'loader' : 'key'}`} style={{ fontSize: '15px' }} aria-hidden="true" />
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, setupMFA } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const role = user?.role || 'patient'
  const rc = roleConfig[role]

  useEffect(() => {
    const stored = localStorage.getItem('medsecure_auth')
    if (!stored) { navigate('/login'); return }

    if (user?.role !== 'patient') {
      api.get('/api/patients')
        .then((res) => setPatients(res.data.patients || []))
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('medsecure_auth')
            navigate('/login')
          } else if (err.response?.status === 403) {
            toast.error('No tienes permiso para ver pacientes')
          } else if (err.response?.status === 500) {
            toast.error('Error interno del servidor al cargar pacientes')
          } else {
            toast.error('Error al cargar pacientes. Intenta de nuevo.')
          }
        })
        .finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const perms = rolePermissions[role]

  // Vista para paciente: solo diagnóstico
  if (user?.role === 'patient') {
    return (
      <DashboardLayout title="Mi Salud">
        <PatientDashboard user={user} />
      </DashboardLayout>
    )
  }

  const handleSetupMFA = async () => {
    try {
      const r = await setupMFA()
      if (r.qrCode) {
        const w = window.open('', '_blank', 'width=400,height=520')
        if (w) w.document.write(`
          <html><head><style>
            body{display:flex;flex-direction:column;align-items:center;padding:40px;font-family:-apple-system,sans-serif;background:#f5f5f3}
            h2{font-size:16px;color:#2c2c2a;font-weight:500;margin-bottom:20px}
            img{width:250px;height:250px;border:0.5px solid #d3d1c7;border-radius:12px;padding:12px;background:#fff}
            .s{background:#fff;border:0.5px dashed #d3d1c7;border-radius:8px;padding:8px 16px;font-size:13px;color:#888780;margin-top:20px;font-family:monospace}
          </style></head><body>
            <h2>Escanea con Google Authenticator</h2>
            <img src="${r.qrCode}" />
            <div class="s">${r.secret || 'Código en QR'}</div>
          </body></html>`)
      }
      toast.success('MFA configurado')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al configurar MFA') }
  }

  return (
    <DashboardLayout title="Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <StatsCard label="Pacientes hoy" value={patients.length > 0 ? patients.length : '—'} sub="Registrados en el sistema" icon="users" iconColor="#0F6E56" />
        <StatsCard label="Citas pendientes" value="8" sub="Próxima en 20 min" icon="calendar" iconColor="#0C447C" />
        <StatsCard label="Alertas clínicas" value="2" sub="Requieren atención" icon="alert-triangle" iconColor="#633806" />
        <StatsCard label="Expedientes vistos" value="61" sub="Este mes" icon="file-text" iconColor="#444441" />
      </div>

      {!user?.mfaEnabled ? (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAEEDA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '15px', color: '#633806' }} aria-hidden="true" />
            <span style={{ fontSize: '13px', color: '#633806', fontWeight: '500' }}>Autenticación de dos factores pendiente</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/mfa-setup')}>Configurar 2FA</Button>
        </div>
      ) : (
        <div style={{ background: '#E1F5EE', border: '0.5px solid #E1F5EE', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-shield-heart" style={{ fontSize: '15px', color: '#0F6E56' }} aria-hidden="true" />
            <span style={{ fontSize: '13px', color: '#085041', fontWeight: '500' }}>2FA activo — cuenta segura</span>
          </div>
          <Badge variant="success" icon="check">Verificado</Badge>
        </div>
      )}

      {/* Master: cambiar contraseña propia */}
      {role === 'master' && <MasterPasswordChange user={user} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Pacientes Recientes</span>
            <button onClick={() => navigate('/patients')} style={{ fontSize: '11px', color: '#0F6E56', background: 'none', border: 'none', cursor: 'pointer' }}>Ver todos</button>
          </div>
          <div style={{ padding: '10px 16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888780', fontSize: '13px', padding: '16px' }}>Cargando...</div>
            ) : patients.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888780', fontSize: '13px', padding: '16px' }}>No hay pacientes registrados</div>
            ) : (
              patients.slice(0, 4).map((p, i) => {
                const st = patientStatuses[i % patientStatuses.length]
                return (
                  <div key={p.patient_token} onClick={() => navigate(`/patients/${p.patient_token}`)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 3 ? '0.5px solid #ebebeb' : 'none', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f3' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avBgs[i % avBgs.length], color: avColors[i % avColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', flexShrink: 0 }}>
                      {initials(p.email)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                      <div style={{ fontSize: '11px', color: '#888780' }}>Token: {p.patient_token.slice(0, 8)}...</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Permisos por Rol</span>
          </div>
          <div style={{ padding: '10px 16px' }}>
            {roles.map((r) => {
              const cfg = roleConfig[r]
              const p = rolePermissions[r]
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #ebebeb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`ti ti-${cfg.icon}`} style={{ fontSize: '13px', color: cfg.color }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a', textTransform: 'capitalize' }}>{r}</span>
                  </div>
                  <PermissionDots permissions={p} />
                </div>
              )
            })}
            <PermissionLegend permissions={perms} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
