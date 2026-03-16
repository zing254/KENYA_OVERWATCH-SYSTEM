import React from 'react'

// Simple Kenyan flag-inspired stripe bar for branding
export default function KenyanFlagBar() {
  return (
    <div aria-label="Kenyan flag" style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      <div style={{ flex: 1, backgroundColor: '#000' }} />
      <div style={{ flex: 1, backgroundColor: '#fff' }} />
      <div style={{ flex: 1, backgroundColor: '#e10600' }} />
      <div style={{ flex: 1, backgroundColor: '#fff' }} />
      <div style={{ flex: 1, backgroundColor: '#13803c' }} />
    </div>
  )
}
