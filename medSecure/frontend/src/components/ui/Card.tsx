import React from 'react'

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #d3d1c7',
      borderRadius: '12px',
      padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '0.5px solid #ebebeb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {children}
    </div>
  )
}
