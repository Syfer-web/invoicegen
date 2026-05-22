// Playful — Friendly, approachable, rounded elements
// Pink accent #db2777

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function PlayfulTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = '#db2777'

  return (
    <div style={{ fontFamily: "'Nunito', 'Inter', system-ui, sans-serif", background: '#fff0f8', minHeight: '100%', padding: '40px', color: '#111' }}>
      {/* Rounded header card */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '32px 40px', marginBottom: '32px', boxShadow: '0 4px 24px rgba(219,39,119,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: accent }}>{invoice.company?.name || 'Company'}</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{invoice.company?.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', background: accent, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', letterSpacing: '0.05em' }}>
              {invoice.type === 'quote' ? 'QUOTE ✨' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE 🎉'}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>#{invoice.invoice_number}</div>
          </div>
        </div>
      </div>

      {/* Client + dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Bill To 👋</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '13px', color: '#888' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{invoice.client.email}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Issued', value: formatDate(invoice.issue_date) },
              { label: 'Due', value: formatDate(invoice.due_date) },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${accent}15` }}>
              {['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '14px 20px', fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.filter(i => i.description).map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: idx < invoice.items.filter(i=>i.description).length - 1 ? '1px solid #fdf2f8' : 'none' }}>
                <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600 }}>{item.description}</td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: '#888', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.vat_rate}%</td>
                <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 800, textAlign: 'right', color: accent }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: accent, borderRadius: '20px', padding: '20px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Due</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{s}{(invoice.total || 0).toFixed(2)} 💸</div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: '32px', background: '#fff', borderRadius: '16px', padding: '16px 20px', fontSize: '12px', color: '#888', lineHeight: 1.6 }}>
          {invoice.notes}
        </div>
      )}
    </div>
  )
}