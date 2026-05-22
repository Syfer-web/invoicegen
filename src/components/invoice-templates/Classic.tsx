// Classic — Traditional, formal, serif typography
// Colors: navy #1a365d, cream bg #faf8f5

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

export function ClassicTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#faf8f5', minHeight: '100%', padding: '40px 48px', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1a365d', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {invoice.company?.name && (
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d', letterSpacing: '-0.02em' }}>{invoice.company.name}</div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: 1.6 }}>
              {invoice.company?.address && <span>{invoice.company.address}<br /></span>}
              {invoice.company?.city && <span>{invoice.company.city}</span>}
              {invoice.company?.email && <span> · {invoice.company.email}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a365d', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>#{invoice.invoice_number}</div>
          </div>
        </div>
      </div>

      {/* Bill to / Dates row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>Bill To</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '13px', color: '#555' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: 1.5 }}>
            {invoice.client.email}
            {invoice.client.address && <><br />{invoice.client.address}</>}
            {invoice.client.city && <><br />{invoice.client.city}</>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignContent: 'start' }}>
          {[
            { label: 'Issue Date', value: formatDate(invoice.issue_date) },
            { label: 'Due Date', value: formatDate(invoice.due_date) },
            { label: 'Payment Terms', value: `${invoice.payment_terms} days` },
            invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
          ].filter(Boolean).map(item => (
            <div key={item!.label}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{item!.label}</div>
              <div style={{ fontSize: '13px', color: '#333' }}>{item!.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: '#1a365d', color: '#fff' }}>
            {['Description', 'Qty', 'Unit Price', 'VAT', 'Total'].map((h, i) => (
              <th key={h} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e8e4df' }}>
              <td style={{ padding: '12px', fontSize: '13px' }}>{item.description}</td>
              <td style={{ padding: '12px', fontSize: '12px', color: '#555', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '12px', fontSize: '12px', color: '#555', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '12px', fontSize: '12px', color: '#555', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '240px' }}>
          {[
            { label: 'Subtotal', value: `${s}${(invoice.subtotal || 0).toFixed(2)}` },
            invoice.discount_amount ? { label: 'Discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}` } : null,
          ].filter(Boolean).map(item => (
            <div key={item!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#555' }}>
              <span>{item!.label}</span><span>{item!.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '2px solid #1a365d', marginTop: '4px', fontSize: '18px', fontWeight: 700, color: '#1a365d' }}>
            <span>Total</span><span>{s}{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      {invoice.notes && (
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Notes</div>
          <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>{invoice.notes}</div>
        </div>
      )}
    </div>
  )
}