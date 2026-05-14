import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: string
  error?: string
  required?: boolean
}

export function Input({ label, icon, error, required, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{
          fontSize: '11px', fontWeight: '500', color: '#888780',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {label}
          {required && <span style={{ color: '#E24B4A', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          style={{
            width: '100%', height: '38px',
            border: `0.5px solid ${focused ? '#0F6E56' : error ? '#E24B4A' : '#d3d1c7'}`,
            borderRadius: '8px',
            padding: icon ? '0 36px 0 12px' : '0 12px',
            fontSize: '13px', color: '#2c2c2a',
            background: '#fff', outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(15,110,86,0.12)' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            ...style,
          } as React.CSSProperties}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          {...props}
        />
        {icon && (
          <i className={`ti ti-${icon}`} aria-hidden="true" style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '15px', color: '#888780',
          }} />
        )}
      </div>
      {error && <span style={{ fontSize: '11px', color: '#E24B4A' }}>{error}</span>}
    </div>
  )
}
