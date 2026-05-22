'use client'

import { useState } from 'react'
import type { Client } from '@/types/invoice'
import { COUNTRIES } from '@/types/invoice'
import { createEmptyClient } from '@/types/invoice'

interface Props {
  client: Client
  onChange: (client: Client) => void
  savedClients: { id: string; name: string; company: string; email: string }[]
}

export default function ClientSection({ client, onChange, savedClients }: Props) {
  const [mode, setMode] = useState<'select' | 'new'>('select')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [local, setLocal] = useState<Client>(client)

  const filtered = savedClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  const update = (field: keyof Client, value: string) => {
    const updated = { ...local, [field]: value }
    setLocal(updated)
    onChange(updated)
  }

  const selectClient = (saved: typeof savedClients[0]) => {
    const full: Client = { ...createEmptyClient(), ...saved }
    setLocal(full)
    onChange(full)
    setShowForm(true)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#FAFAFA',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#A1A1AA',
    marginBottom: '6px',
  }

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>Bill To</span>
        </div>
        {local.name && (
          <span style={{ fontSize: '12px', color: '#10b981' }}>{local.name} — {local.email}</span>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {/* Client selection or form */}
        {!showForm && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => { setMode('select'); setShowForm(false) }}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px',
                  border: mode === 'select' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'select' ? 'rgba(16,185,129,0.08)' : 'transparent',
                  color: mode === 'select' ? '#10b981' : '#71717A',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                }}
              >Select client</button>
              <button
                onClick={() => { setMode('new'); setShowForm(true) }}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px',
                  border: mode === 'new' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'new' ? 'rgba(16,185,129,0.08)' : 'transparent',
                  color: mode === 'new' ? '#10b981' : '#71717A',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                }}
              >New client</button>
            </div>

            {mode === 'select' && savedClients.length > 0 && (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search saved clients..."
                  style={{ ...fieldStyle, marginBottom: '8px' }}
                />
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filtered.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#FAFAFA' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{c.company || c.email}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'select' && savedClients.length === 0 && (
              <p style={{ fontSize: '13px', color: '#52525B', textAlign: 'center', padding: '20px' }}>
                No saved clients yet. Create one above.
              </p>
            )}
          </div>
        )}

        {showForm && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Contact name *</label>
                <input type="text" value={local.name} onChange={e => update('name', e.target.value)} placeholder="Jan de Vries" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input type="text" value={local.company} onChange={e => update('company', e.target.value)} placeholder="Acme BV" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={local.email} onChange={e => update('email', e.target.value)} placeholder="jan@acme.nl" style={fieldStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address</label>
                <input type="text" value={local.address} onChange={e => update('address', e.target.value)} placeholder="Keizersgracht 123, 1016 CJ Amsterdam" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input type="text" value={local.city} onChange={e => update('city', e.target.value)} placeholder="Amsterdam" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Postcode</label>
                <input type="text" value={local.postcode} onChange={e => update('postcode', e.target.value)} placeholder="1016 CJ" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <select value={local.country} onChange={e => update('country', e.target.value)} style={fieldStyle}>
                  <option value="" style={{ background: '#18181B' }}>Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#18181B' }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>VAT number</label>
                <input type="text" value={local.vat_number} onChange={e => update('vat_number', e.target.value)} placeholder="NL001234567B01" style={fieldStyle} />
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              style={{
                marginTop: '12px', padding: '6px 12px',
                borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: '#71717A', fontSize: '12px', cursor: 'pointer',
              }}
            >Collapse</button>
          </div>
        )}
      </div>
    </div>
  )
}