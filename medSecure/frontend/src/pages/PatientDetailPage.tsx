import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

interface PatientDetail {
  patient_token: string
  email: string
  nombre?: string
  fecha_nacimiento?: string
  sexo?: string
  tipo_sangre?: string
  cedula?: string
  telefono?: string
  created_at: string
}

export default function PatientDetailPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get(`/api/patients/${token}`)
      .then((res) => setPatient(res.data.patient || res.data))
      .catch(() => toast.error('Error al cargar paciente'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <DashboardLayout title="Paciente"><div style={{ textAlign: 'center', color: '#888780', fontSize: '13px', padding: '40px' }}>Cargando...</div></DashboardLayout>
  if (!patient) return <DashboardLayout title="Paciente"><div style={{ textAlign: 'center', color: '#888780', fontSize: '13px', padding: '40px' }}>Paciente no encontrado</div></DashboardLayout>

  return (
    <DashboardLayout title="Detalle del paciente">
      <div style={{ display: 'flex', gap: '16px', maxWidth: '720px' }}>
        <div style={{ flex: 1, background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
                {patient.email.split('@')[0].slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c2c2a' }}>{patient.nombre || patient.email.split('@')[0]}</div>
                <div style={{ fontSize: '11px', color: '#888780' }}>Token: {patient.patient_token}</div>
              </div>
            </div>
            <Badge variant="success" icon="check">Activo</Badge>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Email" value={patient.email} />
            <Field label="Cédula" value={patient.cedula || '—'} />
            <Field label="Fecha de nacimiento" value={patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString() : '—'} />
            <Field label="Sexo" value={patient.sexo || '—'} />
            <Field label="Tipo de sangre" value={patient.tipo_sangre || '—'} />
            <Field label="Teléfono" value={patient.telefono || '—'} />
            <Field label="Registrado" value={new Date(patient.created_at).toLocaleDateString()} />
          </div>
          <div style={{ padding: '14px 20px', borderTop: '0.5px solid #ebebeb', display: 'flex', gap: '8px', justifyContent: 'flex-end', background: '#f5f5f3' }}>
            <Button variant="outline" onClick={() => navigate(`/records/${patient.patient_token}/new`)}>
              <i className="ti ti-file-plus" style={{ fontSize: '14px' }} aria-hidden="true" /> Nuevo expediente
            </Button>
            <Button variant="primary">
              <i className="ti ti-calendar-plus" style={{ fontSize: '14px' }} aria-hidden="true" /> Nueva cita
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: '#2c2c2a' }}>{value}</div>
    </div>
  )
}
