// Editorial — Magazine-style layout, strong typography hierarchy
// Dark accent #1e1e1e, off-white bg

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

export function EditorialTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'

  return (
    <div style={{ fontFamily: "'Playfair Display', 'Georgia', serif", background: '#f5f0eb', minHeight: '100%', padding: '56px', color: '#1e1e1e' }}>
      {/* Masthead */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '56px', paddingBottom: '32px', borderBottom: '1px solid #1e1e1e' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 400, color: '#666', letterSpacing: '0.02em', fontFamily: "'Inter', system-ui, sans-serif", marginBottom: '8px' }}>
            Invoice · {invoice.company?.name || 'Company Name'}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {invoice.company?.name || 'Company Name'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#1e1e1e' }}>
            {invoice.type === 'quote' ? 'Q' : invoice.type === 'credit_note' ? 'CN' : 'I'}
          </div>
          <div style={{ fontSize: '12px', color: '#888', fontFamily: "'Inter', system-ui, sans-serif", marginTop: '8px' }}>
            {invoice.invoice_number}
          </div>
        </div>
      </div>

      {/* Client + dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Inter', system-ui, sans-serif", marginBottom: '10px' }}>
            Prepared for
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '15px', fontWeight: 400, color: '#666', marginTop: '2px' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '13px', color: '#999', marginTop: '8px', fontFamily: "'Inter', system-ui, sans-serif" }}>{invoice.client.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: 2.2, fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div>Issued: <strong>{formatDate(invoice.issue_date)}</strong></div>
            <div>Due: <strong>{formatDate(invoice.due_date)}</strong></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1e1e1e' }}>
            {['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => (
              <th key={h} style={{ padding: '0 16px 12px 0', fontSize: '9px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: i >= 1 ? 'right' : 'left', fontFamily: "'Inter', system-ui, sans-serif" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '16px 16px 16px 0', fontSize: '15px', fontWeight: 400 }}>{item.description}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif" }}>{item.quantity}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif" }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif" }}>{item.vat_rate}%</td>
              <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 600, textAlign: 'right', fontFamily: "'Inter', system-ui, sans-serif" }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '48px' }}>
        <div style={{ textAlign: 'right', borderTop: '3px solid #1e1e1e', paddingTop: '16px', minWidth: '200px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Inter', system-ui, sans-serif" }}>Amount Due</div>
          <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '4px' }}>
            {s}{(invoice.total || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '32px', fontSize: '13px', color: '#888', lineHeight: 1.8, fontFamily: "'Inter', system-ui, sans-serif" }}>
          {invoice.notes}
        </div>
      )}
    </div>
  )
}