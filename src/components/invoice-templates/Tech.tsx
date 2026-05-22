// Tech — Grid layout, monospace elements, developer aesthetic
// Cyan accent #0891b2

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'

function formatDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export function TechTemplate({ invoice }: { invoice: Invoice }) {
  const s = CURRENCY_SYMBOLS[invoice.currency] || '€'
  const accent = '#0891b2'

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: '#0d1117', minHeight: '100%', padding: '40px', color: '#c9d1d9' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '20px', borderBottom: `1px solid #30363d` }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#58a6ff', letterSpacing: '-0.01em' }}>
            {invoice.company?.name || '// company'}
          </div>
          <div style={{ fontSize: '11px', color: '#484f58', marginTop: '4px' }}>
            {invoice.company?.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#484f58', marginBottom: '4px' }}>
            <span style={{ color: accent }}>#</span>{invoice.invoice_number}
          </div>
          <div style={{ fontSize: '11px', color: '#484f58' }}>
            {invoice.type === 'quote' ? '[QUOTE]' : invoice.type === 'credit_note' ? '[CREDIT_NOTE]' : '[INVOICE]'}
          </div>
        </div>
      </div>

      {/* Bill to + meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            <span style={{ color: accent }}>$</span> bill_to
          </div>
          <div style={{ fontSize: '13px', color: '#e6edf3' }}>{invoice.client.name}</div>
          <div style={{ fontSize: '11px', color: '#484f58' }}>{invoice.client.company || invoice.client.email}</div>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'issue_date', value: formatDate(invoice.issue_date) },
              { label: 'due_date', value: formatDate(invoice.due_date) },
              { label: 'currency', value: invoice.currency },
              invoice.project_ref ? { label: 'ref', value: invoice.project_ref } : null,
            ].filter(Boolean).map(item => (
              <div key={item!.label}>
                <div style={{ fontSize: '9px', color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{item!.label}</div>
                <div style={{ fontSize: '11px', color: '#79c0ff' }}>{item!.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid #30363d` }}>
            {['description', 'qty', 'unit_price', 'vat', 'total'].map((h, i) => (
              <th key={h} style={{ padding: '0 16px 10px 0', fontSize: '9px', fontWeight: 400, color: '#484f58', textTransform: 'lowercase', letterSpacing: '0.05em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #21262d' }}>
              <td style={{ padding: '12px 16px 12px 0', fontSize: '12px', color: '#c9d1d9' }}>{item.description}</td>
              <td style={{ padding: '12px 0', fontSize: '11px', color: '#8b949e', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '12px 0', fontSize: '11px', color: '#8b949e', textAlign: 'right' }}>{s}{item.unit_price.toFixed(2)}</td>
              <td style={{ padding: '12px 0', fontSize: '11px', color: '#8b949e', textAlign: 'right' }}>{item.vat_rate}%</td>
              <td style={{ padding: '12px 0', fontSize: '11px', color: '#e6edf3', textAlign: 'right', fontWeight: 600 }}>{s}{(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '240px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '16px' }}>
          {[
            { label: 'subtotal', value: `${s}${(invoice.subtotal || 0).toFixed(2)}` },
            invoice.discount_amount ? { label: 'discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}` } : null,
            { label: 'vat', value: `${s}${(invoice.vat_total || 0).toFixed(2)}` },
          ].filter(Boolean).map(item => (
            <div key={item!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', color: '#8b949e' }}>
              <span>{item!.label}</span><span>{item!.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: '8px', borderTop: `1px solid ${accent}`, fontSize: '16px', fontWeight: 700, color: accent }}>
            <span>total</span><span>{s}{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: '32px', fontSize: '11px', color: '#484f58', lineHeight: 1.8, paddingTop: '20px', borderTop: '1px solid #21262d' }}>
          // {invoice.notes}
        </div>
      )}
    </div>
  )
}