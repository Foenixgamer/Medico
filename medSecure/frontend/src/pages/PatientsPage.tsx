import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

interface Patient { patient_token: string; email: string; created_at: string }

const avBgs = ['#E1F5EE', '#E6F1FB', '#FCEBEB', '#F1EFE8']
const avColors = ['#085041', '#0C447C', '#791F1F', '#444441']
const statuses = ['En espera', 'Atendido', 'Urgente', 'Atendido']

function initials(email: string) {
  return email.split('@')[0].split(/[._-]/).map(s => s[0]).join('').toUpperCase().slice(0, 2)
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null })

  useEffect(() => {
    api.get('/api/patients')
      .then((res) => setPatients(res.data.patients || []))
      .catch(() => toast.error('Error al cargar pacientes'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeletePatient = async () => {
    if (!deleteModal.patient) return
    try {
      await api.delete(`/api/patients/${deleteModal.patient.patient_token}`)
      setPatients(prev => prev.filter(p => p.patient_token !== deleteModal.patient!.patient_token))
      setDeleteModal({ open: false, patient: null })
      toast.success('Paciente eliminado correctamente')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar paciente')
    }
  }

  const filtered = patients.filter(p =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_token.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Pacientes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '320px' }}>
          <Input icon="search" placeholder="Buscar por email o token..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button icon="plus" onClick={() => navigate('/patients/new')}>Nuevo paciente</Button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 130px', gap: '12px', fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          <span>Paciente</span>
          <span>Email / Token</span>
          <span>Estado</span>
          <span style={{ textAlign: 'right' }}>Acción</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>{search ? 'Sin resultados' : 'No hay pacientes registrados'}</div>
        ) : (
          filtered.map((p, i) => (
            <div key={p.patient_token} style={{ padding: '10px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 130px', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', color: '#2c2c2a' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avBgs[i % avBgs.length], color: avColors[i % avColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500', flexShrink: 0 }}>
                  {initials(p.email)}
                </div>
                {p.email.split('@')[0]}
              </div>
              <div style={{ fontSize: '13px', color: '#5f5e5a' }}>
                <div>{p.email}</div>
                <div style={{ fontSize: '11px', color: '#888780' }}>Token: {p.patient_token.slice(0, 12)}...</div>
              </div>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500', background: '#FAEEDA', color: '#633806', textAlign: 'center' }}>{statuses[i % statuses.length]}</span>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/patients/${p.patient_token}`)} title="Ver expediente"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-eye" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                </button>
                <button onClick={() => navigate(`/patients/${p.patient_token}/edit`)} title="Editar paciente"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-edit" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                </button>
                <button onClick={() => setDeleteModal({ open: true, patient: p })} title="Eliminar paciente"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #f09595', background: '#FCEBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-trash" style={{ fontSize: '15px', color: '#791F1F' }} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '360px', border: '0.5px solid #d3d1c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-trash" style={{ fontSize: '20px', color: '#791F1F' }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>Eliminar paciente</div>
                <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>Esta acción no se puede deshacer</div>
              </div>
            </div>
            <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2c2c2a' }}>
              ¿Eliminar a <strong>{deleteModal.patient?.email}</strong>? Sus expedientes clínicos serán anonimizados (cumplimiento GDPR).
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal({ open: false, patient: null })}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#444441' }}>
                Cancelar
              </button>
              <button onClick={handleDeletePatient}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: 'none', background: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#fff' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
