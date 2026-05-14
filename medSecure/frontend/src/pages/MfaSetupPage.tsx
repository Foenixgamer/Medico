import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'

export default function MfaSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'qr' | 'verify' | 'done'>('qr')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    setLoading(true)
    try {
      const r = await api.post('/api/auth/mfa/setup')
      setQrCode(r.data.qrCode)
      setSecret(r.data.secret || '')
      setStep('verify')
      toast.success('Escanea el código QR con tu app')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al configurar MFA')
    } finally { setLoading(false) }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Ingresa el código completo'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/mfa/enable', { token: code })
      setStep('done')
      toast.success('Autenticación de dos factores activada')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido')
    } finally { setLoading(false) }
  }

  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '28px', maxWidth: '440px', margin: '0 auto' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', padding: '60px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '36px', height: '36px', background: '#0F6E56', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <i className="ti ti-shield-heart" style={{ fontSize: '20px', color: '#fff' }} aria-hidden="true" />
        </div>
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c2c2a' }}>Configurar 2FA</div>
        <div style={{ fontSize: '10px', color: '#888780', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autenticación de dos factores</div>
      </div>

      {step === 'qr' && (
        <div style={card}>
          <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#2c2c2a', marginBottom: '8px' }}>Paso 1: Escanea el código QR</h1>
          <p style={{ fontSize: '13px', color: '#888780', marginBottom: '16px' }}>Abre Google Authenticator o Authy y escanea el código QR. Luego ingresa el código de verificación.</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '200px', height: '200px', background: '#f5f5f3', border: '0.5px solid #d3d1c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#888780' }}>
              <i className="ti ti-qrcode" style={{ fontSize: '48px', color: '#d3d1c7' }} aria-hidden="true" />
            </div>
          </div>
          <Button onClick={handleSetup} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generando...' : 'Generar código QR'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div style={card}>
          <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#2c2c2a', marginBottom: '8px' }}>Paso 2: Verifica el código</h1>
          <p style={{ fontSize: '13px', color: '#888780', marginBottom: '16px' }}>Ingresa el código de 6 dígitos que aparece en tu aplicación autenticadora.</p>
          {qrCode && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img src={qrCode} alt="QR" style={{ width: '180px', height: '180px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '8px', background: '#fff' }} />
              {secret && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#888780', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(secret); toast.success('Secret copiado') }}>
                  <code style={{ background: '#f5f5f3', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{secret}</code>
                  <span style={{ marginLeft: '4px' }}>📋</span>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>
                Código de verificación *
              </label>
              <input type="text" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                placeholder="000000" inputMode="numeric" autoFocus
                style={{ width: '100%', height: '44px', textAlign: 'center', fontSize: '22px', letterSpacing: '8px', border: `0.5px solid ${error ? '#E24B4A' : '#d3d1c7'}`, borderRadius: '8px', outline: 'none', color: '#2c2c2a', background: '#fff', fontFamily: 'monospace' }}
              />
            </div>
            {error && <span style={{ fontSize: '12px', color: '#E24B4A', textAlign: 'center' }}>{error}</span>}
            <Button type="submit" disabled={loading || code.length !== 6} style={{ width: '100%' }}>
              {loading ? 'Verificando...' : 'Activar autenticación'}
            </Button>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div style={card}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="ti ti-shield-check" style={{ fontSize: '24px', color: '#27500A' }} aria-hidden="true" />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#2c2c2a', marginBottom: '4px' }}>¡2FA Activado!</h1>
            <p style={{ fontSize: '13px', color: '#888780' }}>Tu cuenta ahora está protegida con autenticación de dos factores.</p>
          </div>
          <Button onClick={() => navigate('/settings')} style={{ width: '100%' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: '16px' }} aria-hidden="true" />
            Ir a configuración
          </Button>
        </div>
      )}
    </div>
  )
}
