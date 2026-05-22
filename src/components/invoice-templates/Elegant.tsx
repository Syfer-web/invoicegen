// Elegant — Refined and sophisticated, premium feel
// Purple accent #7c3aed, light lavender bg

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

export function ElegantTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = '#7c3aed'

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#faf5ff', minHeight: '100%', padding: '48px', color: '#1a1a2e' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', paddingBottom: '24px', borderBottom: `1px solid ${accent}33` }}>
        <div>
          {invoice.company?.name && (
            <div style={{ fontSize: '20px', fontWeight: 400, color: '#1a1a2e', fontStyle: 'italic' }}>{invoice.company.name}</div>
          )}
          <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', letterSpacing: '0.02em' }}>
            {invoice.company?.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 400, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', fontStyle: 'normal', letterSpacing: '0' }}>#{invoice.invoice_number}</div>
        </div>
      </div>

      {/* Client + dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Prepared for</div>
          <div style={{ fontSize: '16px', fontWeight: 400 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '13px', color: '#888' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>{invoice.client.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: 2 }}>
            <div>Issued: {formatDate(invoice.issue_date)}</div>
            <div>Due: {formatDate(invoice.due_date)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr>
            {['Description', 'Qty', 'Price', 'VAT', 'Amount'].map((h, i) => (
              <th key={h} style={{ padding: '0 16px 12px 0', fontSize: '10px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i >= 1 ? 'right' : 'left', borderBottom: `1px solid ${accent}22` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: `1px solid ${accent}11` }}>
              <td style={{ padding: '16px 16px 16px 0', fontSize: '13px', fontStyle: 'italic' }}>{item.description}</td>
              <td style={{ padding: '16px 0', fontSize: '12px', color: '#888', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '16px 0', fontSize: '12px', color: '#888', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '16px 0', fontSize: '12px', color: '#888', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '16px 0', fontSize: '13px', textAlign: 'right', fontStyle: 'italic' }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right', minWidth: '220px', padding: '20px', background: `${accent}0a`, borderLeft: `3px solid ${accent}`, borderRadius: '0 8px 8px 0' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Total Due</div>
          <div style={{ fontSize: '26px', fontWeight: 400, color: accent }}>{s}{(invoice.total || 0).toFixed(2)}</div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: '48px', fontSize: '12px', color: '#aaa', lineHeight: 1.8, fontStyle: 'italic', borderTop: `1px solid ${accent}22`, paddingTop: '20px' }}>
          {invoice.notes}
        </div>
      )}
    </div>
  )
}