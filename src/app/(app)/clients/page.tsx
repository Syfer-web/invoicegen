'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type CompanyRow = { id: string } | null | any

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

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 12,
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        fontSize: 13,
        fontWeight: 500,
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
        {isSuccess ? '✓' : '✕'}
      </div>
      {toast.message}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          marginLeft: 'auto',
          borderRadius: 8,
          padding: 4,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function ClientSkeleton() {
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.02)',
      padding: 20,
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, width: 128, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
          <div style={{ height: 12, width: 192, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
          <div style={{ height: 12, width: 160, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 32, width: 64, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ height: 32, width: 64, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ position: 'absolute', top: -4, right: -4, width: 24, height: 24, borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(16,185,129,0.4)' }} />
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No clients yet</h3>
      <p style={{ fontSize: 13, color: '#71717a', maxWidth: 360, marginBottom: 32, lineHeight: 1.6 }}>
        Add your first client to start creating invoices faster. Client info is saved and auto-fills during invoicing.
      </p>
      <button
        onClick={onAdd}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 9999,
          background: '#10b981',
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 600,
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 999, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>+</div>
        Add your first client
      </button>
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete }: { client: Client; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  const hasInvoices = client.invoice_count && client.invoice_count > 0

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        padding: 20,
        transition: 'all 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h3>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 9999,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
              ...(hasInvoices
                ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.1)' }),
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: hasInvoices ? '#34d399' : '#52525b', display: 'inline-block' }} />
              {hasInvoices ? 'Active' : 'New'}
            </span>
          </div>
          {client.company && (
            <p style={{ fontSize: 12, color: '#71717a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.company}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a' }}>
            <div style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <span style={{ fontSize: 10 }}>@</span>
            </div>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
          </div>
          {client.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#52525b', marginTop: 2 }}>
              <div style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <span style={{ fontSize: 10 }}>📍</span>
              </div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[client.city, client.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {client.last_invoice_date && (
            <p style={{ fontSize: 12, color: '#52525b', marginTop: 6 }}>
              Last invoice: {new Date(client.last_invoice_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          transition: 'opacity 0.2s',
          opacity: hovered ? 1 : 0,
        }}>
          <button
            onClick={onEdit}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#71717a',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="Edit client"
          >
            <div style={{ fontSize: 14 }}>✎</div>
          </button>
          <button
            onClick={onDelete}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#71717a',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="Delete client"
          >
            <div style={{ fontSize: 14 }}>🗑</div>
          </button>
        </div>
      </div>
    </div>
  )
}

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

  const inputStyle = (field: keyof ClientFormData) => ({
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 8,
    border: `1px solid ${errors[field] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    background: 'rgba(255,255,255,0.05)',
    padding: '10px 12px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    ...(errors[field] ? {} : {}),
  })

  const field = (key: keyof ClientFormData, label: string, placeholder = '') => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>{label}</label>
      <input
        type={key === 'email' ? 'email' : 'text'}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }))
          if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
        }}
        placeholder={placeholder}
        style={{
          ...inputStyle(key),
          border: `1px solid ${errors[key] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
        }}
      />
      {errors[key] && <p style={{ marginTop: 4, fontSize: 12, color: '#f87171' }}>{errors[key]}</p>}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: '#111115', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>{client ? 'Edit client' : 'Add new client'}</h2>
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, margin: '4px 0 0' }}>{client ? 'Update client information' : 'Fill in the details below'}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {field('name', 'Name *', 'John Doe')}
            {field('company', 'Company', 'Acme Corp')}
          </div>
          {field('email', 'Email *', 'john@acme.com')}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Business St, Suite 100"
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'inherit', resize: 'none', transition: 'border-color 0.15s' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            {field('city', 'City', 'Dublin')}
            {field('postcode', 'Postcode', 'D01 AB12')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            {field('country', 'Country', 'Ireland')}
            {field('vat_number', 'VAT Number', 'IE1234567X')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 500, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s, background 0.15s', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8,
                background: '#10b981',
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#000',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.6s linear infinite' }} />
                  Saving…
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14 }}>✓</span>
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

function DeleteModal({ clientName, onConfirm, onCancel, loading }: { clientName: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', background: '#111115', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', margin: '0 auto 16px', fontSize: 20 }}>
          🗑
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', textAlign: 'center', marginBottom: 8 }}>Delete client?</h3>
        <p style={{ fontSize: 14, color: '#71717a', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          Are you sure you want to delete <span style={{ color: '#fff', fontWeight: 500 }}>{clientName}</span>? This action cannot be undone and existing invoices will be unlinked.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', fontSize: 14, fontWeight: 500, color: '#71717a', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, borderRadius: 8, background: '#ef4444', border: 'none', padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const router = useRouter()
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

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!company) {
          setLoading(false)
          return
        }

        setCompanyId((company as CompanyRow).id)

        const { data: clientsData, error } = await supabase
          .from('clients')
          .select(`*, invoices!left(created_at)`)
          .eq('company_id', (company as CompanyRow).id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const processed = (clientsData || []).map((c: Client & { invoices?: Array<{ created_at: string }> }) => {
          const invs = c.invoices || []
          const lastDate = invs.length > 0
            ? invs.reduce((latest, inv) => !latest || inv.created_at > latest ? inv.created_at : latest, '' as string | null)
            : null
          return { ...c, invoice_count: invs.length, last_invoice_date: lastDate }
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
  }, [addToast, router])

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
        setClients((cs) => cs.map((c) => c.id === editClient.id ? { ...c, ...formData } : c))
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

  const handleDelete = async () => {
    if (!deleteClient) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('clients').delete().eq('id', deleteClient.id)
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

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.company?.toLowerCase().includes(q) ?? false) || c.email.toLowerCase().includes(q)
  })

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ minHeight: '100vh' }}>
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map((toast) => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <Toast toast={toast} onDismiss={dismissToast} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>Manage your client profiles for faster invoicing</p>
        </div>

        {!loading && clients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b', fontSize: 14, zIndex: 1 }}>🔍</div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company or email…"
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', paddingLeft: 40, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 14, color: '#fff', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }}
                >
                  ✕
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#71717a' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {filtered.length} client{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => { setEditClient(null); setModalOpen(true) }}
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 8, background: '#10b981', padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#000', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', flexShrink: 0 }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              Add Client
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map((_, i) => <ClientSkeleton key={i} />)}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState onAdd={() => { setEditClient(null); setModalOpen(true) }} />
        ) : filtered.length === 0 && search ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🔍</span>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 4 }}>No results found</h3>
            <p style={{ fontSize: 12, color: '#71717a' }}>No clients match "{search}"</p>
            <button onClick={() => setSearch('')} style={{ marginTop: 12, fontSize: 12, color: '#34d399', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}>
              Clear search
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
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
    </>
  )
}