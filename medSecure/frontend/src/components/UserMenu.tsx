import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const roleColors: Record<string, { bg: string; color: string }> = {
  master:  { bg: '#1a1a1a', color: '#ffffff' },
  admin:   { bg: '#E1F5EE', color: '#085041' },
  doctor:  { bg: '#E6F1FB', color: '#0C447C' },
  nurse:   { bg: '#FAEEDA', color: '#633806' },
  patient: { bg: '#F1EFE8', color: '#444441' },
}

const roleLabels: Record<string, string> = {
  master: 'Master', admin: 'Administrador', doctor: 'Médico',
  nurse: 'Enfermero', patient: 'Paciente',
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const role = user?.role || 'patient'
  const rc = roleColors[role] || roleColors.patient
  const name = user?.email?.split('@')[0] || ''
  const initials = name.slice(0, 2).toUpperCase()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems: Array<{ icon: string; label: string; action: () => void; danger?: boolean } | null> = [
    { icon: 'user-circle', label: 'Mi perfil', action: () => navigate('/settings') },
    { icon: 'shield-lock', label: 'Seguridad y MFA', action: () => navigate('/settings/mfa-setup') },
    { icon: 'settings', label: 'Configuración', action: () => navigate('/settings') },
    null,
    { icon: 'logout', label: 'Cerrar sesión', action: handleLogout, danger: true },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: open ? '#f5f5f3' : 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: '8px', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { if (!open) (e.target as HTMLElement).style.background = '#f5f5f3' }}
        onMouseLeave={(e) => { if (!open) (e.target as HTMLElement).style.background = 'none' }}
      >
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a', lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', background: rc.bg, color: rc.color, fontWeight: '500', display: 'inline-block', marginTop: '2px' }}>
            {roleLabels[role] || role}
          </div>
        </div>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '14px', color: '#888780', marginLeft: '2px' }} aria-hidden="true" />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '220px', background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #ebebeb', background: '#f9f9f7' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#2c2c2a' }}>{name}</div>
            <div style={{ fontSize: '11px', color: '#888780', marginTop: '2px' }}>{user?.email || ''}</div>
          </div>
          <div style={{ padding: '6px' }}>
            {menuItems.map((item, i) =>
              item === null ? (
                <div key={i} style={{ height: '0.5px', background: '#ebebeb', margin: '4px 0' }} />
              ) : (
                <button key={i} onClick={() => { item.action(); setOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textAlign: 'left', color: item.danger ? '#791F1F' : '#2c2c2a', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.danger ? '#FCEBEB' : '#f5f5f3' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                  <i className={`ti ti-${item.icon}`} style={{ fontSize: '16px', color: item.danger ? '#791F1F' : '#888780' }} aria-hidden="true" />
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
