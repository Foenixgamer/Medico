import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

interface Record {
  id: string
  patient_email?: string
  diagnostico?: string
  fecha_consulta?: string
  created_at: string
}

const statusColors: Record<string, string> = {
  activo: '#0F6E56', completado: '#888780', pendiente: '#633806',
}

export default function RecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; record: Record | null }>({ open: false, record: null })

  useEffect(() => {
    api.get('/api/records')
      .then((res) => setRecords(res.data.records || []))
      .catch(() => toast.error('Error al cargar expedientes'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteRecord = async () => {
    if (!deleteModal.record) return
    try {
      await api.delete(`/api/records/${deleteModal.record.id}`)
      setRecords(prev => prev.filter(r => r.id !== deleteModal.record!.id))
      setDeleteModal({ open: false, record: null })
      toast.success('Expediente eliminado')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar expediente')
    }
  }

  return (
    <DashboardLayout title="Expedientes">
      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 120px 100px 130px', gap: '12px', fontSize: '11px', fontWeight: '500', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          <span>Paciente</span>
          <span>Diagnóstico</span>
          <span>Fecha</span>
          <span>Estado</span>
          <span style={{ textAlign: 'right' }}>Acción</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>Cargando...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888780', fontSize: '13px' }}>No hay expedientes registrados</div>
        ) : (
          records.map((r) => (
            <div key={r.id} style={{ padding: '10px 16px', borderBottom: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1.5fr 120px 100px 130px', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#2c2c2a' }}>
              <div>{r.patient_email || '—'}</div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnostico || '—'}</div>
              <div>{r.fecha_consulta ? new Date(r.fecha_consulta).toLocaleDateString() : '—'}</div>
              <div><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500', background: '#E1F5EE', color: '#085041' }}>Activo</span></div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/records/${r.id}`)} title="Ver expediente"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-eye" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                </button>
                <button onClick={() => navigate(`/records/${r.id}/edit`)} title="Editar expediente"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-edit" style={{ fontSize: '15px', color: '#5f5e5a' }} aria-hidden="true" />
                </button>
                <button onClick={() => setDeleteModal({ open: true, record: r })} title="Eliminar expediente"
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
                <i className="ti ti-file-off" style={{ fontSize: '20px', color: '#791F1F' }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#2c2c2a' }}>Eliminar expediente</div>
                <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>Esta acción cumple con el derecho al olvido (GDPR Art. 17)</div>
              </div>
            </div>
            <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2c2c2a' }}>
              Los datos del expediente de <strong>{deleteModal.record?.patient_email || '—'}</strong> serán eliminados permanentemente.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal({ open: false, record: null })}
                style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#444441' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteRecord}
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
