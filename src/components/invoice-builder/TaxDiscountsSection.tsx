'use client'

import { useState } from 'react'
import type { LineItem } from '@/types/invoice'
import { CURRENCY_SYMBOLS, Currency } from '@/types/invoice'
import { calculateInvoiceTotals } from '@/types/invoice'

interface Props {
  items: LineItem[]
  discountAmount: number
  discountPercent: number
  onChangeDiscountAmount: (v: number) => void
  onChangeDiscountPercent: (v: number) => void
  currency: Currency
}

export default function TaxDiscountsSection({
  items, discountAmount, discountPercent,
  onChangeDiscountAmount, onChangeDiscountPercent,
  currency,
}: Props) {
  const symbol = CURRENCY_SYMBOLS[currency]
  const { subtotal, discount_amount, vat_total, total, vat_breakdown } = calculateInvoiceTotals(items, discountAmount)
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', marginLeft: '10px' }}>Tax & Discounts</span>
      </div>

      <div style={{ padding: '20px', display: 'flex', gap: '32px' }}>
        {/* Left: discount */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall discount</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {(['amount', 'percent'] as const).map(type => (
              <button
                key={type}
                onClick={() => setDiscountType(type)}
                style={{
                  flex: 1, padding: '6px',
                  borderRadius: '6px',
                  border: discountType === type ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: discountType === type ? 'rgba(16,185,129,0.08)' : 'transparent',
                  color: discountType === type ? '#10b981' : '#71717A',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                }}
              >
                {type === 'amount' ? `${symbol} Amount` : '% Percent'}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#52525B' }}>
              {discountType === 'amount' ? symbol : ''}
            </span>
            <input
              type="number"
              value={discountType === 'amount' ? discountAmount : discountPercent}
              onChange={e => {
                const v = parseFloat(e.target.value) || 0
                if (discountType === 'amount') onChangeDiscountAmount(v)
                else onChangeDiscountPercent(v)
              }}
              min="0"
              step="0.01"
              style={{ ...inputStyle, paddingLeft: discountType === 'amount' ? '26px' : '14px' }}
              placeholder="0.00"
            />
            {discountType === 'percent' && (
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#52525B' }}>%</span>
            )}
          </div>
        </div>

        {/* Right: VAT breakdown */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VAT breakdown</p>
          {vat_breakdown.length === 0 && (
            <p style={{ fontSize: '12px', color: '#52525B' }}>Add line items to see breakdown</p>
          )}
          {vat_breakdown.map(vb => (
            <div key={vb.rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#71717A' }}>{vb.rate}% on {symbol}{vb.net.toFixed(2)}</span>
              <span style={{ color: '#A1A1AA' }}>{symbol}{vb.vat.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>Total VAT</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>{symbol}{vat_total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

