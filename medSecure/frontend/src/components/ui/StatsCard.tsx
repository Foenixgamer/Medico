import React from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  sub?: string
  icon: string
  iconColor: string
}

export function StatsCard({ label, value, sub, icon, iconColor }: StatsCardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #d3d1c7',
      borderRadius: '8px',
      padding: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#888780', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <i className={`ti ti-${icon}`} style={{ fontSize: '20px', color: iconColor }} aria-hidden="true" />
      </div>
      <div style={{ fontSize: '22px', fontWeight: '500', color: '#2c2c2a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}
