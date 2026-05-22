// Bold — Strong colored header, high contrast, makes a statement
// Red accent #dc2626, dark header

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function BoldTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = '#dc2626'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', minHeight: '100%', color: '#111' }}>
      {/* Big colored header */}
      <div style={{ background: accent, padding: '40px 48px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {invoice.company?.name || 'Company Name'}
          </div>
          <div style={{ fontSize: '40px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', opacity: 0.9 }}>
            {invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'}
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '16px' }}>
          #{invoice.invoice_number} · Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 48px 40px' }}>
        {/* Client */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Bill To</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{invoice.client.email}</div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
          <thead>
            <tr>
              {['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#fff', background: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.filter(i => i.description).map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600 }}>{item.description}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666', textAlign: 'right' }}>{item.vat_rate}%</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '240px', background: '#111', borderRadius: '12px', padding: '24px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Total Due</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: accent, letterSpacing: '-0.03em' }}>{s}{(invoice.total || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ padding: '0 48px 40px' }}>
          <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>{invoice.notes}</div>
        </div>
      )}
    </div>
  )
}