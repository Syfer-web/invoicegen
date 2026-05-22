// Professional — Balanced, corporate-friendly, trustworthy
// Teal accent #0f766e, clean light background

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function ProfessionalTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f8fafc', minHeight: '100%', padding: '48px', color: '#111' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 24px', borderBottom: '2px solid #0f766e', marginBottom: '32px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f766e' }}>
          {invoice.company?.name || 'Company Name'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0f766e' }} />
          <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'}
          </span>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Bill To</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{invoice.client.name}</div>
          {invoice.client.company && <div style={{ fontSize: '13px', color: '#64748b' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{invoice.client.email}</div>
          {invoice.client.address && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{invoice.client.address}</div>}
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Invoice No.', value: invoice.invoice_number },
              { label: 'Date', value: formatDate(invoice.issue_date) },
              { label: 'Due Date', value: formatDate(invoice.due_date) },
              invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
            ].filter(Boolean).map(item => (
              <div key={item!.label}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{item!.label}</div>
                <div style={{ fontSize: '13px', color: '#334155' }}>{item!.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#0f766e' }}>
            {['Description', 'Qty', 'Unit Price', 'VAT', 'Total'].map((h, i) => (
              <th key={h} style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: idx < invoice.items.filter(i=>i.description).length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <td style={{ padding: '14px 20px', fontSize: '14px' }}>{item.description}</td>
              <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '240px', background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
          {[
            { label: 'Subtotal', value: `${s}${(invoice.subtotal || 0).toFixed(2)}` },
            invoice.discount_amount ? { label: 'Discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}` } : null,
            { label: 'Tax (VAT)', value: `${s}${(invoice.vat_total || 0).toFixed(2)}` },
          ].filter(Boolean).map(item => (
            <div key={item!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#64748b' }}>
              <span>{item!.label}</span><span>{item!.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: '6px', borderTop: '2px solid #0f766e', fontSize: '18px', fontWeight: 700, color: '#0f766e' }}>
            <span>Total Due</span><span>{s}{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>{invoice.notes}</div>
      )}
    </div>
  )
}