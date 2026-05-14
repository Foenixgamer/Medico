import React from 'react'

export function StepDots({ steps }: { steps: ('done' | 'active' | 'pending')[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
      {steps.map((status, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{
              flex: 1, height: '0.5px',
              background: status === 'pending' && steps[i - 1] !== 'done' ? '#d3d1c7' : '#0F6E56',
            }} />
          )}
          {status === 'done' ? (
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#0F6E56', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '500',
            }}>
              <i className="ti ti-check" style={{ fontSize: '12px' }} aria-hidden="true" />
            </div>
          ) : status === 'active' ? (
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#E1F5EE', color: '#085041',
              border: '1.5px solid #0F6E56',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '500',
            }}>
              {i + 1}
            </div>
          ) : (
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#f1efe8', color: '#888780',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '500',
            }}>
              {i + 1}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
