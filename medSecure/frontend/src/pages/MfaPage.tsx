import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import { StepDots } from '../components/ui/StepIndicator'

export default function MfaPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(30)

  const userId = sessionStorage.getItem('mfaUserId')
  const mfaToken = sessionStorage.getItem('mfa_token')

  useEffect(() => {
    if (!userId && !mfaToken) { navigate('/login', { replace: true }); return }
    document.getElementById('otp-0')?.focus()
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  const handleChange = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return
    const n = [...code]; n[i] = v; setCode(n); setError('')
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus()
  }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const n = [...code]
    d.split('').forEach((ch, idx) => { n[idx] = ch })
    setCode(n)
    document.getElementById(`otp-${Math.min(d.length, 5)}`)?.focus()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = code.join('')
    if (token.length !== 6) { setError('Ingresa el código completo de 6 dígitos'); return }
    setLoading(true); setError('')
    try {
      const body: any = { token }
      if (userId) body.userId = userId
      const headers: any = {}
      if (mfaToken) headers.Authorization = `Bearer ${mfaToken}`

      const res = await api.post('/api/auth/mfa/verify', body, { headers })
      const data = res.data
      if (data.accessToken) {
        localStorage.setItem('medsecure_auth', JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        }))
      }
      sessionStorage.removeItem('mfaUserId')
      sessionStorage.removeItem('mfa_token')
      toast.success('Acceso verificado')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido. Intenta de nuevo.')
      setCode(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally { setLoading(false) }
  }

  const activeIdx = code.join('').length < 6 ? code.join('').length : -1

  const logo = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ width: '36px', height: '36px', background: '#0F6E56', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
        <i className="ti ti-shield-heart" style={{ fontSize: '20px', color: '#fff' }} aria-hidden="true" />
      </div>
      <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c2c2a' }}>MedSecure</div>
      <div style={{ fontSize: '10px', color: '#888780', letterSpacing: '0.05em', marginTop: '2px', textTransform: 'uppercase' }}>Autenticación</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', padding: '80px 16px' }}>
      <div style={{ maxWidth: '360px', margin: '0 auto' }}>
        {logo}
        <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '28px' }}>
          <StepDots steps={['done', 'active', 'pending']} />
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#2c2c2a', marginBottom: '4px' }}>Verificación MFA</h1>
          <p style={{ fontSize: '13px', color: '#888780', marginBottom: '20px' }}>Ingresa el código de tu aplicación autenticadora</p>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {code.map((v, i) => (
                <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={v}
                  onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  inputMode="numeric" autoFocus={i === 0}
                  style={{
                    width: '44px', height: '48px', textAlign: 'center', fontSize: '20px', fontWeight: '500',
                    border: `0.5px solid ${activeIdx === i ? '#0F6E56' : '#d3d1c7'}`,
                    borderRadius: '8px', outline: 'none', color: '#2c2c2a', background: '#fff',
                    boxShadow: activeIdx === i ? '0 0 0 3px rgba(15,110,86,0.12)' : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#888780', textAlign: 'center' }}>
              Código expira en <span style={{ color: timer <= 10 ? '#E24B4A' : '#0F6E56', fontWeight: '500' }}>00:{timer.toString().padStart(2, '0')}</span>
            </p>
            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #f09595', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#791F1F' }} aria-hidden="true" />
                <span style={{ fontSize: '12px', color: '#791F1F' }}>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', height: '44px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.5 : 1 }}>
              {loading ? <div style={{ width: '16px', height: '16px', border: '1px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-device-mobile-check" style={{ fontSize: '16px' }} aria-hidden="true" />}
              Verificar código
            </button>
            <p style={{ fontSize: '12px', color: '#888780', textAlign: 'center' }}>
              ¿No tienes acceso?{' '}
              <button type="button" onClick={() => toast('Usa uno de tus códigos de respaldo', { icon: '🔑' })} style={{ color: '#0F6E56', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Usar código de respaldo</button>
            </p>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
