'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  company: string | null
  email: string
  address: string | null
  city: string | null
  postcode: string | null
  country: string | null
  vat_number: string | null
  created_at: string
  invoice_count?: number
  last_invoice_date?: string | null
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface ClientFormData {
  name: string
  company: string
  email: string
  address: string
  city: string
  postcode: string
  country: string
  vat_number: string
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 ${
        toast.type === 'success'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/30 bg-red-500/10 text-red-300'
      }`}
    >
      {toast.type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {toast.message}
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto rounded-lg p-1 hover:bg-white/10 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function ClientSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="h-3 w-48 rounded bg-white/5" />
          <div className="h-3 w-40 rounded bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded-lg bg-white/5" />
          <div className="h-8 w-16 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
          <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">No clients yet</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-8 leading-relaxed">
        Add your first client to start creating invoices faster. Client info is saved and auto-fills during invoicing.
      </p>

      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add your first client
      </button>
    </div>
  )
}

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: Client
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-400">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white truncate">{client.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs flex-shrink-0 ${
              client.invoice_count && client.invoice_count > 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-white/5 text-zinc-500'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                client.invoice_count && client.invoice_count > 0 ? 'bg-emerald-400' : 'bg-zinc-600'
              }`} />
              {client.invoice_count && client.invoice_count > 0 ? 'Active' : 'New'}
            </span>
          </div>

          {client.company && (
            <p className="text-xs text-zinc-500 mb-1 truncate">{client.company}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{client.email}</span>
          </div>

          {client.city && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-0.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{[client.city, client.country].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {client.last_invoice_date && (
            <p className="text-xs text-zinc-600 mt-1.5">
              Last invoice: {new Date(client.last_invoice_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            title="Edit client"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete client"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Client Modal ─────────────────────────────────────────────────────────────

function ClientModal({
  client,
  onSave,
  onClose,
  loading,
}: {
  client: Client | null
  onSave: (data: ClientFormData) => void
  onClose: () => void
  loading: boolean
}) {
  const [form, setForm] = useState<ClientFormData>({
    name: '',
    company: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
    vat_number: '',
  })
  const [errors, setErrors] = useState<Partial<ClientFormData>>({})

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        postcode: client.postcode || '',
        country: client.country || '',
        vat_number: client.vat_number || '',
      })
    } else {
      setForm({ name: '', company: '', email: '', address: '', city: '', postcode: '', country: '', vat_number: '' })
    }
    setErrors({})
  }, [client])

  const validate = () => {
    const errs: Partial<ClientFormData> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required'
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
  }

  const field = (key: keyof ClientFormData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }))
          if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
          errors[key] ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/30'
        }`}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              {client ? 'Edit client' : 'Add new client'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {client ? 'Update client information' : 'Fill in the details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {field('name', 'Name *', 'text', 'John Doe')}
            {field('company', 'Company', 'text', 'Acme Corp')}
          </div>
          {field('email', 'Email *', 'email', 'john@acme.com')}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Business St, Suite 100"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('city', 'City', 'text', 'Dublin')}
            {field('postcode', 'Postcode', 'text', 'D01 AB12')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('country', 'Country', 'text', 'Ireland')}
            {field('vat_number', 'VAT Number', 'text', 'IE1234567X')}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {client ? 'Update client' : 'Add client'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

function DeleteModal({
  clientName,
  onConfirm,
  onCancel,
  loading,
}: {
  clientName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111113] shadow-2xl p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white text-center mb-1">Delete client?</h3>
        <p className="text-sm text-zinc-500 text-center mb-6 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-medium">{clientName}</span>? This action cannot be undone and existing invoices will be unlinked.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Toast helpers
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  // Fetch company and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get company
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!company) {
          setLoading(false)
          return
        }

        setCompanyId(company.id)

        // Get clients with last invoice info
        const { data: clientsData, error } = await supabase
          .from('clients')
          .select(`
            *,
            invoices!left(
              created_at
            )
          `)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Process: get last invoice date and count per client
        const processed = (clientsData || []).map((c: Client & { invoices?: Array<{ created_at: string }> }) => {
          const invs = c.invoices || []
          const lastDate = invs.length > 0
            ? invs.reduce((latest, inv) => !latest || inv.created_at > latest ? inv.created_at : latest, '' as string | null)
            : null
          return {
            ...c,
            invoice_count: invs.length,
            last_invoice_date: lastDate,
          }
        })

        setClients(processed as Client[])
      } catch (err) {
        console.error('Failed to fetch clients:', err)
        addToast('error', 'Failed to load clients')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [addToast])

  // Save (create or update)
  const handleSave = async (formData: ClientFormData) => {
    if (!companyId) return
    setSaving(true)
    try {
      if (editClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name.trim(),
            company: formData.company.trim() || null,
            email: formData.email.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            postcode: formData.postcode.trim() || null,
            country: formData.country.trim() || null,
            vat_number: formData.vat_number.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editClient.id)

        if (error) throw error

        setClients((cs) =>
          cs.map((c) =>
            c.id === editClient.id
              ? { ...c, ...formData, address: formData.address, city: formData.city, postcode: formData.postcode, country: formData.country, vat_number: formData.vat_number }
              : c
          )
        )
        addToast('success', 'Client updated')
      } else {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            company_id: companyId,
            name: formData.name.trim(),
            company: formData.company.trim() || null,
            email: formData.email.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            postcode: formData.postcode.trim() || null,
            country: formData.country.trim() || null,
            vat_number: formData.vat_number.trim() || null,
          })
          .select()
          .single()

        if (error) throw error

        const clientWithMeta: Client = { ...newClient, invoice_count: 0, last_invoice_date: null }
        setClients((cs) => [clientWithMeta, ...cs])
        addToast('success', 'Client added successfully')
      }
      setModalOpen(false)
      setEditClient(null)
    } catch (err) {
      console.error('Save error:', err)
      addToast('error', 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!deleteClient) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteClient.id)

      if (error) throw error

      setClients((cs) => cs.filter((c) => c.id !== deleteClient.id))
      addToast('success', 'Client deleted')
      setDeleteClient(null)
    } catch (err) {
      console.error('Delete error:', err)
      addToast('error', 'Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  // Filter
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false) ||
      c.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Clients</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your client profiles for faster invoicing</p>
      </div>

      {/* Search bar */}
      {!loading && clients.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company or email…"
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => { setEditClient(null); setModalOpen(true) }}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Client
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ClientSkeleton key={i} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState onAdd={() => { setEditClient(null); setModalOpen(true) }} />
      ) : filtered.length === 0 && search ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No results found</h3>
          <p className="text-xs text-zinc-500">
            No clients match &ldquo;{search}&rdquo;
          </p>
          <button onClick={() => setSearch('')} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => { setEditClient(client); setModalOpen(true) }}
              onDelete={() => setDeleteClient(client)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <ClientModal
          client={editClient}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditClient(null) }}
          loading={saving}
        />
      )}

      {deleteClient && (
        <DeleteModal
          clientName={deleteClient.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteClient(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}