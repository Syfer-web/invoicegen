'use client'

import type { InvoiceType } from '@/types/invoice'
import { INVOICE_TYPES } from '@/types/invoice'

interface Props {
  type: InvoiceType
  onChangeType: (t: InvoiceType) => void
  issueDate: string
  onChangeIssueDate: (v: string) => void
  dueDate: string
  onChangeDueDate: (v: string) => void
  projectRef: string
  onChangeProjectRef: (v: string) => void
  orderNumber: string
  onChangeOrderNumber: (v: string) => void
}

export default function DatesRefsSection({
  type, onChangeType,
  issueDate, onChangeIssueDate, dueDate, onChangeDueDate,
  projectRef, onChangeProjectRef, orderNumber, onChangeOrderNumber,
}: Props) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', marginLeft: '10px' }}>Dates & References</span>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Invoice type */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px' }}>Invoice type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {INVOICE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => onChangeType(t.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: type === t.value ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: type === t.value ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: type === t.value ? '#10b981' : '#FAFAFA', marginBottom: '2px' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: '#52525B' }}>{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Issue date */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px' }}>Issue date</label>
          <input type="date" value={issueDate} onChange={e => onChangeIssueDate(e.target.value)} style={inputStyle} />
        </div>

        {/* Due date */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px' }}>Due date</label>
          <input type="date" value={dueDate} onChange={e => onChangeDueDate(e.target.value)} style={inputStyle} />
        </div>

        {/* Project ref */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px' }}>Project reference</label>
          <input type="text" value={projectRef} onChange={e => onChangeProjectRef(e.target.value)} placeholder="PROJ-2026-001" style={inputStyle} />
        </div>

        {/* Order number */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px' }}>Order / PoD number</label>
          <input type="text" value={orderNumber} onChange={e => onChangeOrderNumber(e.target.value)} placeholder="ORD-12345" style={inputStyle} />
        </div>
      </div>
    </div>
  )
}