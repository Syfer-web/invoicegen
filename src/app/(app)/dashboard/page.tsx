'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total: number
  currency: string
  due_date: string
  sent_at: string | null
  created_at: string
  client: { name: string; email: string } | null
}

type Client = {
  id: string
  name: string
  company: string | null
  email: string
  city: string | null
  created_at: string
}

type Stats = {
  outstanding: number
  outstandingCount: number
  paidThisMonth: number
  paidThisMonthCount: number
  totalInvoiced: number
  overdueCount: number
  overdueAmount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'EUR') {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  const sym = symbols[currency] || '€'
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}k`
  return `${sym}${amount.toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    draft: 'bg-white/5 text-zinc-400 border-white/10',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50',
  }
  const labels: Record<string, string> = {
    paid: 'Paid', sent: 'Sent', draft: 'Draft', overdue: 'Overdue', cancelled: 'Cancelled',
  }
  const dotColors: Record<string, string> = {
    paid: 'bg-emerald-400', sent: 'bg-blue-400', draft: 'bg-zinc-500', overdue: 'bg-red-400', cancelled: 'bg-zinc-600',
  }
  const s = styles[status] || styles.draft
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${s}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-zinc-500'}`} />
      {labels[status] || status}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 animate-pulse">
      <div className="h-3 w-20 bg-white/5 rounded mb-4" />
      <div className="h-8 w-32 bg-white/5 rounded mb-2" />
      <div className="h-3 w-16 bg-white/5 rounded" />
    </div>
  )
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(...monthly.map(m => m.total), 1)
  const height = 72
  const points = monthly.map((m, i) => ({
    x: (i / (monthly.length - 1)) * 100,
    y: height - (m.total / max) * height,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`).join(' ')
  const areaD = `${pathD} L 100% ${height} L 0% ${height} Z`

  const hasData = monthly.some(m => m.total > 0)

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatCurrency(monthly.reduce((s, m) => s + m.total, 0))}
          </p>
        </div>
        <span className="text-xs text-zinc-500">Last 6 months</span>
      </div>
      {hasData ? (
        <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#revGrad)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="0.5" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={`${p.x}%`} cy={p.y} r="0.8" fill="#10b981" />
          ))}
        </svg>
      ) : (
        <div className="h-[72px] flex items-center justify-center">
          <p className="text-xs text-zinc-600">Revenue will appear here</p>
        </div>
      )}
      <div className="flex justify-between mt-2">
        {monthly.map(m => (
          <span key={m.month} className="text-[10px] text-zinc-600">{m.month}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get company
      const { data: company } = await supabase
        .from('companies').select('name').eq('user_id', user.id).single()
      if (company) setCompanyName(company.name)

      // Fetch invoices with client
      const { data: invoices } = await supabase
        .from('invoices').select('*, client:clients(name, email)')
        .eq('company_id', (await supabase.from('companies').select('id').eq('user_id', user.id).single()).data?.id)
        .order('created_at', { ascending: false }).limit(20)

      // Fetch clients
      const companyId = (await supabase.from('companies').select('id').eq('user_id', user.id).single()).data?.id
      const { data: clients } = await supabase
        .from('clients').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(6)

      if (invoices) {
        setRecentInvoices(invoices.slice(0, 5))
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const outstanding = invoices.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
        const outstandingCount = invoices.filter(i => ['sent', 'draft'].includes(i.status)).length
        const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).reduce((s, i) => s + (i.total || 0), 0)
        const paidThisMonthCount = invoices.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).length
        const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0)
        const overdueCount = invoices.filter(i => i.status === 'overdue').length
        const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0)
        setStats({ outstanding, outstandingCount, paidThisMonth, paidThisMonthCount, totalInvoiced, overdueCount, overdueAmount })

        // Monthly revenue (last 6 months)
        const months: Record<string, number> = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = d.toLocaleDateString('en-GB', { month: 'short' })
          months[key] = 0
        }
        invoices.filter(i => i.status === 'paid' && i.paid_at).forEach(i => {
          const key = new Date(i.paid_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
          const shortKey = new Date(i.paid_at).toLocaleDateString('en-GB', { month: 'short' })
          if (shortKey in months) months[shortKey] += i.total || 0
        })
        setMonthlyRevenue(Object.entries(months).map(([month, total]) => ({ month, total })))
      }

      if (clients) setRecentClients(clients)
      setLoading(false)
    }
    load()
  }, [])

  const statCards = stats ? [
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstanding, 'EUR'),
      sub: `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? 's' : ''}`,
      accent: 'text-amber-400',
      icon: '⏳',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/15',
    },
    {
      label: 'Paid this month',
      value: formatCurrency(stats.paidThisMonth, 'EUR'),
      sub: `${stats.paidThisMonthCount} invoice${stats.paidThisMonthCount !== 1 ? 's' : ''}`,
      accent: 'text-emerald-400',
      icon: '✓',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/15',
    },
    {
      label: 'Total invoiced',
      value: formatCurrency(stats.totalInvoiced, 'EUR'),
      sub: 'All time',
      accent: 'text-white',
      icon: '↑',
      bg: 'bg-white/5',
      border: 'border-white/5',
    },
    {
      label: 'Overdue',
      value: stats.overdueCount.toString(),
      sub: formatCurrency(stats.overdueAmount, 'EUR'),
      accent: 'text-red-400',
      icon: '!',
      bg: 'bg-red-500/5',
      border: 'border-red-500/15',
    },
  ] : []

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 mb-0.5">{greeting}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {companyName ? `${companyName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/clients"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Client
          </a>
          <a
            href="/invoices/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(card => (
            <div key={card.label} className={`rounded-2xl border ${card.border} ${card.bg} p-5 hover:${card.border} transition-all duration-200`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{card.label}</p>
                <span className="text-base">{card.icon}</span>
              </div>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${card.accent}`}>{card.value}</p>
              <p className="text-xs text-zinc-500 mt-2">{card.sub}</p>
            </div>
          ))
        }
      </div>

      {/* Revenue chart */}
      <RevenueChart monthly={monthlyRevenue} />

      {/* Bottom section: recent invoices + recent clients */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Recent invoices</h2>
            <a href="/invoices/new" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </a>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white mb-1.5">No invoices yet</h3>
              <p className="text-xs text-zinc-500 mb-5 max-w-xs">Create your first invoice and start getting paid online.</p>
              <a href="/invoices/new" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </a>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentInvoices.map(inv => (
                <a key={inv.id} href="/invoices/new" className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{inv.invoice_number}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {inv.client?.name || 'No client'} · Due {formatDate(inv.due_date)}
                      {daysUntil(inv.due_date) < 0 && inv.status !== 'paid' && (
                        <span className="text-red-400 ml-1">({Math.abs(daysUntil(inv.due_date))}d overdue)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(inv.total, inv.currency)}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Clients</h2>
            <a href="/clients" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Manage →
            </a>
          </div>

          {recentClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">No clients yet</h3>
              <p className="text-xs text-zinc-500 mb-4">Add your first client to speed up invoicing.</p>
              <a href="/clients" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add client →</a>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentClients.map(client => (
                <a key={client.id} href="/clients" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400 flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors truncate">{client.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{client.company || client.email}</p>
                  </div>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="px-5 py-4 border-t border-white/5 space-y-2">
            <a href="/products" className="flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors py-1">
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products & Services
              </span>
              <span>→</span>
            </a>
            <a href="/settings/bank" className="flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors py-1">
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Bank Details
              </span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
