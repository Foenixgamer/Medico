import React from 'react'

interface Permission {
  key: string
  label: string
  on: boolean
}

export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    { key: 'ver', label: 'Ver', on: true },
    { key: 'crear', label: 'Crear', on: true },
    { key: 'editar', label: 'Editar', on: true },
    { key: 'eliminar', label: 'Eliminar', on: true },
    { key: 'roles', label: 'Roles', on: true },
  ],
  doctor: [
    { key: 'ver', label: 'Ver', on: true },
    { key: 'crear', label: 'Crear', on: true },
    { key: 'editar', label: 'Editar', on: true },
    { key: 'eliminar', label: 'Eliminar', on: false },
    { key: 'roles', label: 'Roles', on: false },
  ],
  nurse: [
    { key: 'ver', label: 'Ver', on: true },
    { key: 'crear', label: 'Crear', on: false },
    { key: 'editar', label: 'Editar', on: true },
    { key: 'eliminar', label: 'Eliminar', on: false },
    { key: 'roles', label: 'Roles', on: false },
  ],
  patient: [
    { key: 'ver', label: 'Ver', on: true },
    { key: 'crear', label: 'Crear', on: false },
    { key: 'editar', label: 'Editar', on: false },
    { key: 'eliminar', label: 'Eliminar', on: false },
    { key: 'roles', label: 'Roles', on: false },
  ],
}

export function PermissionDots({ permissions }: { permissions: Permission[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {permissions.map((p) => (
        <div
          key={p.key}
          title={p.label}
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: p.on ? '#0F6E56' : '#d3d1c7',
          }}
        />
      ))}
    </div>
  )
}

export function PermissionLegend({ permissions }: { permissions: Permission[] }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '8px', borderTop: '0.5px solid #ebebeb' }}>
      {permissions.map((p) => (
        <span key={p.key} style={{ fontSize: '11px', color: '#888780', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.on ? '#0F6E56' : '#d3d1c7', display: 'inline-block' }} />
          {p.label}
        </span>
      ))}
    </div>
  )
}
