import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Button } from '../components/ui/Button'

const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none', fontFamily: 'inherit' }
const areaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical', minHeight: '60px' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function AppointmentNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<Array<{ patient_token: string; email: string }>>([])
  const [doctors, setDoctors] = useState<Array<{ id: string; email: string }>>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [form, setForm] = useState({
    patientToken: '', doctorId: '', date: '', time: '',
    tipo: '', specialty: '', motivo: '', notas: '',
  })

  useEffect(() => {
    setLoadingPatients(true); setLoadingDoctors(true)
    Promise.all([
      api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(() => {}).finally(() => setLoadingPatients(false)),
      api.get('/api/users?role=doctor').then(r => setDoctors(r.data.users || [])).catch(() => {}).finally(() => setLoadingDoctors(false)),
    ])
  }, [])

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientToken || !form.doctorId || !form.date || !form.time || !form.motivo) {
      setError('Completa todos los campos obligatorios (*)'); return
    }
    setLoading(true); setError('')
    try {
      await api.post('/api/appointments', {
        patient_token: form.patientToken,
        doctor_id: form.doctorId,
        fecha: form.date,
        hora: form.time,
        tipo_consulta: form.tipo,
        especialidad: form.specialty,
        motivo: form.motivo,
        notas: form.notas,
      })
      toast.success('Cita creada exitosamente')
      navigate('/appointments')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la cita')
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout title="Nueva cita">
      <div style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff' }}>
              <i className="ti ti-calendar-plus" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Registro de nueva cita</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Paciente *</label>
                    <select style={selectStyle} value={form.patientToken} onChange={(e) => update('patientToken', e.target.value)} required disabled={loadingPatients}>
                      <option value="">{loadingPatients ? 'Cargando pacientes...' : 'Buscar paciente...'}</option>
                      {patients.map(p => <option key={p.patient_token} value={p.patient_token}>{p.email}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Médico *</label>
                    <select style={selectStyle} value={form.doctorId} onChange={(e) => update('doctorId', e.target.value)} required disabled={loadingDoctors}>
                      <option value="">{loadingDoctors ? 'Cargando médicos...' : 'Seleccionar médico...'}</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.email}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" style={inputStyle} value={form.date} onChange={(e) => update('date', e.target.value)} min={today()} required />
              </div>
              <div>
                <label style={labelStyle}>Hora *</label>
                <input type="time" style={inputStyle} value={form.time} onChange={(e) => update('time', e.target.value)} min="07:00" max="20:00" required />
              </div>
              <div>
                <label style={labelStyle}>Tipo de consulta</label>
                <select style={selectStyle} value={form.tipo} onChange={(e) => update('tipo', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="primera_vez">Primera vez</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="urgencia">Urgencia</option>
                  <option value="control">Control</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Especialidad</label>
                <select style={selectStyle} value={form.specialty} onChange={(e) => update('specialty', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {['Medicina general','Cardiología','Pediatría','Neurología','Dermatología','Traumatología','Ginecología','Oftalmología'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Motivo de consulta *</label>
                <textarea style={areaStyle} value={form.motivo} onChange={(e) => update('motivo', e.target.value)} placeholder="Describe el motivo de la consulta" required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notas adicionales</label>
                <textarea style={areaStyle} value={form.notas} onChange={(e) => update('notas', e.target.value)} placeholder="Notas opcionales" />
              </div>
            </div>

            {error && (
              <div style={{ margin: '0 20px 14px', background: '#FCEBEB', border: '0.5px solid #f09595', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#791F1F' }} aria-hidden="true" />
                <span style={{ fontSize: '12px', color: '#791F1F' }}>{error}</span>
              </div>
            )}

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid #ebebeb', display: 'flex', justifyContent: 'space-between', background: '#f5f5f3' }}>
              <Button variant="outline" type="button" onClick={() => navigate('/appointments')}>
                <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" /> Volver
              </Button>
              <Button type="submit" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Guardando...' : 'Crear cita'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
