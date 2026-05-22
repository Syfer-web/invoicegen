'use client'

import { useState } from 'react'
import type { LineItem } from '@/types/invoice'
import { VAT_RATES, CURRENCY_SYMBOLS, Currency } from '@/types/invoice'
import { createEmptyLineItem } from '@/types/invoice'

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  currency: Currency
  defaultVatRate: number
  savedProducts: { id: string; name: string; unit_price: number; unit: string; vat_rate: number }[]
}

export default function LineItemsSection({ items, onChange, currency, defaultVatRate, savedProducts }: Props) {
  const [showCatalog, setShowCatalog] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const symbol = CURRENCY_SYMBOLS[currency]

  const updateItem = (index: number, updates: Partial<LineItem>) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      return { ...item, ...updates }
    })
    onChange(updated)
  }

  const addItem = (fromProduct?: typeof savedProducts[0]) => {
    const newItem = fromProduct
      ? { ...createEmptyLineItem(fromProduct.vat_rate), description: fromProduct.name, unit_price: fromProduct.unit_price, unit: fromProduct.unit }
      : { ...createEmptyLineItem(defaultVatRate) }
    onChange([...items, newItem])
    setShowCatalog(false)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0)

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

  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '3fr 80px 100px 100px 80px 80px 32px',
    gap: '8px',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '3fr 80px 100px 100px 80px 80px 32px',
    gap: '8px',
    padding: '8px 12px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  }

  const filtered = savedProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>Line Items</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#71717A' }}>
            {items.filter(i => i.description).length} items — {symbol}{subtotal.toFixed(2)}
          </span>
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: showCatalog ? 'rgba(16,185,129,0.08)' : 'transparent',
              color: showCatalog ? '#10b981' : '#71717A',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Add from catalog
          </button>
        </div>
      </div>

      {/* Catalog panel */}
      {showCatalog && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(16,185,129,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <input
            type="text"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Search products..."
            style={{ ...inputStyle, marginBottom: '8px' }}
          />
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.length === 0 && (
              <p style={{ fontSize: '12px', color: '#52525B', textAlign: 'center', padding: '12px' }}>No products found</p>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13px', color: '#FAFAFA' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#71717A' }}>{symbol}{p.unit_price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table header */}
      <div style={headerStyle}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit price</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VAT</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disc %</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</span>
        <span></span>
      </div>

      {/* Rows */}
      <div>
        {items.map((item, index) => (
          <div key={item.id} style={rowStyle}>
            <input
              type="text"
              value={item.description}
              onChange={e => updateItem(index, { description: e.target.value })}
              placeholder="Web design services"
              style={inputStyle}
            />
            <input
              type="number"
              value={item.quantity}
              onChange={e => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
              min="0" step="0.01"
              style={inputStyle}
            />
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#52525B' }}>{symbol}</span>
              <input
                type="number"
                value={item.unit_price}
                onChange={e => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                min="0" step="0.01"
                style={{ ...inputStyle, paddingLeft: '22px' }}
              />
            </div>
            <select
              value={item.vat_rate}
              onChange={e => updateItem(index, { vat_rate: parseFloat(e.target.value) })}
              style={inputStyle}
            >
              {VAT_RATES.map(r => <option key={r.value} value={r.value} style={{ background: '#18181B' }}>{r.label}</option>)}
            </select>
            <input
              type="number"
              value={item.discount_percent}
              onChange={e => updateItem(index, { discount_percent: parseFloat(e.target.value) || 0 })}
              min="0" max="100"
              style={inputStyle}
            />
            <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#FAFAFA', fontVariantNumeric: 'tabular-nums' }}>
              {symbol}{(item.quantity * item.unit_price * (1 - item.discount_percent / 100)).toFixed(2)}
            </div>
            <button
              onClick={() => removeItem(index)}
              style={{
                width: '28px', height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#52525B',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div style={{ padding: '12px 20px' }}>
        <button
          onClick={() => addItem()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px dashed rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#71717A',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add line item
        </button>
      </div>

      {/* Totals summary */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#71717A' }}>Subtotal</span>
              <span style={{ color: '#A1A1AA' }}>{symbol}{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}