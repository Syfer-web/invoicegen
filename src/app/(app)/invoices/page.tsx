'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total: number
  currency: string
  due_date: string
  paid_at: string | null
  sent_at: string | null
  created_at: string
  client: { name: string; email: string } | null
}

type Filter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

function formatCurrency(amount: number, currency = 'EUR') {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  return `${symbols[currency] || '€'}${amount.toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
  paid:      { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: '#34d399', dot: '#34d399', label: 'Paid' },
  sent:      { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#60a5fa', dot: '#60a5fa', label: 'Sent' },
  draft:     { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#71717a', dot: '#52525b', label: 'Draft' },
  overdue:   { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#f87171', dot: '#f87171', label: 'Overdue' },
  cancelled: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', color: '#52525b', dot: '#52525b', label: 'Cancelled' },
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
]

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>📄</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
        {hasFilter ? 'No matching invoices' : 'No invoices yet'}
      </h3>
      <p style={{ fontSize: 12, color: '#71717a', marginBottom: 20, maxWidth: 320, lineHeight: 1.5 }}>
        {hasFilter ? 'Try a different filter or clear your search.' : 'Create your first invoice and start getting paid online.'}
      </p>
      {!hasFilter && (
        <Link
          href="/invoices/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 9999, background: '#10b981', padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#000', border: 'none', textDecoration: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
        >
          <span style={{ fontSize: 16 }}>+</span>
          New Invoice
        </Link>
      )}
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [hovered, setHovered] = useState(false)
  const days = daysUntil(invoice.due_date)
  const isOverdue = days < 0 && invoice.status !== 'paid'

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', transition: 'background 0.15s', cursor: 'default', background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{invoice.invoice_number}</span>
          <StatusBadge status={invoice.status} />
        </div>
        <p style={{ fontSize: 12, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {invoice.client?.name || 'No client'}
          {invoice.client?.email && <span style={{ color: '#52525b', marginLeft: 6 }}>· {invoice.client.email}</span>}
        </p>
      </div>

      <div style={{ display: 'none', textAlign: 'right', flexShrink: 0, width: 112 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: isOverdue ? '#f87171' : '#71717a' }}>
          {formatDate(invoice.due_date)}
        </p>
        {isOverdue ? (
          <p style={{ fontSize: 10, color: 'rgba(248,113,113,0.6)' }}>{Math.abs(days)}d overdue</p>
        ) : days <= 3 && invoice.status !== 'paid' ? (
          <p style={{ fontSize: 10, color: 'rgba(251,191,36,0.6)' }}>Due soon</p>
        ) : null}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, width: 96 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{formatCurrency(invoice.total, invoice.currency)}</p>
        {invoice.sent_at && invoice.status === 'paid' && invoice.paid_at && (
          <p style={{ fontSize: 10, color: '#52525b' }}>Paid {formatDate(invoice.paid_at)}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <Link
          href="/invoices/new"
          style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', background: 'transparent', border: 'none', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 14 }}
          title="Duplicate"
        >
          📋
        </Link>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
      if (!company) { setLoading(false); return }

      const { data } = await supabase
        .from('invoices').select('*, client:clients(name, email)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (data) setInvoices(data)
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = invoices.filter(inv => {
    const matchesFilter = filter === 'all' ? true : inv.status === filter
    const matchesSearch = !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || inv.client?.name?.toLowerCase().includes(search.toLowerCase()) || inv.client?.email?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts: Record<Filter, number> = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
  }

  const totalAmount = filtered.reduce((s, i) => s + (i.total || 0), 0)
  const currency = invoices[0]?.currency || 'EUR'

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Invoices</h1>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>{invoices.length} total</p>
          </div>
          <Link
            href="/invoices/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 8, background: '#10b981', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#000', border: 'none', textDecoration: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            New Invoice
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', fontSize: 14, zIndex: 1 }}>🔍</div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices…"
              style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            {FILTERS.map(f => {
              const isActive = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive ? '#fff' : '#71717a',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                  {counts[f.key] > 0 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      fontSize: 10,
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    }}>
                      {counts[f.key]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '12px 20px' }}>
            <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>
              <span style={{ color: '#fff', fontWeight: 500 }}>{filtered.length}</span> invoice{filtered.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` (${filter})`}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
              {formatCurrency(totalAmount, currency)} total
            </p>
          </div>
        )}

        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', animation: 'pulse 2s ease-in-out infinite' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, width: 96, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
                    <div style={{ height: 12, width: 160, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                  <div style={{ height: 16, width: 80, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ height: 16, width: 64, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFilter={filter !== 'all' || !!search} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b' }}>Invoice</div>
                <div style={{ display: 'none', textAlign: 'right', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', width: 112 }}>Due date</div>
                <div style={{ textAlign: 'right', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', width: 96 }}>Amount</div>
                <div style={{ width: 56 }} />
              </div>
              <div>
                {filtered.map(inv => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}