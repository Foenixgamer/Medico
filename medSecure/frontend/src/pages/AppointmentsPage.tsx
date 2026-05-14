import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

interface Appointment {
  id: string
  patient_email?: string
  doctor_email?: string
  fecha?: string
  hora?: string
  tipo?: string
  estado?: string
  motivo?: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pendiente: { bg: '#FAEEDA', color: '#633806' },
  confirmada: { bg: '#E1F5EE', color: '#085041' },
  completada: { bg: '#EAF3DE', color: '#27500A' },
  cancelada: { bg: '#FCEBEB', color: '#791F1F' },
}

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteApptModal, setDeleteApptModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null })

  useEffect(() => {
    api.get('/api/appointments')
      .then((res) => setAppointments(res.data.appointments || []))
      .catch(() => toast.error('Error al cargar citas'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancelAppointment = async () => {
    if (!deleteApptModal.appointment) return
    try {
      await api.delete(`/api/appointments/${deleteApptModal.appointment.id}`)
      setAppointments(prev => prev.filter(a => a.id !== deleteApptModal.appointment!.id))
      setDeleteApptModal({ open: false, appointment: null })
      toast.success('Cita cancelada')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cancelar cita')
    }
  }

  return (
    <DashboardLayout title="Citas">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon="plus" onClick={() => navigate('/appointments/new')}>Nueva cita</Button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 80px 130px', gap: '12px', fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          <span>Paciente</span>
          <span>Médico</span>
          <span>Fecha</span>
          <span>Hora</span>
          <span>Estado</span>
          <span style={{ textAlign: 'right' }}>Acción</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>Cargando...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>No hay citas registradas</div>
        ) : (
          appointments.map((a) => {
            const sc = statusColors[a.estado || 'pendiente'] || statusColors.pendiente
            return (
              <div key={a.id} style={{ padding: '10px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 80px 130px', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#2c2c2a' }}>
                <div>{a.patient_email || '—'}</div>
                <div>{a.doctor_email || '—'}</div>
                <div>{a.fecha ? new Date(a.fecha).toLocaleDateString() : '—'}</div>
                <div>{a.hora || '—'}</div>
                <div><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500', background: sc.bg, color: sc.color }}>{(a.estado || 'pendiente').charAt(0).toUpperCase() + (a.estado || 'pendiente').slice(1)}</span></div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => navigate(`/appointments/${a.id}`)} title="Ver cita"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-eye" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                  </button>
                  <button onClick={() => navigate(`/appointments/${a.id}/edit`)} title="Editar cita"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-edit" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                  </button>
                  <button onClick={() => setDeleteApptModal({ open: true, appointment: a })} title="Cancelar cita"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #f09595', background: '#FCEBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: '15px', color: '#791F1F' }} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {deleteApptModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '360px', border: '0.5px solid #d3d1c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-calendar-off" style={{ fontSize: '20px', color: '#791F1F' }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>Cancelar cita</div>
                <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>Esta acción no se puede deshacer</div>
              </div>
            </div>
            <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2c2c2a' }}>
              ¿Cancelar la cita de <strong>{deleteApptModal.appointment?.patient_email || '—'}</strong> con <strong>{deleteApptModal.appointment?.doctor_email || '—'}</strong>?
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteApptModal({ open: false, appointment: null })}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#444441' }}>
                Volver
              </button>
              <button onClick={handleCancelAppointment}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: 'none', background: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#fff' }}>
                Sí, cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
