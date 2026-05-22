'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type RecurringProfile = {
  id: string
  name: string
  client_id: string | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
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
type TemplateItem = { description: string; quantity: number; unit_price: number; vat_rate: number }

type Toast = { id: string; type: 'success' | 'error'; message: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(amount: number, currency = 'EUR') {
  const syms: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  return `${syms[currency] || '€'}${amount.toFixed(2)}`
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}
const FREQ_COLORS: Record<string, string> = {
  weekly: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  biweekly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  monthly: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  quarterly: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
      {toast.type === 'success'
        ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
      {toast.message}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-5 w-40 bg-white/5 rounded mb-1.5" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
        <div className="h-6 w-16 bg-white/5 rounded-full" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-3 w-20 bg-white/5 rounded" />
        <div className="h-3 w-28 bg-white/5 rounded" />
      </div>
    </div>
  )
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

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
  onSave: (data: Partial<RecurringProfile>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    client_id: profile?.client_id || '',
    frequency: profile?.frequency || ('monthly' as RecurringProfile['frequency']),
    start_date: profile?.start_date || new Date().toISOString().split('T')[0],
    auto_send: profile?.auto_send || false,
    template_notes: profile?.template_notes || '',
    template_currency: profile?.template_currency || 'EUR',
    template_vat_rate: profile?.template_vat_rate || 21,
    selected_products: profile?.template_items || [] as TemplateItem[],
    is_active: profile?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const selectedClientProducts = products.filter(p => form.selected_products.some(s => s.description === p.name))

  function toggleProduct(product: Product) {
    setForm(prev => {
      const exists = prev.selected_products.some(p => p.description === product.name)
      if (exists) {
        return { ...prev, selected_products: prev.selected_products.filter(p => p.description !== product.name) }
      }
      return {
        ...prev,
        selected_products: [...prev.selected_products, {
          description: product.name,
          quantity: 1,
          unit_price: product.unit_price,
          vat_rate: product.vat_rate,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111115] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{profile ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${step >= s ? 'bg-emerald-500 text-black' : 'border border-white/20 text-zinc-500'}`}>{s}</div>
              <span className={`text-xs ${step >= s ? 'text-white' : 'text-zinc-500'}`}>{s === 1 ? 'Details' : 'Items'}</span>
              {s < 2 && <div className="h-px w-6 bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Profile name *</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Monthly retainer — Acme Ltd" className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all" />
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client</label>
                <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all">
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Frequency *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['weekly', 'biweekly', 'monthly', 'quarterly'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setForm(p => ({ ...p, frequency: f }))} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${form.frequency === f ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all" />
              </div>

              {/* Auto-send */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Auto-send</p>
                  <p className="text-xs text-zinc-500">Automatically send invoice when generated</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, auto_send: !p.auto_send }))} className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${form.auto_send ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.auto_send ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Currency + VAT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Currency</label>
                  <select value={form.template_currency} onChange={e => setForm(p => ({ ...p, template_currency: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all">
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">VAT rate</label>
                  <select value={form.template_vat_rate} onChange={e => setForm(p => ({ ...p, template_vat_rate: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all">
                    <option value={0}>0%</option>
                    <option value={20}>20%</option>
                    <option value={21}>21%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-all">
                Next: Add Items →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Invoice notes (optional)</label>
                <textarea value={form.template_notes} onChange={e => setForm(p => ({ ...p, template_notes: e.target.value }))} rows={2} placeholder="Payment terms, bank details note, etc." className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none" />
              </div>

              {/* Product selection */}
              {products.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Add from your products</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {products.map(product => {
                      const selected = form.selected_products.some(p => p.description === product.name)
                      return (
                        <button key={product.id} type="button" onClick={() => toggleProduct(product)} className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${selected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                          <div className="text-left">
                            <p className={`font-medium ${selected ? 'text-emerald-400' : 'text-white'}`}>{product.name}</p>
                            <p className="text-xs text-zinc-500">{product.unit} · VAT {product.vat_rate}%</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{formatCurrency(product.unit_price, form.template_currency)}</span>
                            {selected && <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selected items */}
              {form.selected_products.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Selected items ({form.selected_products.length})</label>
                  <div className="space-y-2">
                    {form.selected_products.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                        <span className="flex-1 text-sm text-white truncate">{item.description}</span>
                        <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => { const q = Number(e.target.value); setForm(p => ({ ...p, selected_products: p.selected_products.map((s, j) => j === i ? { ...s, quantity: q } : s) })) }} className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center" />
                        <span className="text-xs text-zinc-500">×</span>
                        <span className="text-sm font-medium text-white w-20 text-right">{formatCurrency(item.unit_price * item.quantity, form.template_currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={saving || !form.name.trim()} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-all disabled:opacity-50">
                  {saving ? <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                  {profile ? 'Update Profile' : 'Create Profile'}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#111115] p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-2">Delete recurring invoice?</h3>
        <p className="text-sm text-zinc-400 mb-5">"{name}" will be permanently deleted. Future invoices will stop generating.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400 transition-all">Delete</button>
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
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<RecurringProfile | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
  }

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) { setLoading(false); return }

    const [profRes, clientRes, productRes] = await Promise.all([
      supabase.from('recurring_profiles').select('*, clients(name, email)').eq('company_id', company.id).order('next_run'),
      supabase.from('clients').select('id, name, email').eq('company_id', company.id).order('name'),
      supabase.from('products').select('id, name, unit_price, unit, vat_rate').eq('company_id', company.id).order('name'),
    ])

    if (profRes.data) setProfiles(profRes.data)
    if (clientRes.data) setClients(clientRes.data)
    if (productRes.data) setProducts(productRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSave(data: Partial<RecurringProfile>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) return

    const payload = {
      company_id: company.id,
      name: data.name!,
      client_id: data.client_id || null,
      frequency: data.frequency!,
      start_date: data.start_date,
      auto_send: data.auto_send,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template_items: (data as any).selected_products || [],
      template_notes: data.template_notes || null,
      template_currency: data.template_currency,
      template_vat_rate: data.template_vat_rate,
      is_active: data.is_active,
    }

    let error
    if (editingProfile) {
      const res = await supabase.from('recurring_profiles').update(payload).eq('id', editingProfile.id).eq('company_id', company.id)
      error = res.error
      if (!error) showToast('success', 'Recurring invoice updated')
    } else {
      const next = new Date(data.start_date!)
      const res = await supabase.from('recurring_profiles').insert({ ...payload, next_run: next.toISOString().split('T')[0] })
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
    const { error } = await supabase.from('recurring_profiles').update({ is_active: !profile.is_active }).eq('id', profile.id)
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: !p.is_active } : p))
      showToast('success', profile.is_active ? 'Paused' : 'Activated')
    } else {
      showToast('error', error.message)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recurring Invoices</h1>
          <p className="text-sm text-zinc-500 mt-1">Automate your billing — invoices generate and send on schedule.</p>
        </div>
        <button onClick={() => { setEditingProfile(null); setModalOpen(true) }} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Recurring
        </button>
      </div>

      {/* Empty state */}
      {!loading && profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-white mb-1.5">No recurring invoices yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs">Set up automated billing and never manually create the same invoice twice.</p>
          <button onClick={() => { setEditingProfile(null); setModalOpen(true) }} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create your first recurring invoice
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Profile cards */}
      {!loading && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map(profile => {
            const subtotal = (profile.template_items || []).reduce((s, item) => s + (item.quantity * item.unit_price), 0)
            return (
              <div key={profile.id} className={`rounded-2xl border p-5 transition-all duration-200 group hover:-translate-y-0.5 ${profile.is_active ? 'border-white/5 bg-white/[0.02] hover:border-emerald-500/15' : 'border-white/5 bg-white/[0.01] opacity-60'}`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{profile.name}</h3>
                      <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${FREQ_COLORS[profile.frequency]}`}>
                        {FREQ_LABELS[profile.frequency]}
                      </span>
                      {profile.auto_send && (
                        <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Auto-send</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {(profile.clients as any)?.name || 'No client'}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button onClick={() => handleToggleActive(profile)} className={`flex-shrink-0 relative flex h-5 w-9 items-center rounded-full transition-colors ${profile.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${profile.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-0.5">Next run</p>
                    <p className="text-xs font-semibold text-white">{formatDate(profile.next_run)}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-0.5">Items</p>
                    <p className="text-xs font-semibold text-white">{(profile.template_items || []).length}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-0.5">Total</p>
                    <p className="text-xs font-semibold text-white">{profile.template_items?.length ? formatCurrency(subtotal, profile.template_currency) : '—'}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <p className="text-xs text-zinc-600">
                    {profile.last_generated ? `Last: ${formatDate(profile.last_generated)}` : 'Never generated'}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingProfile(profile); setModalOpen(true) }} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteId(profile.id)} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={id => setToasts(prev => prev.filter(x => x.id !== id))} />)}
    </div>
  )
}