'use client'

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react'
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
  const [focusedCell, setFocusedCell] = useState<{ row: number; field: string } | null>(null)
  const cellInputRef = useRef<HTMLInputElement | null>(null)
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
    const newItems = [...items, newItem]
    onChange(newItems)
    setShowCatalog(false)
    setTimeout(() => {
      setFocusedCell({ row: newItems.length - 1, field: 'description' })
    }, 50)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0)

  // Tab navigation between cells
  const handleCellKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const fields = ['description', 'quantity', 'unit_price', 'vat_rate', 'discount_percent']
    const currentFieldIndex = fields.indexOf(field)

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          setFocusedCell({ row: rowIndex, field: fields[currentFieldIndex - 1] })
        } else if (rowIndex > 0) {
          setFocusedCell({ row: rowIndex - 1, field: fields[fields.length - 1] })
        }
      } else {
        if (currentFieldIndex < fields.length - 1) {
          setFocusedCell({ row: rowIndex, field: fields[currentFieldIndex + 1] })
        } else if (rowIndex < items.length - 1) {
          setFocusedCell({ row: rowIndex + 1, field: fields[0] })
        } else {
          addItem()
        }
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (rowIndex < items.length - 1) {
        setFocusedCell({ row: rowIndex + 1, field: fields[0] })
      } else {
        addItem()
      }
    }

    if (e.key === 'Escape') {
      setFocusedCell(null)
    }
  }, [items.length, addItem])

  // Focus the ref when focusedCell changes
  useEffect(() => {
    if (focusedCell && cellInputRef.current) {
      cellInputRef.current.focus()
      cellInputRef.current.select()
    }
  }, [focusedCell])

  const isFocusing = (row: number, field: string) =>
    focusedCell?.row === row && focusedCell?.field === field

  const filtered = savedProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Grid columns: drag | # | description | qty | rate | vat | disc | total | delete
  const GRID_COLS = '28px 32px 1fr 90px 110px 90px 80px 100px 32px'

  const cellInputStyle = (isActive: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: isActive ? '1.5px solid #10b981' : '1px solid transparent',
    background: isActive ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.1s, background 0.1s',
  })

  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLS,
    gap: '4px',
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    alignItems: 'center',
  }

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLS,
    gap: '4px',
    padding: '6px 12px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.1s',
  }

  const numericFields = ['quantity', 'unit_price', 'vat_rate', 'discount_percent']

  // Helper to render an editable cell
  const renderCell = (
    rowIndex: number,
    field: keyof LineItem,
    value: string | number,
    placeholder: string,
    extraProps: React.InputHTMLAttributes<HTMLInputElement> = {},
    displayFn?: (v: number) => string
  ) => {
    const isActive = isFocusing(rowIndex, field)
    const displayValue = (typeof value === 'number' && displayFn)
      ? displayFn(value)
      : String(value ?? '')
    const isNumeric = numericFields.includes(field)
    const textAlign: React.CSSProperties['textAlign'] = isNumeric ? 'right' : 'left'

    return (
      <input
        ref={isActive ? cellInputRef : null}
        type={field === 'description' ? 'text' : 'number'}
        value={isActive ? (cellInputRef.current?.value ?? displayValue) : displayValue}
        defaultValue={displayValue}
        placeholder={placeholder}
        min={extraProps.min}
        max={extraProps.max}
        step={extraProps.step}
        onFocus={() => setFocusedCell({ row: rowIndex, field })}
        onBlur={e => {
          let val: string | number = e.target.value
          if (isNumeric) val = parseFloat(val as string) || 0
          updateItem(rowIndex, { [field]: val } as Partial<LineItem>)
          setTimeout(() => {
            if (!isFocusing(rowIndex, field)) setFocusedCell(null)
          }, 50)
        }}
        onChange={e => {
          const val = field === 'description' ? e.target.value : (parseFloat(e.target.value) || 0)
          const newItems = items.map((item, i) =>
            i !== rowIndex ? item : { ...item, [field]: val } as LineItem
          )
          onChange(newItems)
        }}
        onKeyDown={e => handleCellKeyDown(e, rowIndex, field)}
        style={{ ...cellInputStyle(isActive), textAlign }}
        {...extraProps}
      />
    )
  }

  const catalogInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px',
  }

  const catalogBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    textAlign: 'left' as const,
  }

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      <style>{`
        .line-item-add-btn:hover {
          border-color: rgba(16,185,129,0.4) !important;
          color: #10b981 !important;
          background: rgba(16,185,129,0.06) !important;
        }
        .line-item-remove-btn:not(:disabled):hover {
          background: rgba(239,68,68,0.1) !important;
          color: #f87171 !important;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '20px', height: '20px', borderRadius: '6px',
            background: 'rgba(16,185,129,0.15)', color: '#10b981',
            fontSize: '12px', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>2</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>Line Items</span>
          <span style={{ fontSize: '12px', color: '#52525B' }}>— click a cell to edit, Tab to navigate</span>
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
            style={catalogInputStyle}
          />
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.length === 0 && (
              <p style={{ fontSize: '12px', color: '#52525B', textAlign: 'center', padding: '12px' }}>
                No products found
              </p>
            )}
            {filtered.map(p => (
              <button key={p.id} onClick={() => addItem(p)} style={catalogBtnStyle}>
                <span style={{ fontSize: '13px', color: '#FAFAFA' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#71717A' }}>{symbol}{p.unit_price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table header */}
      <div style={headerStyle}>
        {/* Drag handle placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="5" r="1.2" fill="#3F3F46" />
            <circle cx="9" cy="12" r="1.2" fill="#3F3F46" />
            <circle cx="9" cy="19" r="1.2" fill="#3F3F46" />
            <circle cx="15" cy="5" r="1.2" fill="#3F3F46" />
            <circle cx="15" cy="12" r="1.2" fill="#3F3F46" />
            <circle cx="15" cy="19" r="1.2" fill="#3F3F46" />
          </svg>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>#</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Qty</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Unit price</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>VAT %</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Disc %</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</span>
        <span></span>
      </div>

      {/* Rows */}
      <div>
        {items.map((item, index) => {
          const rowTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100)
          const isActive = focusedCell?.row === index

          return (
            <div
              key={item.id}
              style={{
                ...rowStyle,
                background: isActive ? 'rgba(16,185,129,0.03)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="5" r="1.2" fill="#3F3F46" />
                  <circle cx="9" cy="12" r="1.2" fill="#3F3F46" />
                  <circle cx="9" cy="19" r="1.2" fill="#3F3F46" />
                  <circle cx="15" cy="5" r="1.2" fill="#3F3F46" />
                  <circle cx="15" cy="12" r="1.2" fill="#3F3F46" />
                  <circle cx="15" cy="19" r="1.2" fill="#3F3F46" />
                </svg>
              </div>

              {/* Row number */}
              <div style={{ fontSize: '11px', color: '#3F3F46', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {index + 1}
              </div>

              {/* Description */}
              {renderCell(index, 'description', item.description, 'Web design services…')}

              {/* Quantity */}
              {renderCell(index, 'quantity', item.quantity, '1', { min: 0, step: 0.01 })}

              {/* Unit price */}
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '12px', color: '#52525B', pointerEvents: 'none', zIndex: 1,
                }}>{symbol}</span>
                {renderCell(index, 'unit_price', item.unit_price, '0.00', { min: 0, step: 0.01 }, v => v.toFixed(2))}
              </div>

              {/* VAT */}
              {renderCell(index, 'vat_rate', item.vat_rate, '21', { min: 0, max: 100, step: 0.1 })}

              {/* Discount */}
              {renderCell(index, 'discount_percent', item.discount_percent, '0', { min: 0, max: 100, step: 1 })}

              {/* Total (read-only, calculated in real-time) */}
              <div style={{
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FAFAFA',
                fontVariantNumeric: 'tabular-nums',
                paddingRight: '4px',
              }}>
                {symbol}{rowTotal.toFixed(2)}
              </div>

              {/* Delete */}
              <button
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="line-item-remove-btn"
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#3F3F46',
                  cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Add row — just + icon */}
      <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => addItem()}
          title="Add line item"
          className="line-item-add-btn"
          style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            border: '1px dashed rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#71717A',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            lineHeight: 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: '12px', color: '#52525B' }}>Add line item</span>
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