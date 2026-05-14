import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../hooks/useAuth'

const roleColors: Record<string, { bg: string; color: string; label: string }> = {
  master:  { bg: '#2c2c2a', color: '#ffffff', label: 'Master' },
  admin:   { bg: '#E1F5EE', color: '#085041', label: 'Administrador' },
  doctor:  { bg: '#E6F1FB', color: '#0C447C', label: 'Médico' },
  nurse:   { bg: '#FAEEDA', color: '#633806', label: 'Enfermero' },
  patient: { bg: '#F1EFE8', color: '#444441', label: 'Paciente' },
}

const roleIcons: Record<string, string> = {
  master: 'crown', admin: 'shield', doctor: 'stethoscope',
  nurse: 'heart-rate-monitor', patient: 'user',
}

export default function Users() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState<any>({ open: false, user: null })
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'doctor', specialty: '', phone: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users')
      setUsers(res.data.users || [])
    } catch (err) {
      console.error('Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setFormError('')
    setFormSuccess('')

    if (!form.name || !form.email || !form.role) {
      setFormError('Nombre, correo y rol son obligatorios')
      return
    }
    if (!editUser && !form.password) {
      setFormError('La contraseña es obligatoria')
      return
    }
    if (!editUser && form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    if (!editUser && form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setFormLoading(true)
    try {
      if (editUser) {
        const body: any = {
          name: form.name, email: form.email,
          specialty: form.specialty, phone: form.phone,
        }
        if (form.password) body.password = form.password
        await api.patch(`/api/users/${editUser.id}`, body)
        await api.patch(`/api/users/${editUser.id}/role`, { role: form.role })
        setFormSuccess('Usuario actualizado correctamente')
      } else {
        await api.post('/api/users', form)
        setFormSuccess('Usuario creado correctamente')
      }
      fetchUsers()
      setTimeout(() => {
        setShowForm(false)
        setEditUser(null)
        setForm({ name: '', email: '', password: '', confirmPassword: '',
                  role: 'doctor', specialty: '', phone: '' })
        setFormSuccess('')
      }, 1500)
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (user: any) => {
    try {
      await api.patch(`/api/users/${user.id}/toggle`)
      fetchUsers()
    } catch (err) {
      alert('Error al cambiar estado del usuario')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/users/${deleteModal.user.id}`)
      setUsers((prev: any) => prev.filter((u: any) => u.id !== deleteModal.user.id))
      setDeleteModal({ open: false, user: null })
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const openEdit = (user: any) => {
    setEditUser(user)
    setForm({
      name: user.name || '',
      email: user.email,
      password: '', confirmPassword: '',
      role: user.role,
      specialty: user.specialty || '',
      phone: user.phone || '',
    })
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  const filtered = users.filter((u: any) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const inputBase = {
    width: '100%', height: '38px',
    border: '0.5px solid #d3d1c7', borderRadius: '8px',
    padding: '0 36px 0 12px', fontSize: '13px',
    color: '#2c2c2a', background: '#fff', outline: 'none',
    fontFamily: 'inherit' as const,
  }

  const labelBase = {
    display: 'block' as const, fontSize: '11px', fontWeight: '500' as const,
    color: '#888780', letterSpacing: '0.04em',
    textTransform: 'uppercase' as const, marginBottom: '5px',
  }

  const iconPos = {
    position: 'absolute' as const, right: '10px', top: '50%',
    transform: 'translateY(-50%)', fontSize: '15px', color: '#888780',
  }

  return (
    <DashboardLayout title="Usuarios">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>Gestión de Usuarios</div>
          <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>{users.length} usuarios registrados en el sistema</div>
        </div>
        {currentUser?.role === 'master' && (
          <button onClick={() => {
            setEditUser(null)
            setForm({ name: '', email: '', password: '', confirmPassword: '',
                      role: 'doctor', specialty: '', phone: '' })
            setFormError('')
            setFormSuccess('')
            setShowForm(true)
          }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', height: '38px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            <i className="ti ti-user-plus" style={{ fontSize: '16px' }} aria-hidden="true" />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <input placeholder="Buscar por nombre o correo..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputBase, padding: '0 12px 0 34px' }} />
          <i className="ti ti-search" aria-hidden="true" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#888780' }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ height: '36px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="all">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="doctor">Médico</option>
          <option value="nurse">Enfermero</option>
          <option value="patient">Paciente</option>
        </select>
      </div>

      {/* Banner de Master */}
      {currentUser?.role === 'master' && (
        <div style={{ background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-crown" style={{ fontSize: '18px', color: '#ffd700' }} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Modo Master</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Tienes control total del sistema. Puedes eliminar usuarios y gestionar todos los aspectos.</div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 120px', padding: '10px 16px', borderBottom: '0.5px solid #ebebeb', background: '#f9f9f7', fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em' }}>
          <span>USUARIO</span>
          <span>CORREO</span>
          <span>ROL</span>
          <span>ESTADO</span>
          <span>MFA</span>
          <span>ACCIONES</span>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>Cargando usuarios...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>No se encontraron usuarios</div>
        ) : filtered.map((user: any) => {
          const rc = roleColors[user.role] || roleColors.patient
          return (
            <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 120px', padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: rc.bg, color: rc.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
                  {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a' }}>{user.name}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#5f5e5a' }}>{user.email}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '500', background: rc.bg, color: rc.color, width: 'fit-content' }}>
                <i className={`ti ti-${roleIcons[user.role] || 'user'}`} style={{ fontSize: '11px' }} aria-hidden="true" />
                {rc.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '500', background: user.is_active ? '#EAF3DE' : '#F1EFE8', color: user.is_active ? '#27500A' : '#888780', width: 'fit-content' }}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '500', background: user.mfa_enabled ? '#E1F5EE' : '#F1EFE8', color: user.mfa_enabled ? '#085041' : '#888780', width: 'fit-content' }}>
                <i className={`ti ti-${user.mfa_enabled ? 'shield-check' : 'shield-off'}`} style={{ fontSize: '11px' }} aria-hidden="true" />
                {user.mfa_enabled ? 'Activo' : 'Sin MFA'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => openEdit(user)} title="Editar"
                  style={{ width: '30px', height: '30px', borderRadius: '6px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-edit" style={{ fontSize: '14px', color: '#5f5e5a' }} aria-hidden="true" />
                </button>
                <button onClick={() => handleToggleActive(user)} title={user.is_active ? 'Desactivar' : 'Activar'}
                  style={{ width: '30px', height: '30px', borderRadius: '6px', border: `0.5px solid ${user.is_active ? '#c9a84c' : '#8ab87e'}`, background: user.is_active ? '#FAEEDA' : '#EAF3DE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ti-${user.is_active ? 'user-off' : 'user-check'}`} style={{ fontSize: '14px', color: user.is_active ? '#633806' : '#27500A' }} aria-hidden="true" />
                </button>
                {currentUser?.role === 'master' && (
                  <button onClick={() => setDeleteModal({ open: true, user })} title="Eliminar"
                    style={{ width: '30px', height: '30px', borderRadius: '6px', border: '0.5px solid #f09595', background: '#FCEBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: '14px', color: '#791F1F' }} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Crear/Editar usuario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '480px', maxHeight: '90vh', overflow: 'auto', border: '0.5px solid #d3d1c7' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ti-${editUser ? 'user-edit' : 'user-plus'}`} style={{ fontSize: '17px', color: '#085041' }} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</div>
                  <div style={{ fontSize: '12px', color: '#888780' }}>{editUser ? `Modificando a ${editUser.name}` : 'Completa los datos del nuevo usuario'}</div>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888780', fontSize: '20px', lineHeight: 1 }}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              {/* INFORMACIÓN PERSONAL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>INFORMACIÓN PERSONAL</span>
                <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }} />
              </div>

              <div>
                <label style={labelBase}>NOMBRE COMPLETO <span style={{ color: '#E24B4A' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Dr. Juan García" style={inputBase} />
                  <i className="ti ti-user" aria-hidden="true" style={iconPos} />
                </div>
              </div>

              <div>
                <label style={labelBase}>CORREO ELECTRÓNICO <span style={{ color: '#E24B4A' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@medsecure.local" style={inputBase} />
                  <i className="ti ti-mail" aria-hidden="true" style={iconPos} />
                </div>
              </div>

              <div>
                <label style={labelBase}>TELÉFONO</label>
                <div style={{ position: 'relative' }}>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (809) 555-0100" style={inputBase} />
                  <i className="ti ti-phone" aria-hidden="true" style={iconPos} />
                </div>
              </div>

              {/* ROL Y PERMISOS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>ROL Y PERMISOS</span>
                <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }} />
              </div>

              <div>
                <label style={{ ...labelBase, marginBottom: '8px' }}>ROL <span style={{ color: '#E24B4A' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(roleColors).map(([role, rc]) => (
                    <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: form.role === role ? `1.5px solid ${rc.color}` : '0.5px solid #d3d1c7', background: form.role === role ? rc.bg : '#fff', transition: 'all 0.15s' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ti-${roleIcons[role]}`} style={{ fontSize: '15px', color: rc.color }} aria-hidden="true" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: rc.color }}>{rc.label}</div>
                      </div>
                      {form.role === role && <i className="ti ti-check" aria-hidden="true" style={{ marginLeft: 'auto', fontSize: '15px', color: rc.color }} />}
                    </button>
                  ))}
                </div>
              </div>

              {form.role === 'doctor' && (
                <div>
                  <label style={labelBase}>ESPECIALIDAD</label>
                  <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
                    style={{ width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="">Seleccionar especialidad</option>
                    <option>Medicina General</option>
                    <option>Cardiología</option>
                    <option>Pediatría</option>
                    <option>Ginecología</option>
                    <option>Neurología</option>
                    <option>Traumatología</option>
                    <option>Dermatología</option>
                    <option>Psiquiatría</option>
                    <option>Oncología</option>
                    <option>Urgencias</option>
                  </select>
                </div>
              )}

              {editUser && currentUser?.role === 'master' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CAMBIAR CONTRASEÑA</span>
                    <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }} />
                  </div>
                  <div>
                    <label style={labelBase}>NUEVA CONTRASEÑA</label>
                    <div style={{ position: 'relative' }}>
                      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" style={inputBase} />
                      <i className="ti ti-lock" aria-hidden="true" style={iconPos} />
                    </div>
                  </div>
                </>
              )}

              {!editUser && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CREDENCIALES DE ACCESO</span>
                    <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }} />
                  </div>

                  <div>
                    <label style={labelBase}>CONTRASEÑA <span style={{ color: '#E24B4A' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" style={inputBase} />
                      <i className="ti ti-lock" aria-hidden="true" style={iconPos} />
                    </div>
                  </div>

                  <div>
                    <label style={labelBase}>CONFIRMAR CONTRASEÑA <span style={{ color: '#E24B4A' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repite la contraseña"
                        style={{ ...inputBase, border: `0.5px solid ${form.confirmPassword && form.password !== form.confirmPassword ? '#E24B4A' : '#d3d1c7'}` }} />
                      <i className={`ti ti-${form.confirmPassword ? (form.password === form.confirmPassword ? 'check' : 'x') : 'lock'}`} aria-hidden="true"
                        style={{ ...iconPos, color: form.confirmPassword ? (form.password === form.confirmPassword ? '#0F6E56' : '#E24B4A') : '#888780' }} />
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #f09595', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#791F1F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: '15px' }} aria-hidden="true" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ background: '#EAF3DE', border: '0.5px solid #8ab87e', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#27500A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-check" style={{ fontSize: '15px' }} aria-hidden="true" />
                  {formSuccess}
                </div>
              )}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid #ebebeb', display: 'flex', gap: '8px', justifyContent: 'flex-end', background: '#f9f9f7' }}>
              <button onClick={() => setShowForm(false)}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#444441' }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={formLoading}
                style={{ height: '36px', padding: '0 20px', borderRadius: '8px', border: 'none', background: formLoading ? '#7ab5a8' : '#0F6E56', fontSize: '13px', fontWeight: '500', color: '#fff', cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className={`ti ti-${formLoading ? 'loader' : editUser ? 'check' : 'user-plus'}`} style={{ fontSize: '15px' }} aria-hidden="true" />
                {formLoading ? 'Guardando...' : editUser ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '360px', border: '0.5px solid #d3d1c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-trash" style={{ fontSize: '20px', color: '#791F1F' }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>Eliminar usuario</div>
                <div style={{ fontSize: '13px', color: '#888780' }}>Esta acción no se puede deshacer</div>
              </div>
            </div>
            <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
              ¿Eliminar a <strong>{deleteModal.user?.name}</strong> ({deleteModal.user?.email})?
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal({ open: false, user: null })}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#444441' }}>
                Cancelar
              </button>
              <button onClick={handleDelete}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: 'none', background: '#791F1F', fontSize: '13px', fontWeight: '500', color: '#fff', cursor: 'pointer' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}