'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  calculateNextRun,
  getNextRuns,
  formatCurrency,
  formatDate,
  getFrequencyLabel,
  isDueSoon,
  isOverdue,
  type Frequency,
  type TemplateItem,
} from '@/lib/recurring'

// ─── Types ───────────────────────────────────────────────────────────────────

type RecurringProfile = {
  id: string
  name: string
  client_id: string | null
  frequency: Frequency
  start_date: string
  next_run: string | null
  auto_send: boolean
  template_items: TemplateItem[]
  template_notes: string | null
  template_currency: string
  template_vat_rate: number
  is_active: boolean
  last_generated: string | null
  created_at: string
  clients?: { name: string; email: string } | null
}

type Client = { id: string; name: string; email: string }
type Product = { id: string; name: string; unit_price: number; unit: string; vat_rate: number }

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 },
  headerLeft: {},
  title: { fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 4 },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#10b981', color: '#000', border: 'none', borderRadius: 12,
    padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 },
  card: (isActive: boolean) => ({
    borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    opacity: isActive ? 1 : 0.6,
    transition: 'all 0.2s',
  }),
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  cardName: { fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 },
  cardClient: { fontSize: 12, color: '#71717a', marginTop: 2 },
  badge: (color: string) => ({
    display: 'inline-flex', alignItems: 'center',
    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
    border: `1px solid ${color}33`,
    background: `${color}15`, color,
  }),
  autoSendBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
    border: '1px solid #3b82f633', background: '#3b82f615', color: '#60a5fa',
    marginLeft: 6,
  },
  toggle: (on: boolean) => ({
    position: 'relative' as const, width: 36, height: 20, borderRadius: 999,
    background: on ? '#10b981' : '#3f3f46', border: 'none', cursor: 'pointer',
    transition: 'background 0.2s', flexShrink: 0,
  }),
  toggleKnob: (on: boolean) => ({
    position: 'absolute' as const, top: 3, width: 14, height: 14, borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
    transform: on ? 'translateX(19px)' : 'translateX(3px)',
  }),
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 },
  stat: { background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px' },
  statLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#71717a', marginBottom: 3 },
  statValue: { fontSize: 13, fontWeight: 600, color: '#fff' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' },
  lastGen: { fontSize: 12, color: '#52525b' },
  actions: { display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s' } as any,
  iconBtn: (color: string) => ({
    width: 30, height: 30, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color, transition: 'all 0.15s',
  }),
  // Modal
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    padding: 16,
  },
  modal: {
    position: 'relative' as const, width: '100%', maxWidth: 520,
    background: '#111115', borderRadius: 16, padding: 28,
    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, background: 'transparent',
    border: 'none', cursor: 'pointer', color: '#71717a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  stepRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  stepCircle: (active: boolean) => ({
    width: 24, height: 24, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600,
    background: active ? '#10b981' : 'transparent',
    border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
    color: active ? '#000' : '#71717a',
    transition: 'all 0.15s',
  }),
  stepLabel: (active: boolean) => ({ fontSize: 12, color: active ? '#fff' : '#71717a' }),
  divider: { flex: 1, height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#fff',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
  },
  freqGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  freqBtn: (selected: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
    border: selected ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
    background: selected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
    color: selected ? '#10b981' : '#71717a',
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
  }),
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  nextDates: { marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' },
  nextDatesTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#71717a', marginBottom: 8 },
  nextDatesList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  nextDateItem: (upcoming: boolean) => ({
    fontSize: 13, color: upcoming ? '#10b981' : '#52525b',
    fontWeight: upcoming ? 500 : 400,
  }),
  productItem: (selected: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
    border: selected ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
    background: selected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
    transition: 'all 0.15s', width: '100%',
  }),
  selectedItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 8 },
  btnSecondary: {
    flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#71717a',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  btnSubmit: (disabled: boolean) => ({
    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
    background: disabled ? '#3f3f46' : '#10b981',
    color: disabled ? '#71717a' : '#000',
    fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
  }),
  spinner: {
    display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
    animation: 'spin 0.6s linear infinite', marginRight: 8,
  },
  toastContainer: { position: 'fixed' as const, bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  toast: (type: string) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 12,
    fontSize: 14, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideIn 0.3s ease',
    border: type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
    background: type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
    color: type === 'success' ? '#6ee7b7' : '#fca5a5',
  }),
  emptyState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' as const },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#71717a', marginBottom: 24, maxWidth: 320 },
  skeleton: { borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', animation: 'pulse 2s infinite' },
  skeletonLine: (w: string, h: string) => ({ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }),
  deleteOverlay: {
    position: 'fixed' as const, inset: 0, zIndex: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16,
  },
  deleteBox: {
    position: 'relative' as const, width: '100%', maxWidth: 380,
    background: '#111115', borderRadius: 16, padding: 24,
    border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  deleteTitle: { fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 },
  deleteDesc: { fontSize: 14, color: '#71717a', marginBottom: 20 },
  deleteBtnRow: { display: 'flex', gap: 8 },
  deleteBtnCancel: {
    flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#71717a',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  deleteBtnConfirm: {
    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
    background: '#ef4444', color: '#fff',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
}

// ─── Keyframe injection ──────────────────────────────────────────────────────

const styleTag = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.card-group:hover .card-actions { opacity: 1 !important; }
`

if (typeof document !== 'undefined') {
  const el = document.createElement('style')
  el.textContent = styleTag
  document.head.appendChild(el)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FREQ_COLORS: Record<string, string> = {
  weekly: '#3b82f6',
  biweekly: '#a855f7',
  monthly: '#10b981',
  quarterly: '#f59e0b',
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={S.toast(type) as any}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {type === 'success'
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
      </svg>
      {message}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={S.skeleton}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={S.skeletonLine('180px', '16px')} />
          <div style={S.skeletonLine('120px', '12px')} />
        </div>
        <div style={S.skeletonLine('36px', '20px')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={S.skeletonLine('100%', '60px')} />
        <div style={S.skeletonLine('100%', '60px')} />
        <div style={S.skeletonLine('100%', '60px')} />
      </div>
      <div style={S.skeletonLine('100%', '1px')} />
    </div>
  )
}

// ─── Preview Next Run Dates ───────────────────────────────────────────────────

function NextRunPreview({ startDate, frequency }: { startDate: string; frequency: Frequency }) {
  const runs = getNextRuns(new Date(startDate), frequency, 3)
  return (
    <div style={S.nextDates}>
      <div style={S.nextDatesTitle}>Next 3 run dates</div>
      <div style={S.nextDatesList}>
        {runs.map((d, i) => (
          <div key={i} style={S.nextDateItem(i === 0)}>
            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Create/Edit Modal ───────────────────────────────────────────────────────

function RecurringModal({
  profile,
  clients,
  products,
  onSave,
  onClose,
}: {
  profile?: RecurringProfile
  clients: Client[]
  products: Product[]
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    client_id: profile?.client_id || '',
    frequency: (profile?.frequency || 'monthly') as Frequency,
    start_date: profile?.start_date || new Date().toISOString().split('T')[0],
    auto_send: profile?.auto_send || false,
    template_notes: profile?.template_notes || '',
    template_currency: profile?.template_currency || 'EUR',
    template_vat_rate: profile?.template_vat_rate || 21,
    selected_products: (profile?.template_items || []) as TemplateItem[],
    is_active: profile?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  function toggleProduct(p: Product) {
    setForm(f => {
      const exists = f.selected_products.some(s => s.description === p.name)
      if (exists) {
        return { ...f, selected_products: f.selected_products.filter(s => s.description !== p.name) }
      }
      return {
        ...f,
        selected_products: [...f.selected_products, {
          description: p.name,
          quantity: 1,
          unit_price: p.unit_price,
          vat_rate: p.vat_rate,
        }],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const subtotal = form.selected_products.reduce((s, item) => s + item.quantity * item.unit_price, 0)

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>{profile ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h2>
          <button style={S.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div style={S.stepRow}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={S.stepCircle(step >= s)}>{s}</div>
              <span style={S.stepLabel(step >= s)}>{s === 1 ? 'Details' : 'Items'}</span>
              {s < 2 && <div style={S.divider} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div>
              {/* Name */}
              <div style={S.field}>
                <label style={S.label}>Profile name *</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Monthly retainer — Acme Ltd"
                  style={S.input}
                />
              </div>

              {/* Client */}
              <div style={S.field}>
                <label style={S.label}>Client</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={S.input}>
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div style={S.field}>
                <label style={S.label}>Frequency *</label>
                <div style={S.freqGrid}>
                  {(['weekly', 'biweekly', 'monthly', 'quarterly'] as Frequency[]).map(f => (
                    <button
                      key={f} type="button"
                      onClick={() => setForm(fm => ({ ...fm, frequency: f, start_date: fm.start_date }))}
                      style={S.freqBtn(form.frequency === f)}
                    >
                      {getFrequencyLabel(f)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div style={S.field}>
                <label style={S.label}>Start date</label>
                <input
                  type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  style={S.input}
                />
              </div>

              {/* Next run preview */}
              {form.start_date && <NextRunPreview startDate={form.start_date} frequency={form.frequency} />}

              {/* Auto-send toggle */}
              <div style={S.toggleRow}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Auto-send</div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>Automatically send invoice when generated</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, auto_send: !f.auto_send }))}
                  style={S.toggle(form.auto_send)}
                >
                  <span style={S.toggleKnob(form.auto_send)} />
                </button>
              </div>

              {/* Currency + VAT */}
              <div style={{ ...S.twoCol, marginBottom: 20 }}>
                <div style={S.field}>
                  <label style={S.label}>Currency</label>
                  <select value={form.template_currency} onChange={e => setForm(f => ({ ...f, template_currency: e.target.value }))} style={S.input}>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div style={S.field}>
                  <label style={S.label}>VAT rate</label>
                  <select value={form.template_vat_rate} onChange={e => setForm(f => ({ ...f, template_vat_rate: Number(e.target.value) }))} style={S.input}>
                    <option value={0}>0%</option>
                    <option value={9}>9%</option>
                    <option value={19}>19%</option>
                    <option value={20}>20%</option>
                    <option value={21}>21%</option>
                    <option value={23}>23%</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center' }}
              >
                Next: Add Items →
              </button>
            </div>
          ) : (
            <div>
              {/* Notes */}
              <div style={S.field}>
                <label style={S.label}>Invoice notes (optional)</label>
                <textarea
                  value={form.template_notes}
                  onChange={e => setForm(f => ({ ...f, template_notes: e.target.value }))}
                  rows={2} placeholder="Payment terms, bank details note, etc."
                  style={{ ...S.input, resize: 'none', minHeight: 64 }}
                />
              </div>

              {/* Product selection */}
              {products.length > 0 && (
                <div style={S.field}>
                  <label style={S.label}>Add from your products ({products.length})</label>
                  <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12 }}>
                    {products.map(product => {
                      const selected = form.selected_products.some(p => p.description === product.name)
                      return (
                        <button
                          key={product.id} type="button"
                          onClick={() => toggleProduct(product)}
                          style={{ ...S.productItem(selected), marginBottom: 6 }}
                        >
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#10b981' : '#fff' }}>{product.name}</div>
                            <div style={{ fontSize: 11, color: '#71717a' }}>{product.unit} · VAT {product.vat_rate}%</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                              {formatCurrency(product.unit_price, form.template_currency)}
                            </span>
                            {selected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selected items */}
              {form.selected_products.length > 0 && (
                <div style={S.field}>
                  <label style={S.label}>Selected items ({form.selected_products.length})</label>
                  {form.selected_products.map((item, i) => (
                    <div key={i} style={S.selectedItem}>
                      <span style={{ flex: 1, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
                      <input
                        type="number" min="0.01" step="0.01"
                        value={item.quantity}
                        onChange={e => {
                          const q = Number(e.target.value)
                          setForm(f => ({
                            ...f,
                            selected_products: f.selected_products.map((s, j) => j === i ? { ...s, quantity: q } : s),
                          }))
                        }}
                        style={{ width: 64, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 12, color: '#71717a' }}>×</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', width: 80, textAlign: 'right' }}>
                        {formatCurrency(item.unit_price * item.quantity, form.template_currency)}
                      </span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontSize: 13, color: '#71717a', padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    Subtotal: <strong style={{ color: '#fff' }}>{formatCurrency(subtotal, form.template_currency)}</strong>
                  </div>
                </div>
              )}

              <div style={S.btnRow}>
                <button type="button" onClick={() => setStep(1)} style={S.btnSecondary}>← Back</button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  style={S.btnSubmit(saving || !form.name.trim())}
                >
                  {saving ? (
                    <>
                      <span style={S.spinner} />
                      {profile ? 'Updating…' : 'Creating…'}
                    </>
                  ) : profile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={S.deleteOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={S.deleteBox}>
        <h3 style={S.deleteTitle}>Delete recurring invoice?</h3>
        <p style={S.deleteDesc}>&ldquo;{name}&rdquo; will be permanently deleted. Future invoices will stop generating.</p>
        <div style={S.deleteBtnRow}>
          <button onClick={onCancel} style={S.deleteBtnCancel}>Cancel</button>
          <button onClick={onConfirm} style={S.deleteBtnConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RecurringPage() {
  const [profiles, setProfiles] = useState<RecurringProfile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Array<{ id: string; type: string; message: string }>>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<RecurringProfile | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const showToast = (type: string, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
  }

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); setAuthChecked(true); return }

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) { setLoading(false); setAuthChecked(true); return }

    const [profRes, clientRes, productRes] = await Promise.all([
      supabase.from('recurring_profiles').select('*, clients(name, email)').eq('company_id', company.id).order('next_run'),
      supabase.from('clients').select('id, name, email').eq('company_id', company.id).order('name'),
      supabase.from('products').select('id, name, unit_price, unit, vat_rate').eq('company_id', company.id).order('name'),
    ])

    if (profRes.data) setProfiles(profRes.data)
    if (clientRes.data) setClients(clientRes.data)
    if (productRes.data) setProducts(productRes.data)
    setLoading(false)
    setAuthChecked(true)
  }

  useEffect(() => { loadData() }, [])

  async function handleSave(data: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) return

    const nextRunDate = data.start_date
      ? calculateNextRun(new Date(data.start_date), data.frequency).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    const payload = {
      company_id: company.id,
      name: data.name,
      client_id: data.client_id || null,
      frequency: data.frequency,
      start_date: data.start_date,
      auto_send: data.auto_send,
      template_items: data.selected_products || [],
      template_notes: data.template_notes || null,
      template_currency: data.template_currency,
      template_vat_rate: data.template_vat_rate,
      is_active: data.is_active,
      next_run: nextRunDate,
    }

    let error: any
    if (editingProfile) {
      const res = await supabase.from('recurring_profiles').update(payload).eq('id', editingProfile.id).eq('company_id', company.id)
      error = res.error
      if (!error) showToast('success', 'Recurring invoice updated')
    } else {
      const res = await supabase.from('recurring_profiles').insert(payload).select().single()
      error = res.error
      if (!error) showToast('success', 'Recurring invoice created')
    }

    if (error) showToast('error', error.message)
    else {
      setModalOpen(false)
      setEditingProfile(null)
      loadData()
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('recurring_profiles').delete().eq('id', id)
    if (!error) {
      showToast('success', 'Recurring invoice deleted')
      setProfiles(prev => prev.filter(p => p.id !== id))
    } else {
      showToast('error', error.message)
    }
    setDeleteId(null)
  }

  async function handleToggleActive(profile: RecurringProfile) {
    const { error } = await supabase
      .from('recurring_profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', profile.id)

    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: !p.is_active } : p))
      showToast('success', profile.is_active ? 'Paused' : 'Activated')
    } else {
      showToast('error', error.message)
    }
  }

  async function handleSendNow(profile: RecurringProfile) {
    showToast('success', `Generating invoice for "${profile.name}"…`)
    try {
      const res = await fetch('/api/recurring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('success', `Invoice ${data.invoice_number} created (${formatCurrency(data.total, profile.template_currency)})`)
        loadData()
      } else {
        showToast('error', data.error || 'Failed to generate invoice')
      }
    } catch {
      showToast('error', 'Network error — please try again')
    }
  }

  // Auth check
  if (authChecked && !loading && profiles.length === 0) {
    // Only redirect if we checked auth and found no user
  }

  return (
    <>
      <style>{styleTag}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <h1 style={S.title}>Recurring Invoices</h1>
            <p style={S.subtitle}>Automate your billing — invoices generate and send on schedule.</p>
          </div>
          <button
            onClick={() => { setEditingProfile(null); setModalOpen(true) }}
            style={S.btnPrimary}
            onMouseOver={e => { const s = e.currentTarget.style; s.background = '#059669'; s.transform = 'translateY(-1px)' }}
            onMouseOut={e => { const s = e.currentTarget.style; s.background = '#10b981'; s.transform = 'translateY(0)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Recurring
          </button>
        </div>

        {/* Empty state */}
        {!loading && profiles.length === 0 && (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 style={S.emptyTitle}>No recurring invoices yet</h3>
            <p style={S.emptyDesc}>
              Set up automated billing and never manually create the same invoice twice. Define a schedule, pick items, and let InvoiceGen handle the rest.
            </p>
            <button
              onClick={() => { setEditingProfile(null); setModalOpen(true) }}
              style={{ ...S.btnPrimary, gap: 10 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create your first recurring invoice
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div style={S.grid}>
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Profile cards */}
        {!loading && profiles.length > 0 && (
          <div style={S.grid}>
            {profiles.map(profile => {
              const subtotal = (profile.template_items || []).reduce(
                (s: number, item: TemplateItem) => s + item.quantity * item.unit_price, 0
              )
              const nextDueSoon = isDueSoon(profile.next_run)
              const overdue = isOverdue(profile.next_run)

              return (
                <div
                  key={profile.id}
                  className="card-group"
                  style={S.card(profile.is_active)}
                  onMouseEnter={e => {
                    const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement
                    if (actions) actions.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement
                    if (actions) actions.style.opacity = '0'
                  }}
                >
                  {/* Top row */}
                  <div style={S.cardTop}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={S.cardName}>{profile.name}</p>
                        <span style={S.badge(FREQ_COLORS[profile.frequency] || '#10b981')}>
                          {getFrequencyLabel(profile.frequency)}
                        </span>
                        {profile.auto_send && (
                          <span style={S.autoSendBadge}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Auto-send
                          </span>
                        )}
                      </div>
                      <p style={S.cardClient}>
                        {profile.clients?.name || 'No client'}
                        {profile.clients?.email && <span style={{ color: '#3f3f46', marginLeft: 6 }}>· {profile.clients.email}</span>}
                      </p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleActive(profile)}
                      style={S.toggle(profile.is_active)}
                      title={profile.is_active ? 'Pause' : 'Activate'}
                    >
                      <span style={S.toggleKnob(profile.is_active)} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={S.statsRow}>
                    <div style={S.stat}>
                      <div style={S.statLabel}>Next run</div>
                      <div style={{
                        ...S.statValue,
                        color: nextDueSoon ? '#f59e0b' : overdue ? '#ef4444' : '#fff',
                      }}>
                        {formatDate(profile.next_run)}
                        {overdue && <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 4 }}>· Overdue</span>}
                        {nextDueSoon && !overdue && <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4 }}>· Soon</span>}
                      </div>
                    </div>
                    <div style={S.stat}>
                      <div style={S.statLabel}>Items</div>
                      <div style={S.statValue}>{(profile.template_items || []).length}</div>
                    </div>
                    <div style={S.stat}>
                      <div style={S.statLabel}>Total</div>
                      <div style={S.statValue}>
                        {profile.template_items?.length
                          ? formatCurrency(subtotal, profile.template_currency)
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={S.cardFooter}>
                    <p style={S.lastGen}>
                      {profile.last_generated
                        ? `Last: ${formatDate(profile.last_generated)}`
                        : 'Never generated'}
                    </p>
                    <div className="card-actions" style={{ ...S.actions, display: 'flex', gap: 4 }}>
                      {/* Send now */}
                      <button
                        onClick={() => handleSendNow(profile)}
                        style={{ ...S.iconBtn('#10b981'), background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                        title="Generate & send now"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => { setEditingProfile(profile); setModalOpen(true) }}
                        style={S.iconBtn('#71717a')}
                        onMouseOver={e => { const s = e.currentTarget.style; s.background = 'rgba(255,255,255,0.1)'; s.color = '#fff' }}
                        onMouseOut={e => { const s = e.currentTarget.style; s.background = 'transparent'; s.color = '#71717a' }}
                        title="Edit"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteId(profile.id)}
                        style={S.iconBtn('#71717a')}
                        onMouseOver={e => { const s = e.currentTarget.style; s.background = 'rgba(239,68,68,0.1)'; s.color = '#ef4444' }}
                        onMouseOut={e => { const s = e.currentTarget.style; s.background = 'transparent'; s.color = '#71717a' }}
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <RecurringModal
          profile={editingProfile || undefined}
          clients={clients}
          products={products}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingProfile(null) }}
        />
      )}

      {deleteId && (
        <DeleteConfirm
          name={profiles.find(p => p.id === deleteId)?.name || ''}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Toasts */}
      <div style={S.toastContainer}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </>
  )
}