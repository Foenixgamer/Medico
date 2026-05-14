import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Button } from '../components/ui/Button'

const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '0.5px solid #d3d1c7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#2c2c2a', background: '#fff', outline: 'none', fontFamily: 'inherit' }
const areaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical', minHeight: '70px' }

export default function RecordNewPage() {
  const { patientToken } = useParams<{ patientToken: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    diagnostico: '', diagnosticosSec: '', tratamiento: '',
    medicamentos: '', observaciones: '', proximaCita: '',
  })

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.diagnostico || !form.tratamiento) {
      setError('Completa el diagnóstico principal y tratamiento indicado'); return
    }
    setLoading(true); setError('')
    try {
      await api.post('/api/records', {
        patient_token: patientToken,
        fecha_consulta: form.fecha,
        diagnostico_principal: form.diagnostico,
        diagnosticos_secundarios: form.diagnosticosSec,
        tratamiento: form.tratamiento,
        medicamentos: form.medicamentos,
        observaciones: form.observaciones,
        proxima_cita: form.proximaCita,
      })
      toast.success('Expediente creado exitosamente')
      navigate(`/patients/${patientToken}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear expediente')
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout title="Nuevo expediente">
      <div style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff' }}>
              <i className="ti ti-file-plus" style={{ fontSize: '16px', color: '#0F6E56' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>Nuevo expediente clínico</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Fecha de consulta</label>
                <input type="date" style={inputStyle} value={form.fecha} onChange={(e) => update('fecha', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Próxima cita recomendada</label>
                <input type="date" style={inputStyle} value={form.proximaCita} onChange={(e) => update('proximaCita', e.target.value)} min={form.fecha} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Diagnóstico principal *</label>
                <input style={inputStyle} value={form.diagnostico} onChange={(e) => update('diagnostico', e.target.value)} placeholder="Diagnóstico principal" required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Diagnósticos secundarios</label>
                <textarea style={areaStyle} value={form.diagnosticosSec} onChange={(e) => update('diagnosticosSec', e.target.value)} placeholder="Diagnósticos adicionales, comorbilidades" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Tratamiento indicado *</label>
                <textarea style={areaStyle} value={form.tratamiento} onChange={(e) => update('tratamiento', e.target.value)} placeholder="Describe el tratamiento prescrito" required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Medicamentos recetados</label>
                <textarea style={areaStyle} value={form.medicamentos} onChange={(e) => update('medicamentos', e.target.value)} placeholder="Uno por línea: Nombre, dosis, frecuencia" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Observaciones clínicas</label>
                <textarea style={areaStyle} value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} placeholder="Notas adicionales sobre el paciente" />
              </div>
            </div>

            {error && (
              <div style={{ margin: '0 20px 14px', background: '#FCEBEB', border: '0.5px solid #f09595', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#791F1F' }} aria-hidden="true" />
                <span style={{ fontSize: '12px', color: '#791F1F' }}>{error}</span>
              </div>
            )}

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid #ebebeb', display: 'flex', justifyContent: 'space-between', background: '#f5f5f3' }}>
              <Button variant="outline" type="button" onClick={() => navigate(`/patients/${patientToken}`)}>
                <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" /> Volver
              </Button>
              <Button type="submit" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Guardando...' : 'Crear expediente'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
