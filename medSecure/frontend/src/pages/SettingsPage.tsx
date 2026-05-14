import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { Badge, RoleChip } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

type Tab = 'profile' | 'security' | 'roles'

const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string }>>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Password change
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' })
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.new !== pwdForm.confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (pwdForm.new.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setPwdLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.new,
      })
      toast.success('Contraseña actualizada')
      setShowPwdModal(false); setPwdForm({ current: '', new: '', confirm: '' })
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al cambiar contraseña') }
    finally { setPwdLoading(false) }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingRoles(true)
    try {
      await api.patch(`/api/users/${userId}`, { role: newRole })
      toast.success('Rol actualizado')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al actualizar rol') }
    finally { setLoadingRoles(false) }
  }

  useEffect(() => {
    if (tab === 'roles' && user?.role === 'admin') {
      api.get('/api/users').then(r => setUsers(r.data.users || [])).catch(() => toast.error('Error al cargar usuarios'))
    }
  }, [tab, user])

  const tabs: Array<{ key: Tab; label: string; icon: string }> = [
    { key: 'profile', label: 'Mi perfil', icon: 'user' },
    { key: 'security', label: 'Seguridad', icon: 'shield' },
    ...(user?.role === 'admin' ? [{ key: 'roles' as Tab, label: 'Control de roles', icon: 'users' }] : []),
  ]

  return (
    <DashboardLayout title="Configuración">
      <div style={{ maxWidth: '720px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px', fontSize: '13px', borderRadius: '8px', border: 'none',
                background: tab === t.key ? '#E1F5EE' : 'transparent',
                color: tab === t.key ? '#085041' : '#5f5e5a',
                cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <i className={`ti ti-${t.icon}`} style={{ fontSize: '14px' }} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-user" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Mi perfil</span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <div style={{ fontSize: '13px', color: '#2c2c2a', padding: '0 12px', height: '38px', display: 'flex', alignItems: 'center', border: '0.5px solid #ebebeb', borderRadius: '8px', background: '#fafaf8' }}>
                    {user?.email?.split('@')[0] || '—'}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <div style={{ fontSize: '13px', color: '#2c2c2a', padding: '0 12px', height: '38px', display: 'flex', alignItems: 'center', border: '0.5px solid #ebebeb', borderRadius: '8px', background: '#fafaf8' }}>
                    {user?.email || '—'}
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <div>{user?.role ? <RoleChip role={user.role} /> : '—'}</div>
              </div>
              <div style={{ borderTop: '0.5px solid #ebebeb', paddingTop: '14px' }}>
                <Button variant="outline" icon="lock" onClick={() => setShowPwdModal(true)}>Cambiar contraseña</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-shield" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Seguridad</span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a' }}>Autenticación de dos factores (2FA)</div>
                  <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px' }}>Añade una capa extra de seguridad a tu cuenta</div>
                </div>
                {user?.mfaEnabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="success" icon="check">Activo</Badge>
                    <Button variant="danger" size="sm" onClick={() => toast('Función próximamente', { icon: '🚧' })}>Desactivar</Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => navigate('/settings/mfa-setup')}>Configurar MFA</Button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'roles' && user?.role === 'admin' && (
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-users" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Control de roles</span>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 140px 80px', gap: '12px', fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              <span>Usuario</span>
              <span>Email</span>
              <span>Rol</span>
              <span></span>
            </div>
            {users.map(u => (
              <div key={u.id} style={{ padding: '10px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 140px 80px', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#2c2c2a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E1F5EE', color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500' }}>
                    {u.email.slice(0, 2).toUpperCase()}
                  </div>
                  {u.email.split('@')[0]}
                </div>
                <div>{u.email}</div>
                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  style={{ width: '100%', height: '32px', border: '0.5px solid #d3d1c7', borderRadius: '6px', padding: '0 8px', fontSize: '12px', color: '#2c2c2a', background: '#fff', outline: 'none', cursor: 'pointer' }}>
                  <option value="patient">Paciente</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Enfermero</option>
                  <option value="admin">Admin</option>
                </select>
                <div style={{ fontSize: '10px', color: '#888780' }}>{loadingRoles ? '...' : 'Guardado'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PASSWORD MODAL */}
      {showPwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '24px', width: '380px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#2c2c2a', marginBottom: '16px' }}>Cambiar contraseña</h2>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Contraseña actual</label>
                <input type="password" value={pwdForm.current} onChange={(e) => setPwdForm(p => ({ ...p, current: e.target.value }))} required
                  style={{ width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Nueva contraseña</label>
                <input type="password" value={pwdForm.new} onChange={(e) => setPwdForm(p => ({ ...p, new: e.target.value }))} required minLength={6}
                  style={{ width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar nueva contraseña</label>
                <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm(p => ({ ...p, confirm: e.target.value }))} required minLength={6}
                  style={{ width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <Button variant="outline" type="button" onClick={() => setShowPwdModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={pwdLoading} style={{ opacity: pwdLoading ? 0.6 : 1 }}>{pwdLoading ? 'Cambiando...' : 'Cambiar contraseña'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
