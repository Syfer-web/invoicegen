'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total: number
  currency: string
  due_date: string
  paid_at: string | null
  created_at: string
  client: { name: string; email: string } | null
}

type Stats = {
  outstanding: number
  outstandingCount: number
  paidThisMonth: number
  paidThisMonthCount: number
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
  const dots: Record<string, string> = {
    paid: 'bg-emerald-400', sent: 'bg-blue-400', draft: 'bg-zinc-500', overdue: 'bg-red-400', cancelled: 'bg-zinc-600',
  }
  const s = styles[status] || styles.draft
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${s}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-zinc-500'}`} />
      {labels[status] || status}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string
  value: string
  sub: string
  accent: string
  href?: string
}) {
  const content = (
    <div className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.05]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">{label}</p>
        <p className={`text-2xl font-bold tracking-tight tabular-nums ${accent}`}>{value}</p>
      </div>
      <p className="text-xs text-zinc-500 mt-2">{sub}</p>
      {href && (
        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

// ─── Revenue Chart (SVG) ───────────────────────────────────────────────────────

function RevenueChart({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(...monthly.map(m => m.total), 1)
  const height = 80
  const points = monthly.map((m, i) => ({
    x: (i / (monthly.length - 1)) * 100,
    y: height - (m.total / max) * height,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`).join(' ')
  const areaD = `${pathD} L 100% ${height} L 0% ${height} Z`
  const hasData = monthly.some(m => m.total > 0)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Revenue — last 6 months</p>
        <p className="text-sm font-semibold text-white tabular-nums">
          {formatCurrency(monthly.reduce((s, m) => s + m.total, 0))}
        </p>
      </div>
      {hasData ? (
        <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#revGrad2)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={`${p.x}%`} cy={p.y} r="1" fill="#10b981" />
          ))}
        </svg>
      ) : (
        <div className="h-[80px] flex items-end justify-between gap-2 px-1">
          {[0.2, 0.4, 0.6, 0.3, 0.5, 0.2].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-white/5" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
      )}
      <div className="flex justify-between mt-2 px-1">
        {monthly.map(m => (
          <span key={m.month} className="text-[10px] text-zinc-600">{m.month}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyInvoiceState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">No invoices yet</h3>
      <p className="text-xs text-zinc-500 mb-5 max-w-xs leading-relaxed">Create your first invoice and start getting paid online.</p>
      <Link
        href="/invoices/new"
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Invoice
      </Link>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get company ID once
      const { data: company } = await supabase
        .from('companies').select('id').eq('user_id', user.id).single()
      const companyId = company?.id
      if (!companyId) { setLoading(false); return }

      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices').select('*, client:clients(name, email)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (invoices) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const outstanding = invoices.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
        const outstandingCount = invoices.filter(i => ['sent', 'draft'].includes(i.status)).length
        const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).reduce((s, i) => s + (i.total || 0), 0)
        const paidThisMonthCount = invoices.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).length
        const overdueCount = invoices.filter(i => i.status === 'overdue').length
        const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0)

        setStats({ outstanding, outstandingCount, paidThisMonth, paidThisMonthCount, overdueCount, overdueAmount })
        setRecentInvoices(invoices.slice(0, 5))

        // Monthly revenue
        const months: Record<string, number> = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months[d.toLocaleDateString('en-GB', { month: 'short' })] = 0
        }
        invoices.filter(i => i.status === 'paid' && i.paid_at).forEach(i => {
          const shortKey = new Date(i.paid_at).toLocaleDateString('en-GB', { month: 'short' })
          if (shortKey in months) months[shortKey] += i.total || 0
        })
        setMonthlyRevenue(Object.entries(months).map(([month, total]) => ({ month, total })))
      }

      setLoading(false)
    }
    load()
  }, [])

  // ─── Skeleton ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
          ))}
        </div>
        <div className="h-36 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Outstanding"
          value={stats ? formatCurrency(stats.outstanding) : '—'}
          sub={stats ? `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? 's' : ''}` : ''}
          accent="text-white"
          href="/invoices?status=sent,draft"
        />
        <StatCard
          label="Paid this month"
          value={stats ? formatCurrency(stats.paidThisMonth) : '—'}
          sub={stats ? `${stats.paidThisMonthCount} paid` : ''}
          accent="text-emerald-400"
          href="/invoices?status=paid"
        />
        <StatCard
          label="Overdue"
          value={stats ? stats.overdueCount.toString() : '—'}
          sub={stats ? formatCurrency(stats.overdueAmount) : ''}
          accent={stats && stats.overdueCount > 0 ? 'text-red-400' : 'text-zinc-400'}
          href="/invoices?status=overdue"
        />
        <StatCard
          label="Total clients"
          value="—"
          sub="Add your first client"
          accent="text-zinc-400"
          href="/clients"
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart monthly={monthlyRevenue} />

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent invoices — wider */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Recent invoices</h2>
            <Link href="/invoices" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              All invoices →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyInvoiceState />
          ) : (
            <div className="divide-y divide-white/5">
              {recentInvoices.map(inv => (
                <Link
                  key={inv.id}
                  href="/invoices"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{inv.invoice_number}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {inv.client?.name || 'No client'} · Due {formatDate(inv.due_date)}
                      {daysUntil(inv.due_date) < 0 && inv.status !== 'paid' && (
                        <span className="text-red-400 ml-1">({Math.abs(daysUntil(inv.due_date))}d overdue)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white tabular-nums flex-shrink-0">
                    {formatCurrency(inv.total, inv.currency)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Quick actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/invoices/new"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">New Invoice</p>
                <p className="text-xs text-zinc-500">Create and send instantly</p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/clients"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">Add Client</p>
                <p className="text-xs text-zinc-500">Save for faster invoicing</p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/settings/bank"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">Bank Details</p>
                <p className="text-xs text-zinc-500">Set up payment info</p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/settings/reminders"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">Reminders</p>
                <p className="text-xs text-zinc-500">Auto-collect overdue</p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}