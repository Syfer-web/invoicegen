// Minimal — Ultra clean, maximum white space, essential content only

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function MinimalTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100%', padding: '64px', color: '#111' }}>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '64px' }}>
        <div>
          {invoice.company?.name && <div style={{ fontSize: '16px', fontWeight: 600 }}>{invoice.company.name}</div>}
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{invoice.company?.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#333' }}>
            {invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>#{invoice.invoice_number}</div>
        </div>
      </div>

      {/* Client + dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>To</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{invoice.client.name}</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{invoice.client.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '48px' }}>
        <thead>
          <tr>
            {['Description', '', 'Amount'].map((h, i) => (
              <th key={i} style={{ padding: '0 0 16px', fontSize: '10px', fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i === 2 ? 'right' : 'left', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id}>
              <td style={{ padding: '16px 0', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{item.description}</td>
              <td style={{ padding: '16px 0', borderBottom: '1px solid #f5f5f5' }}></td>
              <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 500, textAlign: 'right', borderBottom: '1px solid #f5f5f5' }}>
                {s}{(item.quantity * item.unit_price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Amount due</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: '#111', letterSpacing: '-0.03em' }}>
            {s}{(invoice.total || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.8 }}>{invoice.notes}</div>
        </div>
      )}
    </div>
  )
}