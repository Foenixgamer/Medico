import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { StepDots } from '../components/ui/StepIndicator'

const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none', fontFamily: 'inherit' }
const areaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical', minHeight: '60px' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
      <div style={{ flex: 1, height: '0.5px', background: '#d3d1c7' }} />
      <span style={{ fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '0.5px', background: '#d3d1c7' }} />
    </div>
  )
}

export default function PatientNewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doctors, setDoctors] = useState<Array<{ id: string; email: string }>>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [form, setForm] = useState({
    name: '', dob: '', sex: '', bloodType: '', cedula: '', phone: '', email: '', address: '',
    doctorId: '', specialty: '', allergies: '', conditions: '', medications: '', familyHistory: '',
    consentTerms: false, consentHealth: false,
  })

  useEffect(() => {
    api.get('/api/users?role=doctor').then(r => setDoctors(r.data.users || [])).catch(() => {}).finally(() => setLoadingDoctors(false))
  }, [])

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/api/patients', {
        nombre: form.name,
        fecha_nacimiento: form.dob,
        sexo: form.sex,
        tipo_sangre: form.bloodType,
        cedula: form.cedula,
        telefono: form.phone,
        email: form.email,
        direccion: form.address,
        medico_asignado: form.doctorId,
        especialidad: form.specialty,
        alergias: form.allergies,
        padecimientos: form.conditions,
        medicamentos: form.medications,
        antecedentes: form.familyHistory,
      })
      toast.success('Paciente registrado exitosamente')
      navigate('/patients')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar paciente')
    } finally { setLoading(false) }
  }

  const steps: Array<'done' | 'active' | 'pending'> = step === 0 ? ['active', 'pending', 'pending'] : step === 1 ? ['done', 'active', 'pending'] : ['done', 'done', 'active']

  return (
    <DashboardLayout title="Nuevo paciente">
      <div style={{ maxWidth: '720px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-user-plus" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Registro de nuevo paciente</span>
            </div>
            <StepDots steps={steps} />
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {step === 0 && (
              <>
                <SectionDivider label="Datos personales" />
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Input label="Nombre completo" icon="user" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Nombre del paciente" required />
                  <Input label="Fecha de nacimiento" type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} required />
                  <div>
                    <label style={labelStyle}>Sexo biológico *</label>
                    <select style={selectStyle} value={form.sex} onChange={(e) => update('sex', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tipo de sangre</label>
                    <select style={selectStyle} value={form.bloodType} onChange={(e) => update('bloodType', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input label="Cédula/ID" icon="id" value={form.cedula} onChange={(e) => update('cedula', e.target.value)} placeholder="000-0000000-0" required />
                  <Input label="Teléfono" icon="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="809-000-0000" />
                  <Input label="Email del paciente" icon="mail" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="paciente@correo.com" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Dirección" icon="map-pin" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Calle, número, sector" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <SectionDivider label="Datos clínicos" />
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Médico asignado *</label>
                    <select style={selectStyle} value={form.doctorId} onChange={(e) => update('doctorId', e.target.value)} required disabled={loadingDoctors}>
                      <option value="">{loadingDoctors ? 'Cargando médicos...' : 'Seleccionar médico...'}</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Especialidad</label>
                    <select style={selectStyle} value={form.specialty} onChange={(e) => update('specialty', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {['Medicina general','Cardiología','Pediatría','Neurología','Dermatología','Traumatología','Ginecología','Oftalmología'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Alergias conocidas</label>
                  <textarea style={areaStyle} value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="Alergias a medicamentos, alimentos, etc." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Padecimientos crónicos</label>
                  <textarea style={areaStyle} value={form.conditions} onChange={(e) => update('conditions', e.target.value)} placeholder="Diabetes, hipertensión, asma, etc." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Medicamentos actuales</label>
                  <textarea style={areaStyle} value={form.medications} onChange={(e) => update('medications', e.target.value)} placeholder="Medicamentos que toma actualmente" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Antecedentes familiares</label>
                  <textarea style={areaStyle} value={form.familyHistory} onChange={(e) => update('familyHistory', e.target.value)} placeholder="Antecedentes relevantes de la familia" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <SectionDivider label="Consentimiento informado" />
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '14px', maxHeight: '180px', overflowY: 'auto', fontSize: '12px', color: '#5f5e5a', lineHeight: 1.6, background: '#fafaf8' }}>
                    <p style={{ fontWeight: '500', color: '#2c2c2a', marginBottom: '8px' }}>CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE DATOS DE SALUD</p>
                    <p>Yo, {form.name || '_________________'}, autorizo a MedSecure a recopilar, almacenar y procesar mis datos personales y de salud conforme a las políticas de privacidad y protección de datos establecidas. Entiendo que mis datos serán utilizados exclusivamente para fines clínicos y administrativos dentro del sistema de salud. Reconozco que tengo derecho a acceder, rectificar y solicitar la eliminación de mis datos en cualquier momento. Este consentimiento se rige por las regulaciones HIPAA/GDPR aplicables y las leyes de protección de datos vigentes.</p>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2c2c2a', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.consentTerms} onChange={(e) => update('consentTerms', e.target.checked)} style={{ accentColor: '#0F6E56', width: '14px', height: '14px' }} />
                    Acepto los términos y condiciones de tratamiento de datos
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2c2c2a', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.consentHealth} onChange={(e) => update('consentHealth', e.target.checked)} style={{ accentColor: '#0F6E56', width: '14px', height: '14px' }} />
                    Consiento el tratamiento de mis datos de salud (HIPAA/GDPR)
                  </label>
                  <div style={{ fontSize: '11px', color: '#888780' }}>Fecha de aceptación: {new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{ margin: '0 20px 14px', background: '#FCEBEB', border: '0.5px solid #f09595', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#791F1F' }} aria-hidden="true" />
              <span style={{ fontSize: '12px', color: '#791F1F' }}>{error}</span>
            </div>
          )}

          <div style={{ padding: '14px 20px', borderTop: '0.5px solid #ebebeb', display: 'flex', justifyContent: 'space-between', background: '#f5f5f3' }}>
            <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : null} disabled={step === 0}>
              <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" /> Anterior
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {step < 2 && (
                <>
                  <Button variant="outline" onClick={() => toast.success('Borrador guardado', { icon: '📄' })}>Guardar borrador</Button>
                  <Button onClick={() => setStep(s => s + 1)}>Continuar <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} aria-hidden="true" /></Button>
                </>
              )}
              {step === 2 && (
                <Button onClick={handleSubmit} disabled={loading || !form.consentTerms || !form.consentHealth} style={{ opacity: (loading || !form.consentTerms || !form.consentHealth) ? 0.6 : 1 }}>
                  {loading ? 'Guardando...' : 'Registrar paciente'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
