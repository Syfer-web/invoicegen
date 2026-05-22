'use client'

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS, InvoiceType } from '@/types/invoice'
import { calculateInvoiceTotals } from '@/types/invoice'

interface Props {
  invoice: Invoice
}

const TYPE_LABELS: Record<InvoiceType, string> = {
  standard: 'INVOICE',
  quote: 'QUOTE',
  proforma: 'PROFORMA INVOICE',
  credit_note: 'CREDIT NOTE',
  recurring: 'RECURRING INVOICE',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

export default function LivePreview({ invoice }: Props) {
  const symbol = CURRENCY_SYMBOLS[invoice.currency]
  const { subtotal, discount_amount, vat_total, total, vat_breakdown } = calculateInvoiceTotals(invoice.items, invoice.discount_amount)
  const company = invoice.company

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.12)',
      position: 'sticky',
      top: '96px',
    }}>
      {/* PDF-like header */}
      <div style={{ padding: '28px 32px', borderBottom: '3px solid ' + (invoice.accent_color || '#10b981') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} style={{ height: '36px', width: 'auto' }} />
            ) : (
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#000' }}>{company?.name || 'Your Company'}</div>
            )}
            {company && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.5 }}>
                {company.address && <span>{company.address}<br /></span>}
                {company.city && company.postcode && <span>{company.postcode} {company.city}<br /></span>}
                {company.email && <span>{company.email}</span>}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: invoice.accent_color || '#10b981', letterSpacing: '-0.02em' }}>
              {TYPE_LABELS[invoice.type]}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>#{invoice.invoice_number}</div>
          </div>
        </div>
      </div>

      {/* Bill to / dates */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Bill to</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{invoice.client.name || 'Client name'}</div>
          {invoice.client.company && <div style={{ fontSize: '12px', color: '#6b7280' }}>{invoice.client.company}</div>}
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{invoice.client.email}</div>
          {invoice.client.address && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{invoice.client.address}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Issue date</div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{formatDate(invoice.issue_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Due date</div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{formatDate(invoice.due_date)}</div>
          </div>
          {invoice.project_ref && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Project</div>
              <div style={{ fontSize: '12px', color: '#374151' }}>{invoice.project_ref}</div>
            </div>
          )}
          {invoice.order_number && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Order no.</div>
              <div style={{ fontSize: '12px', color: '#374151' }}>{invoice.order_number}</div>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div style={{ padding: '20px 32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '0 8px 8px 0', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', width: '60px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', width: '80px' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', width: '50px' }}>VAT</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', width: '80px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.filter(i => i.description).length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px 0', textAlign: 'center', fontSize: '12px', color: '#d1d5db' }}>
                  Add line items to see them here
                </td>
              </tr>
            )}
            {invoice.items.filter(i => i.description).map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '10px 8px 10px 0', fontSize: '13px', color: '#374151' }}>
                  {item.description}
                  {item.discount_percent > 0 && <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px' }}>(-{item.discount_percent}%)</span>}
                </td>
                <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', color: '#6b7280' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', color: '#6b7280' }}>{symbol}{item.unit_price.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', color: '#6b7280' }}>{item.vat_rate}%</td>
                <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '13px', fontWeight: 600, color: '#111' }}>
                  {symbol}{(item.quantity * item.unit_price * (1 - item.discount_percent / 100)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '16px 32px 24px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#6b7280' }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{subtotal.toFixed(2)}</span>
            </div>
            {discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#10b981' }}>
                <span>Discount</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{symbol}{discount_amount.toFixed(2)}</span>
              </div>
            )}
            {vat_breakdown.map(vb => (
              <div key={vb.rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                <span>VAT {vb.rate}%</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{vb.vat.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid #e5e7eb', marginTop: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>Total ({invoice.currency})</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: invoice.accent_color || '#10b981', fontVariantNumeric: 'tabular-nums' }}>{symbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '16px 32px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Notes</div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{invoice.notes}</div>
        </div>
      )}

      {/* Payment terms */}
      {(invoice.payment_terms_text || invoice.payment_terms) && (
        <div style={{ padding: '12px 32px 20px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Payment terms</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>
            {invoice.payment_terms_text || `Payment due within ${invoice.payment_terms} days`}
          </div>
        </div>
      )}
    </div>
  )
}