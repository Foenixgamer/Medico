import React, { useEffect, useState } from 'react'
import api from '../hooks/api'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import { StatsCard } from '../components/ui/StatsCard'

export default function ReportsPage() {
  const [stats, setStats] = useState({ patients: 0, appointments: 0, records: 0, activeUsers: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/api/patients').then(r => setStats(s => ({ ...s, patients: r.data.patients?.length || 0 }))).catch(() => {}),
      api.get('/api/appointments').then(r => setStats(s => ({ ...s, appointments: r.data.appointments?.length || 0 }))).catch(() => {}),
      api.get('/api/records').then(r => setStats(s => ({ ...s, records: r.data.records?.length || 0 }))).catch(() => {}),
      api.get('/api/users').then(r => setStats(s => ({ ...s, activeUsers: r.data.users?.length || 0 }))).catch(() => {}),
    ])
  }, [])

  return (
    <DashboardLayout title="Reportes">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <StatsCard label="Total pacientes" value={stats.patients} sub="Registrados" icon="users" iconColor="#0F6E56" />
        <StatsCard label="Total citas" value={stats.appointments} sub="Registradas" icon="calendar" iconColor="#0C447C" />
        <StatsCard label="Expedientes" value={stats.records} sub="Creados" icon="file-text" iconColor="#633806" />
        <StatsCard label="Usuarios activos" value={stats.activeUsers} sub="En el sistema" icon="users" iconColor="#444441" />
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <i className="ti ti-chart-bar" style={{ fontSize: '32px', color: '#d3d1c7' }} aria-hidden="true" />
        <div style={{ fontSize: '13px', color: '#888780', marginTop: '8px' }}>Panel de reportes detallados próximamente</div>
      </div>
    </DashboardLayout>
  )
}
