import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
}

const styles: Record<string, React.CSSProperties> = {
  primary: {
    background: '#0F6E56', color: '#fff', border: 'none',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: '6px', borderRadius: '8px', fontWeight: '500',
    transition: 'background 0.15s',
  },
  outline: {
    background: '#fff', color: '#444441',
    border: '0.5px solid #d3d1c7',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: '6px', borderRadius: '8px', fontWeight: '400',
  },
  danger: {
    background: '#FCEBEB', color: '#791F1F',
    border: '0.5px solid #f09595',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: '6px', borderRadius: '8px', fontWeight: '500',
  },
  ghost: {
    background: 'transparent', color: '#5f5e5a', border: 'none',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: '6px', borderRadius: '8px', fontWeight: '400',
  },
}

const sizes: Record<string, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
  md: { height: '38px', padding: '0 16px', fontSize: '13px' },
  lg: { height: '44px', padding: '0 20px', fontSize: '14px' },
}

export function Button({ variant = 'primary', size = 'md', icon, children, style, ...props }: ButtonProps) {
  return (
    <button
      style={{ ...styles[variant], ...sizes[size], ...style } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (variant === 'primary') (e.target as HTMLElement).style.background = '#085041'
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') (e.target as HTMLElement).style.background = '#0F6E56'
      }}
      {...props}
    >
      {icon && <i className={`ti ti-${icon}`} style={{ fontSize: size === 'sm' ? '14px' : '16px' }} aria-hidden="true" />}
      {children}
    </button>
  )
}
