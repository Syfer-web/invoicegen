// Modern — Clean, contemporary, sans-serif, generous whitespace

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function ModernTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = invoice.accent_color || '#10b981'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', minHeight: '100%', padding: '48px', color: '#111' }}>
      {/* Header with colored bar */}
      <div style={{ background: accent, borderRadius: '16px', padding: '32px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {invoice.company?.name && (
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{invoice.company.name}</div>
          )}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
            {invoice.company?.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>#{invoice.invoice_number}</div>
        </div>
      </div>

      {/* Bill to / dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Bill to</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '13px', color: '#666' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{invoice.client.email}</div>
          {invoice.client.address && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{invoice.client.address}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { label: 'Issue Date', value: formatDate(invoice.issue_date) },
            { label: 'Due Date', value: formatDate(invoice.due_date) },
            invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
          ].filter(Boolean).map(item => (
            <div key={item!.label}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{item!.label}</div>
              <div style={{ fontSize: '14px', color: '#111' }}>{item!.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            {['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => (
              <th key={h} style={{ padding: '0 16px 12px 0', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '16px 16px 16px 0', fontSize: '14px' }}>{item.description}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '16px 0', fontSize: '13px', color: '#888', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '260px', background: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
          {[
            { label: 'Subtotal', value: `${s}${(invoice.subtotal || 0).toFixed(2)}`, color: '#888' },
            invoice.discount_amount ? { label: 'Discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}`, color: accent } : null,
            invoice.vat_total ? { label: 'VAT', value: `${s}${(invoice.vat_total || 0).toFixed(2)}`, color: '#888' } : null,
          ].filter(Boolean).map(item => (
            <div key={item!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: item!.color }}>
              <span>{item!.label}</span><span>{item!.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', marginTop: '8px', borderTop: `2px solid ${accent}`, fontSize: '22px', fontWeight: 800, color: accent }}>
            <span>Total</span><span>{s}{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Notes</div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>{invoice.notes}</div>
        </div>
      )}
    </div>
  )
}