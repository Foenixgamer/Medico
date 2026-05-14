import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { UserMenu } from './UserMenu'

const navItems = [
  { icon: 'home', label: 'Dashboard', key: 'dashboard', path: '/dashboard', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { icon: 'users', label: 'Pacientes', key: 'patients', path: '/patients', roles: ['admin', 'doctor', 'nurse'] },
  { icon: 'calendar', label: 'Citas', key: 'appointments', path: '/appointments', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { icon: 'file-text', label: 'Expedientes', key: 'records', path: '/records', roles: ['admin', 'doctor', 'nurse'] },
  { icon: 'users', label: 'Usuarios', key: 'users', path: '/users', roles: ['master', 'admin'] },
  { icon: 'chart-bar', label: 'Reportes', key: 'reports', path: '/reports', roles: ['admin', 'doctor'] },
]

export default function DashboardLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const allowedItems = navItems.filter(n => n.roles.includes(user?.role || ''))
  const activeKey = allowedItems.find(n => location.pathname.startsWith(n.path))?.key || (allowedItems[0]?.key || 'dashboard')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f3' }}>
      <div style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '0.5px solid #d3d1c7', display: 'flex', flexDirection: 'column' }}>
        <div onClick={() => navigate('/dashboard')} style={{ padding: '16px 10px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div style={{ width: '28px', height: '28px', background: '#0F6E56', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-shield-heart" style={{ fontSize: '15px', color: '#fff' }} aria-hidden="true" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>MedSecure</span>
        </div>
        <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {allowedItems.map((item) => {
            const isActive = activeKey === item.key
            return (
              <div key={item.key} onClick={() => navigate(item.path)}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = '#f5f5f3' } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent' } }}
                style={{
                  height: '36px', borderRadius: '8px', padding: '0 10px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', cursor: 'pointer', userSelect: 'none',
                  background: isActive ? '#E1F5EE' : 'transparent',
                  color: isActive ? '#085041' : '#5f5e5a',
                }}>
                <i className={`ti ti-${item.icon}`} style={{ fontSize: '17px' }} aria-hidden="true" />
                {item.label}
              </div>
            )
          })}
        </nav>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          height: '52px', background: '#fff', borderBottom: '0.5px solid #d3d1c7',
          padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>{title || 'Dashboard'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <div onClick={() => setNotifOpen(!notifOpen)}
                style={{ width: '32px', height: '32px', border: '0.5px solid #d3d1c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-bell" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', background: '#E24B4A', borderRadius: '50%' }} />
              </div>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '280px', background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 999, overflow: 'hidden' }}>
                  <div style={{ padding: '14px', borderBottom: '0.5px solid #ebebeb', fontSize: '13px', fontWeight: '500', color: '#2c2c2a' }}>Notificaciones</div>
                  <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: '12px', color: '#888780' }}>
                    <i className="ti ti-bell-off" style={{ fontSize: '20px', color: '#d3d1c7', display: 'block', marginBottom: '6px' }} aria-hidden="true" />
                    Sin notificaciones nuevas
                  </div>
                </div>
              )}
            </div>
            <UserMenu />
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
