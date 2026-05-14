import React from 'react'

interface BadgeProps {
  variant?: 'admin' | 'doctor' | 'nurse' | 'patient' | 'success' | 'warning' | 'danger' | 'default'
  icon?: string
  children: React.ReactNode
}

const badgeStyles: Record<string, { bg: string; color: string }> = {
  admin:   { bg: '#E1F5EE', color: '#085041' },
  doctor:  { bg: '#E6F1FB', color: '#0C447C' },
  nurse:   { bg: '#FAEEDA', color: '#633806' },
  patient: { bg: '#F1EFE8', color: '#444441' },
  success: { bg: '#EAF3DE', color: '#27500A' },
  warning: { bg: '#FAEEDA', color: '#633806' },
  danger:  { bg: '#FCEBEB', color: '#791F1F' },
  default: { bg: '#F1EFE8', color: '#444441' },
}

export function Badge({ variant = 'default', icon, children }: BadgeProps) {
  const s = badgeStyles[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
      fontWeight: '500', background: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {icon && <i className={`ti ti-${icon}`} style={{ fontSize: '11px' }} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function RoleChip({ role }: { role: string }) {
  const map: Record<string, { label: string; icon: string; bg: string; color: string }> = {
    admin:   { label: 'Admin', icon: 'shield', bg: '#E1F5EE', color: '#085041' },
    doctor:  { label: 'Médico', icon: 'stethoscope', bg: '#E6F1FB', color: '#0C447C' },
    nurse:   { label: 'Enfermero', icon: 'heart-rate-monitor', bg: '#FAEEDA', color: '#633806' },
    patient: { label: 'Paciente', icon: 'user', bg: '#F1EFE8', color: '#444441' },
  }
  const c = map[role] || map.patient
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
      fontWeight: '500', background: c.bg, color: c.color,
    }}>
      <i className={`ti ti-${c.icon}`} style={{ fontSize: '11px' }} aria-hidden="true" />
      {c.label}
    </span>
  )
}
