'use client'

import { useState } from 'react'
import type { Company } from '@/types/invoice'

interface Props {
  companies: Company[]
  selectedId: string
  onChange: (companyId: string) => void
}

export default function CompanySelector({ companies, selectedId, onChange }: Props) {
  const selected = companies.find(c => c.id === selectedId) || companies[0]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>From:</span>
      <div style={{ position: 'relative', flex: 1 }}>
        <select
          value={selectedId}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            color: '#FAFAFA',
            fontSize: '14px',
            fontWeight: 600,
            paddingRight: '24px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {companies.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#18181B' }}>{c.name}</option>
          ))}
        </select>
        {/* Chevron */}
        <svg
          style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#71717A" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}