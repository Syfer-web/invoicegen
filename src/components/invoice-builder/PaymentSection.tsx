'use client'

import type { BankAccount } from '@/types/invoice'
import { PAYMENT_TERMS_OPTIONS, CURRENCY_SYMBOLS, Currency } from '@/types/invoice'

interface Props {
  paymentTerms: number
  onChangePaymentTerms: (v: number) => void
  bankAccount: BankAccount | null
  currency: Currency
  allowPartialPayment: boolean
  onChangeAllowPartialPayment: (v: boolean) => void
  earlyPaymentDiscountPercent: number
  earlyPaymentDays: number
  onChangeEarlyPaymentDiscount: (percent: number, days: number) => void
  stripeEnabled: boolean
}

export default function PaymentSection({
  paymentTerms, onChangePaymentTerms,
  bankAccount, currency,
  allowPartialPayment, onChangeAllowPartialPayment,
  earlyPaymentDiscountPercent, earlyPaymentDays, onChangeEarlyPaymentDiscount,
  stripeEnabled,
}: Props) {
  const symbol = CURRENCY_SYMBOLS[currency]

  const optionStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#71717A',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  const selectedStyle: React.CSSProperties = {
    ...optionStyle,
    border: '1px solid rgba(16,185,129,0.4)',
    background: 'rgba(16,185,129,0.08)',
    color: '#10b981',
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
        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', marginLeft: '10px' }}>Payment</span>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Payment terms */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment terms</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PAYMENT_TERMS_OPTIONS.map(days => (
              <button
                key={days}
                onClick={() => onChangePaymentTerms(days)}
                style={paymentTerms === days ? selectedStyle : optionStyle}
              >
                {days} days
              </button>
            ))}
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number"
                value={PAYMENT_TERMS_OPTIONS.includes(paymentTerms) ? '' : paymentTerms}
                onChange={e => onChangePaymentTerms(parseInt(e.target.value) || 0)}
                placeholder="Custom"
                style={{
                  ...optionStyle,
                  paddingLeft: '12px',
                  paddingRight: '32px',
                  width: '100%',
                  textAlign: 'center' as const,
                }}
              />
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#52525B' }}>days</span>
            </div>
          </div>
        </div>

        {/* Bank transfer details */}
        {bankAccount && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank transfer (shown on invoice)</p>
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '6px 16px',
              fontSize: '13px',
            }}>
              {bankAccount.account_holder && <><span style={{ color: '#71717A' }}>Account holder</span><span style={{ color: '#A1A1AA' }}>{bankAccount.account_holder}</span></>}
              {bankAccount.bank_name && <><span style={{ color: '#71717A' }}>Bank</span><span style={{ color: '#A1A1AA' }}>{bankAccount.bank_name}</span></>}
              {bankAccount.iban && <><span style={{ color: '#71717A' }}>IBAN</span><span style={{ color: '#A1A1AA', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{bankAccount.iban}</span></>}
              {bankAccount.swift_bic && <><span style={{ color: '#71717A' }}>SWIFT/BIC</span><span style={{ color: '#A1A1AA', fontFamily: 'monospace' }}>{bankAccount.swift_bic}</span></>}
              {bankAccount.sort_code && <><span style={{ color: '#71717A' }}>Sort code</span><span style={{ color: '#A1A1AA' }}>{bankAccount.sort_code}</span></>}
              {bankAccount.account_number && <><span style={{ color: '#71717A' }}>Account no.</span><span style={{ color: '#A1A1AA' }}>{bankAccount.account_number}</span></>}
            </div>
          </div>
        )}

        {/* Stripe payment link */}
        {stripeEnabled && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online payment</p>
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.12)',
              fontSize: '13px', color: '#10b981',
            }}>
              Stripe payment link will be created when you send this invoice. Client can pay by card.
            </div>
          </div>
        )}

        {/* Early payment discount */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Early payment discount</p>
            <span style={{ fontSize: '11px', color: '#52525B', fontWeight: 400 }}>(optional)</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#71717A' }}>Offer</span>
            <input
              type="number"
              value={earlyPaymentDiscountPercent}
              onChange={e => onChangeEarlyPaymentDiscount(parseFloat(e.target.value) || 0, earlyPaymentDays)}
              min="0" max="100" step="0.5"
              placeholder="0"
              style={{
                width: '70px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#FAFAFA',
                fontSize: '13px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '13px', color: '#71717A' }}>% discount if paid within</span>
            <input
              type="number"
              value={earlyPaymentDays}
              onChange={e => onChangeEarlyPaymentDiscount(earlyPaymentDiscountPercent, parseInt(e.target.value) || 0)}
              min="0"
              placeholder="7"
              style={{
                width: '60px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#FAFAFA',
                fontSize: '13px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '13px', color: '#71717A' }}>days</span>
          </div>
        </div>

        {/* Partial payment */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => onChangeAllowPartialPayment(!allowPartialPayment)}
              style={{
                width: '40px', height: '22px',
                borderRadius: '11px',
                background: allowPartialPayment ? '#10b981' : '#27272A',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px', left: allowPartialPayment ? '21px' : '3px',
                width: '16px', height: '16px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: '13px', color: '#A1A1AA' }}>Allow partial payments</span>
          </label>
        </div>
      </div>
    </div>
  )
}