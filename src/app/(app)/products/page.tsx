'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  description: string | null
  unit_price: number
  unit: 'item' | 'hour' | 'day' | 'project'
  category: 'Services' | 'Products' | 'Custom'
  vat_rate: number
  is_active: boolean
  created_at: string
}

interface ProductForm {
  name: string
  description: string
  unit_price: string
  unit: Product['unit']
  category: Product['category']
  vat_rate: number
  is_active: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  unit_price: '',
  unit: 'item',
  category: 'Services',
  vat_rate: 21,
  is_active: true,
}

const UNITS = [
  { value: 'item', label: 'per item' },
  { value: 'hour', label: 'per hour' },
  { value: 'day', label: 'per day' },
  { value: 'project', label: 'per project' },
] as const

const CATEGORIES = ['Services', 'Products', 'Custom'] as const
const VAT_OPTIONS = [0, 20, 21, 19] as const
const CURRENCY = '€'

function formatPrice(price: number) {
  return `${CURRENCY}${price.toFixed(2)}`
}

function resetForm(): ProductForm {
  return { ...EMPTY_FORM }
}

function CardSkeleton() {
  return (
    <div style={{
      background: '#18181B',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: 20,
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ height: 20, width: '66%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ height: 20, width: 64, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ height: 12, width: '100%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
      <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ height: 24, width: 96, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ height: 32, width: 64, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  )
}

type ToastKind = 'success' | 'error'

function Toast({ message, kind, onDone }: { message: string; kind: ToastKind; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const isSuccess = kind === 'success'
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <span style={{ fontSize: 16 }}>{isSuccess ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}

function DeleteDialog({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', background: '#18181B', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Delete product?</h3>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>
          <span style={{ fontWeight: 500, color: '#fff' }}>{product.name}</span> will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#71717a', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: '#dc2626', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product
  onSave: (data: ProductForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ProductForm>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          unit_price: initial.unit_price.toString(),
          unit: initial.unit,
          category: initial.category,
          vat_rate: initial.vat_rate,
          is_active: initial.is_active,
        }
      : resetForm()
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({})

  function validate() {
    const e: Partial<Record<keyof ProductForm, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const price = parseFloat(form.unit_price)
    if (isNaN(price) || price < 0) e.unit_price = 'Enter a valid price'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      await onSave({ ...form, unit_price: form.unit_price })
    } finally {
      setSaving(false)
    }
  }

  function set(field: keyof ProductForm, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field as keyof typeof errors]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const inputStyle = (hasError?: string) => ({
    width: '100%',
    boxSizing: 'border-box',
    background: '#09090B',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>{initial ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} style={{ color: '#71717a', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 20, lineHeight: 1, transition: 'color 0.15s', padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Web Development"
              style={inputStyle(errors.name)}
            />
            {errors.name && <p style={{ marginTop: 4, fontSize: 12, color: '#f87171' }}>{errors.name}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional details..."
              rows={3}
              style={{ ...inputStyle(), resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Unit price *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: 14 }}>{CURRENCY}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unit_price}
                  onChange={e => set('unit_price', e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle(errors.unit_price), paddingLeft: 28 }}
                />
              </div>
              {errors.unit_price && <p style={{ marginTop: 4, fontSize: 12, color: '#f87171' }}>{errors.unit_price}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Unit</label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value as Product['unit'])}
                style={inputStyle()}
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value as Product['category'])}
                style={inputStyle()}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>VAT rate</label>
              <select
                value={form.vat_rate}
                onChange={e => set('vat_rate', Number(e.target.value))}
                style={inputStyle()}
              >
                {VAT_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#a1a1aa', margin: 0 }}>Active</p>
              <p style={{ fontSize: 12, color: '#71717a', margin: '2px 0 0' }}>Inactive products are hidden from new invoices</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              style={{
                position: 'relative',
                width: 44,
                height: 24,
                borderRadius: 999,
                transition: 'background 0.2s',
                background: form.is_active ? '#10b981' : '#3f3f46',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  transform: form.is_active ? 'translateX(23px)' : 'translateX(3px)',
                }}
              />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#71717a', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                background: '#10b981',
                border: 'none',
                color: '#000',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.6s linear infinite' }} />
                  Saving…
                </>
              ) : (
                initial ? 'Save changes' : 'Add product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'All' | Product['category']>('All')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  function showToast(message: string, kind: ToastKind) {
    setToast({ message, kind })
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data as Product[])
    } else {
      showToast('Failed to load products', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  async function handleSave(form: ProductForm) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit_price: parseFloat(form.unit_price),
      unit: form.unit,
      category: form.category,
      vat_rate: form.vat_rate,
      is_active: form.is_active,
    }

    let result
    if (editingProduct) {
      result = await supabase.from('products').update(payload).eq('id', editingProduct.id).select().single()
    } else {
      result = await supabase.from('products').insert(payload).select().single()
    }

    if (result?.error) {
      showToast(result.error.message || 'Failed to save product', 'error')
      return
    }

    await fetchProducts()
    setShowModal(false)
    setEditingProduct(null)
    showToast(editingProduct ? 'Product updated' : 'Product added', 'success')
  }

  async function handleDelete(product: Product) {
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      showToast(error.message || 'Failed to delete', 'error')
    } else {
      await fetchProducts()
      showToast('Product deleted', 'success')
    }
    setDeletingProduct(null)
  }

  const filtered = products.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const tabCounts: Record<string, number> = {
    All: products.length,
    Services: products.filter(p => p.category === 'Services').length,
    Products: products.filter(p => p.category === 'Products').length,
    Custom: products.filter(p => p.category === 'Custom').length,
  }

  const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    Services: { bg: 'rgba(29,78,216,0.15)', border: 'rgba(29,78,216,0.3)', text: '#93c5fd' },
    Products: { bg: 'rgba(126,34,206,0.15)', border: 'rgba(126,34,206,0.3)', text: '#c4b5fd' },
    Custom: { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.3)', text: '#fcd34d' },
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#09090B', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Products & Services</h1>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>Your saved items — click to add to any invoice</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', fontSize: 14, zIndex: 1 }}>🔍</div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  style={{ width: '100%', boxSizing: 'border-box', background: '#18181B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 14, color: '#fff', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
                />
              </div>
              <button
                onClick={() => { setEditingProduct(null); setShowModal(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', flexShrink: 0 }}
              >
                <span style={{ fontSize: 16 }}>+</span>
                Add Product
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
              {(['All', ...CATEGORIES] as const).map(tab => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      transition: 'all 0.15s',
                      background: isActive ? '#10b981' : 'transparent',
                      color: isActive ? '#fff' : '#71717a',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab}
                    <span style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                    }}>
                      {tabCounts[tab]}
                    </span>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#18181B', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24 }}>📦</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#a1a1aa', margin: 0 }}>{search ? 'No results found' : 'No products yet'}</p>
                  <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
                    {search ? 'No results match your search.' : 'Add your first product or service to get started.'}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => { setEditingProduct(null); setShowModal(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 16 }}>+</span>
                    Add your first product
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filtered.map(product => {
                  const catStyle = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Custom
                  return (
                    <div
                      key={product.id}
                      style={{
                        background: '#18181B',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'all 0.2s',
                        cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.4 }}>{product.name}</h3>
                        <span style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: catStyle.bg,
                          border: `1px solid ${catStyle.border}`,
                          color: catStyle.text,
                        }}>
                          {product.category}
                        </span>
                      </div>

                      {product.description && (
                        <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {product.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{formatPrice(product.unit_price)}</p>
                          <p style={{ fontSize: 12, color: '#71717a', marginTop: 2, margin: '2px 0 0' }}>
                            {UNITS.find(u => u.value === product.unit)?.label}
                            {product.vat_rate > 0 && ` · incl. ${product.vat_rate}% VAT`}
                          </p>
                        </div>

                        {!product.is_active && (
                          <span style={{ fontSize: 11, color: '#71717a', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 999 }}>
                            Inactive
                          </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => { setEditingProduct(product); setShowModal(true) }}
                            style={{ padding: 8, borderRadius: 8, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s, background 0.15s', fontSize: 16 }}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            style={{ padding: 8, borderRadius: 8, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s, background 0.15s', fontSize: 16 }}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <ProductModal
            initial={editingProduct ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingProduct(null) }}
          />
        )}

        {deletingProduct && (
          <DeleteDialog
            product={deletingProduct}
            onConfirm={() => handleDelete(deletingProduct)}
            onCancel={() => setDeletingProduct(null)}
          />
        )}

        {toast && (
          <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />
        )}
      </div>
    </>
  )
}