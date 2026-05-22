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
  onProductSaved?: (product: { id: string; name: string; unit_price: number; unit: string; vat_rate: number }) => void
}

export default function LineItemsSection({ items, onChange, currency, defaultVatRate, savedProducts, onProductSaved }: Props) {
  const [showCatalog, setShowCatalog] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', unit_price: 0, unit: 'item', category: 'Services', vat_rate: 21 })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productSaved, setProductSaved] = useState(false)
  const [productError, setProductError] = useState('')
  const [focusedCell, setFocusedCell] = useState<{ row: number; field: string } | null>(null)
  const cellInputRef = useRef<HTMLInputElement | null>(null)
  const symbol = CURRENCY_SYMBOLS[currency]

  // Autocomplete state
  const [autocompleteState, setAutocompleteState] = useState<{
    rowIndex: number
    inputValue: string
    visible: boolean
    activeIndex: number
  }>({ rowIndex: -1, inputValue: '', visible: false, activeIndex: -1})
  const autocompleteRef = useRef<HTMLDivElement>(null)

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
    closeAutocomplete()
    setTimeout(() => {
      setFocusedCell({ row: newItems.length - 1, field: 'description' })
    }, 50)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.unit_price) {
      setProductError('Name and price are required.')
      return
    }
    setSavingProduct(true)
    setProductError('')
    try {
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: companies } = await supabase.from('companies').select('id').eq('user_id', user.id).eq('is_active', true).limit(1)
      const companyId = companies?.[0]?.id
      if (!companyId) throw new Error('No company found')

      const { data: saved, error } = await supabase.from('products').insert({
        company_id: companyId,
        name: productForm.name,
        unit_price: productForm.unit_price,
        unit: productForm.unit,
        category: productForm.category,
        vat_rate: productForm.vat_rate,
        is_active: true,
      }).select('id, name, unit_price, unit, vat_rate').single()

      if (error) {
        if (error.code === '23505') {
          setProductError('A product with this name already exists.')
        } else {
          throw error
        }
        return
      }

      if (saved && onProductSaved) onProductSaved(saved)
      setProductSaved(true)
      setTimeout(() => setProductSaved(false), 3000)
    } catch (err: any) {
      setProductError(err.message || 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    closeAutocomplete()
    onChange(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0)

  // Autocomplete helpers
  const closeAutocomplete = () => {
    setAutocompleteState(prev => ({ ...prev, visible: false, activeIndex: -1 }))
  }

  const openAutocomplete = (rowIndex: number, inputValue: string) => {
    const filtered = savedProducts
      .filter(p => p.name.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 5)
    setAutocompleteState({ rowIndex, inputValue, visible: filtered.length > 0, activeIndex: -1 })
  }

  const getAutocompleteResults = () => {
    if (autocompleteState.inputValue.length < 2) return []
    return savedProducts
      .filter(p => p.name.toLowerCase().includes(autocompleteState.inputValue.toLowerCase()))
      .slice(0, 5)
  }

  const selectAutocompleteItem = (product: typeof savedProducts[0]) => {
    updateItem(autocompleteState.rowIndex, { description: product.name, unit_price: product.unit_price, unit: product.unit, vat_rate: product.vat_rate } as Partial<LineItem>)
    closeAutocomplete()
    // move to quantity cell
    setTimeout(() => setFocusedCell({ row: autocompleteState.rowIndex, field: 'quantity' }), 30)
  }

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        closeAutocomplete()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tab navigation between cells
  const handleCellKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const fields = ['description', 'quantity', 'unit_price', 'vat_rate', 'discount_percent']
    const currentFieldIndex = fields.indexOf(field)

    // Autocomplete navigation for description field
    if (field === 'description' && autocompleteState.visible) {
      const results = getAutocompleteResults()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setAutocompleteState(prev => ({ ...prev, activeIndex: Math.min(prev.activeIndex + 1, results.length - 1) }))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setAutocompleteState(prev => ({ ...prev, activeIndex: Math.max(prev.activeIndex - 1, -1) }))
        return
      }
      if (e.key === 'Enter' && autocompleteState.activeIndex >= 0) {
        e.preventDefault()
        selectAutocompleteItem(results[autocompleteState.activeIndex])
        return
      }
      if (e.key === 'Escape') {
        closeAutocomplete()
        return
      }
    }

    // Close autocomplete on Tab out of description
    if (field === 'description' && e.key === 'Tab') {
      closeAutocomplete()
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          setFocusedCell({ row: rowIndex, field: fields[currentFieldIndex - 1] })
        } else if (rowIndex > 0) {
          setFocusedCell({ row: rowIndex - 1, field: fields[fields.length - 1] })
        }
      } else {
        closeAutocomplete()
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
      closeAutocomplete()
      if (rowIndex < items.length - 1) {
        setFocusedCell({ row: rowIndex + 1, field: fields[0] })
      } else {
        addItem()
      }
    }

    if (e.key === 'Escape') {
      closeAutocomplete()
      setFocusedCell(null)
    }
  }, [items.length, addItem, autocompleteState, getAutocompleteResults, selectAutocompleteItem])

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
    background: isActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
    boxShadow: isActive ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
  })

  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLS,
    gap: '4px',
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    alignItems: 'center',
  }

  const rowStyle = (isFilled: boolean, isActiveRow: boolean): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: GRID_COLS,
    gap: '4px',
    padding: '6px 12px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    background: isActiveRow
      ? 'rgba(16,185,129,0.04)'
      : isFilled
        ? 'rgba(255,255,255,0.035)'
        : 'transparent',
    transition: 'background 0.2s ease',
  })

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
    const isDescription = field === 'description'

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
        onFocus={() => {
          setFocusedCell({ row: rowIndex, field })
          if (isDescription) {
            const currentVal = items[rowIndex]?.description ?? ''
            openAutocomplete(rowIndex, currentVal)
          }
        }}
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
          if (isDescription) {
            openAutocomplete(rowIndex, e.target.value)
          }
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

  // Top 4 products for quick-add
  const topProducts = savedProducts.slice(0, 4)

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'visible',
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
        .quick-pill:hover {
          border-color: rgba(16,185,129,0.5) !important;
          background: rgba(16,185,129,0.08) !important;
          color: #10b981 !important;
          transform: translateY(-1px);
        }
        .autocomplete-item:hover,
        .autocomplete-item.active {
          background: rgba(16,185,129,0.1) !important;
        }
        .row-hover:hover {
          background: rgba(255,255,255,0.025) !important;
        }
        .line-items-row input[type="number"]::-webkit-inner-spin-button,
        .line-items-row input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .line-items-row input[type="number"] {
          -moz-appearance: textfield;
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

      {/* Quick-add pill bar — only show when there are saved products */}
      {topProducts.length > 0 && (
        <div style={{
          padding: '10px 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '11px', color: '#52525B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Quick add</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {topProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="quick-pill"
                title={`${product.name} — ${symbol}${product.unit_price.toFixed(2)}`}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#A1A1AA',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>{product.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>{symbol}{product.unit_price.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Catalog panel */}
      {showCatalog && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(16,185,129,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Search products..."
            style={catalogInputStyle}
          />
          <button
            onClick={() => { setShowProductModal(true); setProductForm({ name: '', unit_price: 0, unit: 'item', category: 'Services', vat_rate: 21 }); setProductError('') }}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              border: '1px solid rgba(16,185,129,0.4)',
              background: 'rgba(16,185,129,0.1)', color: '#10b981',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >+ New product</button>
        </div>
        <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filtered.length === 0 && !productSearch && (
            <p style={{ fontSize: '12px', color: '#52525B', textAlign: 'center', padding: '12px' }}>
              No saved products yet — add one above.
            </p>
          )}
            {filtered.map(p => (
              <button key={p.id} onClick={() => addItem(p)} style={catalogBtnStyle}>
                <span style={{ fontSize: '13px', color: '#FAFAFA' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#71717A' }}>{symbol}{p.unit_price.toFixed(2)}</span>
              </button>
            ))}
            {filtered.length === 0 && productSearch && (
              <p style={{ fontSize: '12px', color: '#52525B', textAlign: 'center', padding: '8px' }}>
                No products match — click "New product" above.
              </p>
            )}
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
          const isActiveRow = focusedCell?.row === index
          const isFilled = !!item.description && item.description.trim().length > 0
          const isDescriptionFocused = isFocusing(index, 'description')
          const showAutocomplete = autocompleteState.visible && autocompleteState.rowIndex === index
          const autocompleteResults = getAutocompleteResults()

          return (
            <div
              key={item.id}
              style={rowStyle(isFilled, isActiveRow)}
              className="row-hover"
              onMouseEnter={e => {
                if (!isActiveRow) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'
              }}
              onMouseLeave={e => {
                if (!isActiveRow) (e.currentTarget as HTMLDivElement).style.background = isFilled ? 'rgba(255,255,255,0.035)' : 'transparent'
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

              {/* Description cell with autocomplete */}
              <div style={{ position: 'relative' }}>
                <div style={isDescriptionFocused ? { position: 'relative' } : {}}>
                  {renderCell(index, 'description', item.description, 'Web design services…')}
                </div>
                {/* Autocomplete dropdown */}
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '0',
                      right: '0',
                      zIndex: 50,
                      background: '#1C1C1F',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    {autocompleteResults.map((product, prodIndex) => (
                      <button
                        key={product.id}
                        className={`autocomplete-item${autocompleteState.activeIndex === prodIndex ? ' active' : ''}`}
                        onClick={() => selectAutocompleteItem(product)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: autocompleteState.activeIndex === prodIndex ? 'rgba(16,185,129,0.12)' : 'transparent',
                          border: 'none',
                          borderBottom: prodIndex < autocompleteResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.1s',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#FAFAFA' }}>{product.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#71717A' }}>{product.unit}</span>
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{symbol}{product.unit_price.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="line-items-row">
                {renderCell(index, 'quantity', item.quantity, '1', { min: 0, step: 0.01 })}
              </div>

              {/* Unit price */}
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '12px', color: '#52525B', pointerEvents: 'none', zIndex: 1,
                }}>{symbol}</span>
                <div className="line-items-row">
                  {renderCell(index, 'unit_price', item.unit_price, '0.00', { min: 0, step: 0.01 }, v => v.toFixed(2))}
                </div>
              </div>

              {/* VAT */}
              <div className="line-items-row">
                {renderCell(index, 'vat_rate', item.vat_rate, '21', { min: 0, max: 100, step: 0.1 })}
              </div>

              {/* Discount */}
              <div className="line-items-row">
                {renderCell(index, 'discount_percent', item.discount_percent, '0', { min: 0, max: 100, step: 1 })}
              </div>

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

      {/* New product modal */}
      {showProductModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowProductModal(false) }}
        >
          <div style={{
            background: '#18181B', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
            padding: '28px', width: '100%', maxWidth: '420px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>New product</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>Product name *</label>
                <input type="text" value={productForm.name}
                  onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Web design services"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#FAFAFA', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>Unit price *</label>
                  <input type="number" value={productForm.unit_price || ''}
                    onChange={e => setProductForm(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#FAFAFA', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>Unit</label>
                  <select value={productForm.unit}
                    onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: '#18181B', color: '#FAFAFA', fontSize: '14px', outline: 'none' }}>
                    <option value="item">per item</option>
                    <option value="hour">per hour</option>
                    <option value="day">per day</option>
                    <option value="project">per project</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>Category</label>
                  <select value={productForm.category}
                    onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: '#18181B', color: '#FAFAFA', fontSize: '14px', outline: 'none' }}>
                    <option value="Services">Services</option>
                    <option value="Products">Products</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>VAT rate %</label>
                  <input type="number" value={productForm.vat_rate}
                    onChange={e => setProductForm(p => ({ ...p, vat_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="21"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#FAFAFA', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              {productError && <p style={{ fontSize: '12px', color: '#F87171', margin: 0 }}>{productError}</p>}
              {productSaved && <p style={{ fontSize: '12px', color: '#10b981', margin: 0 }}>Product saved ✓</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={handleSaveProduct} disabled={savingProduct}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: savingProduct ? 'wait' : 'pointer' }}>
                  {savingProduct ? 'Saving...' : 'Save product'}
                </button>
                <button onClick={() => setShowProductModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}