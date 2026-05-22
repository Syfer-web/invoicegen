'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { cls: string; dot: string; label: string }> = {
    paid:      { cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', label: 'Paid' },
    sent:      { cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-400', label: 'Sent' },
    draft:     { cls: 'bg-white/5 text-zinc-400 border border-white/10', dot: 'bg-zinc-500', label: 'Draft' },
    overdue:   { cls: 'bg-red-500/10 text-red-400 border border-red-500/20', dot: 'bg-red-400', label: 'Overdue' },
    cancelled: { cls: 'bg-zinc-800/30 text-zinc-500 border border-zinc-700/30', dot: 'bg-zinc-600', label: 'Cancelled' },
  }
  const c = configs[status] || configs.draft
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

type Filter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'recurring'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'recurring', label: 'Recurring' },
]

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">
        {hasFilter ? 'No matching invoices' : 'No invoices yet'}
      </h3>
      <p className="text-xs text-zinc-500 mb-5 max-w-xs leading-relaxed">
        {hasFilter ? 'Try a different filter or clear your search.' : 'Create your first invoice and start getting paid online.'}
      </p>
      {!hasFilter && (
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      )}
    </div>
  )
}

// ─── Invoice Row ─────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [hovered, setHovered] = useState(false)
  const days = daysUntil(invoice.due_date)
  const isOverdue = days < 0 && invoice.status !== 'paid'

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Number + client */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
            {invoice.invoice_number}
          </span>
          <StatusBadge status={invoice.status} />
        </div>
        <p className="text-xs text-zinc-500 truncate">
          {invoice.client?.name || 'No client'}
          {invoice.client?.email && <span className="text-zinc-600 ml-1">· {invoice.client.email}</span>}
        </p>
      </div>

      {/* Due date */}
      <div className="hidden md:block text-right flex-shrink-0 w-28">
        <p className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
          {formatDate(invoice.due_date)}
        </p>
        {isOverdue ? (
          <p className="text-[10px] text-red-400/60">{Math.abs(days)}d overdue</p>
        ) : days <= 3 && invoice.status !== 'paid' ? (
          <p className="text-[10px] text-amber-400/60">Due soon</p>
        ) : null}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0 w-24">
        <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(invoice.total, invoice.currency)}</p>
        {invoice.sent_at && invoice.status === 'paid' && invoice.paid_at && (
          <p className="text-[10px] text-zinc-600">Paid {formatDate(invoice.paid_at)}</p>
        )}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
          title="Edit invoice"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <Link
          href="/invoices/new"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('companies').select('id').eq('user_id', user.id).single()
      if (!company) { setLoading(false); return }

      const { data } = await supabase
        .from('invoices').select('*, client:clients(name, email)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (data) setInvoices(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = invoices.filter(inv => {
    const matchesFilter = filter === 'all'
      ? true
      : filter === 'recurring'
        ? inv.status !== 'cancelled' // recurring invoices live in all statuses
        : inv.status === filter
    const matchesSearch = !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.email?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts: Record<Filter, number> = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
    recurring: invoices.filter(i => i.status !== 'cancelled').length,
  }

  const totalAmount = filtered.reduce((s, i) => s + (i.total || 0), 0)
  const currency = invoices[0]?.currency || 'EUR'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Invoices</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{invoices.length} total</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
                filter === f.key
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] ${
                  filter === f.key ? 'bg-white/15 text-white' : 'text-zinc-600'
                }`}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
          <p className="text-xs text-zinc-500">
            <span className="text-white font-medium">{filtered.length}</span> invoice{filtered.length !== 1 ? 's' : ''}
            {filter !== 'all' && ` (${filter})`}
          </p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(totalAmount, currency)} total
          </p>
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/5" />
                  <div className="h-3 w-40 rounded bg-white/5" />
                </div>
                <div className="h-4 w-20 rounded bg-white/5" />
                <div className="h-4 w-16 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={filter !== 'all' || !!search} />
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10">
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Invoice</div>
              <div className="hidden md:block text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-600 w-28">Due date</div>
              <div className="text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-600 w-24">Amount</div>
              <div className="w-14" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {filtered.map(inv => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}