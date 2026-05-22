// Creative — Asymmetric layout, vibrant accents
// Amber accent #d97706

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function CreativeTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = '#d97706'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fffbf0', minHeight: '100%', padding: '40px', color: '#111' }}>
      {/* Asymmetric header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', marginBottom: '48px' }}>
        {/* Left: big invoice label */}
        <div>
          <div style={{ fontSize: '72px', fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: '-0.04em' }}>
            INV
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>No. #{invoice.invoice_number}</div>
        </div>
        {/* Right: company + meta */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>{invoice.company?.name || 'Company'}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{invoice.company?.email}</div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            {[
              { label: 'Issued', value: formatDate(invoice.issue_date) },
              { label: 'Due', value: formatDate(invoice.due_date) },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client block */}
      <div style={{ background: '#fff', borderLeft: `4px solid ${accent}`, padding: '20px 24px', marginBottom: '40px', borderRadius: '0 12px 12px 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Bill To</div>
        <div style={{ fontSize: '18px', fontWeight: 800 }}>{invoice.client.name}</div>
        {invoice.client.company && <div style={{ fontSize: '13px', color: '#666' }}>{invoice.client.company}</div>}
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{invoice.client.email}</div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ borderBottom: `3px solid ${accent}` }}>
            {['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => (
              <th key={h} style={{ padding: '0 12px 10px 0', fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f0e8d8' }}>
              <td style={{ padding: '14px 12px 14px 0', fontSize: '14px' }}>{item.description}</td>
              <td style={{ padding: '14px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '14px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '14px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: 800, textAlign: 'right', color: accent }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '220px', background: accent, borderRadius: '16px', padding: '24px', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{s}{(invoice.total || 0).toFixed(2)}</div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: '40px', fontSize: '12px', color: '#888', lineHeight: 1.6 }}>{invoice.notes}</div>
      )}
    </div>
  )
}