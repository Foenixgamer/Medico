import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

const roleRedirects: Record<string, string> = {
  master: '/users',
  admin: '/dashboard',
  doctor: '/dashboard',
  nurse: '/dashboard',
  patient: '/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const r = await login(email, password)
      if (r.mfaRequired) {
        sessionStorage.setItem('mfa_token', r.mfaToken)
        sessionStorage.setItem('mfaUserId', r.userId || '')
        navigate('/mfa', { replace: true })
      } else {
        const stored = localStorage.getItem('medsecure_auth')
        const user = stored ? JSON.parse(stored).user : null
        const target = roleRedirects[user?.role] || '/dashboard'
        toast.success('Inicio de sesión exitoso')
        navigate(target, { replace: true })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  const card: React.CSSProperties = {
    background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '28px',
  }
  const logo = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ width: '36px', height: '36px', background: '#0F6E56', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
        <i className="ti ti-shield-heart" style={{ fontSize: '20px', color: '#fff' }} aria-hidden="true" />
      </div>
      <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c2c2a' }}>MedSecure</div>
      <div style={{ fontSize: '10px', color: '#888780', letterSpacing: '0.05em', marginTop: '2px', textTransform: 'uppercase' }}>Sistema Clínico</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', padding: '80px 16px' }}>
      <div style={{ maxWidth: '360px', margin: '0 auto' }}>
        {logo}
        <div style={card}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#2c2c2a', marginBottom: '4px' }}>Bienvenido</h1>
          <p style={{ fontSize: '13px', color: '#888780', marginBottom: '20px' }}>Ingresa tus credenciales para continuar</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Correo electrónico" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dr.garcia@medsecure.local" required />
            <div>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 36px 0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888780', padding: 0 }}>
                  <i className={`ti ti-${showPwd ? 'eye-off' : 'eye'}`} style={{ fontSize: '15px' }} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5f5e5a', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#0F6E56', width: '14px', height: '14px' }} /> Recordarme
              </label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: '#0F6E56', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', height: '44px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.5 : 1 }}>
              {loading ? <div style={{ width: '16px', height: '16px', border: '1px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-login" style={{ fontSize: '16px' }} aria-hidden="true" />}
              Iniciar sesión
            </button>
            <div style={{ position: 'relative', textAlign: 'center', fontSize: '11px', color: '#888780', margin: '8px 0' }}>
              <span style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '0 8px' }}>acceso seguro con</span>
              <div style={{ position: 'absolute', inset: '50% 0 0 0', height: '0.5px', background: '#d3d1c7' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Badge variant="admin" icon="shield">Admin</Badge>
              <Badge variant="doctor" icon="stethoscope">Médico</Badge>
              <Badge variant="nurse" icon="heart-rate-monitor">Enfermero</Badge>
              <Badge variant="patient" icon="user">Paciente</Badge>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
