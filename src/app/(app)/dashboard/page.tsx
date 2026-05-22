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

type UserProfile = { full_name: string | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'EUR') {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  const sym = symbols[currency] || '€'
  return `${sym}${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid:    { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', label: 'Paid' },
    sent:    { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', label: 'Sent' },
    draft:   { bg: 'rgba(255,255,255,0.05)', text: '#71717a', label: 'Draft' },
    overdue: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: 'Overdue' },
    cancelled: { bg: 'rgba(63,63,70,0.12)',  text: '#52525b', label: 'Cancelled' },
  }
  const c = map[status] || map.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '100px',
      fontSize: '11px', fontWeight: 600,
      background: c.bg, color: c.text,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.text }} />
      {c.label}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend }: {
  label: string
  value: string
  sub: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div style={{
      background: '#0f0f10',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '112px',
      transition: 'border-color 0.15s',
    }}>
      <div>
        <p style={{
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#52525b', margin: '0 0 10px',
        }}>{label}</p>
        <p style={{
          fontSize: '28px', fontWeight: 700,
          letterSpacing: '-0.03em',
          color: '#fff', margin: 0, lineHeight: 1,
        }}>{value}</p>
      </div>
      <p style={{ fontSize: '12px', color: '#52525b', margin: '8px 0 0' }}>{sub}</p>
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, action, actionHref }: {
  title: string
  action?: string
  actionHref?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '12px',
    }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: 0 }}>{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} style={{
          fontSize: '12px', color: '#10b981', textDecoration: 'none',
          fontWeight: 500,
        }}>{action} →</Link>
      )}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px',
      background: '#0f0f10', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 16px' }}>
        No invoices yet. Create your first one to get started.
      </p>
      <Link href="/invoices/new" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px',
        background: '#10b981', color: '#000',
        borderRadius: '8px',
        fontSize: '13px', fontWeight: 600,
        textDecoration: 'none',
      }}>
        + New Invoice
      </Link>
    </div>
  )
}

// ─── Revenue Mini Chart ────────────────────────────────────────────────────────

function RevenueMiniChart({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(...monthly.map(m => m.total), 1)
  const hasData = monthly.some(m => m.total > 0)
  const total = monthly.reduce((s, m) => s + m.total, 0)

  if (!hasData) {
    return (
      <div style={{
        background: '#0f0f10', borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '20px',
      }}>
        <SectionHeader title="Revenue" />
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>€0.00</p>
          <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>No revenue yet</p>
        </div>
        {/* Placeholder bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px', marginTop: '20px' }}>
          {[40, 60, 45, 70, 55, 35].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`,
              borderRadius: '3px 3px 0 0',
              background: 'rgba(255,255,255,0.06)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {monthly.map(m => (
            <span key={m.month} style={{ fontSize: '10px', color: '#3f3f46', flex: 1, textAlign: 'center' }}>{m.month}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0f0f10', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '20px',
    }}>
      <SectionHeader title="Revenue" />
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{formatCurrency(total)}</p>
        <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>Last 6 months</p>
      </div>
      {/* Chart */}
      <div style={{ position: 'relative', marginTop: '20px' }}>
        <svg viewBox="0 0 100 48" style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts = monthly.map((m, i) => ({
              x: (i / (monthly.length - 1)) * 100,
              y: 48 - (m.total / max) * 48,
            }))
            const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
            const area = `${line} L 100 48 L 0 48 Z`
            return (
              <>
                <path d={area} fill="url(#rg)" />
                <path d={line} fill="none" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
                {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#10b981" />)}
              </>
            )
          })()}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {monthly.map(m => (
          <span key={m.month} style={{ fontSize: '10px', color: '#3f3f46', flex: 1, textAlign: 'center' }}>{m.month}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; total: number }[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      if (prof) setProfile(prof)

      const { data: company } = await supabase
        .from('companies').select('id').eq('user_id', user.id).single()
      const companyId = company?.id
      if (!companyId) { setLoading(false); return }

      const { data: invoices } = await supabase
        .from('invoices').select('*, client:clients(name, email)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (invoices) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const rows = invoices as Invoice[]

        const outstanding = rows.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
        const outstandingCount = rows.filter(i => ['sent', 'draft'].includes(i.status)).length
        const paidThisMonth = rows.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).reduce((s, i) => s + (i.total || 0), 0)
        const paidThisMonthCount = rows.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).length
        const overdueCount = rows.filter(i => i.status === 'overdue').length
        const overdueAmount = rows.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0)

        setStats({ outstanding, outstandingCount, paidThisMonth, paidThisMonthCount, overdueCount, overdueAmount })
        setRecentInvoices(rows.slice(0, 8))

        const months: Record<string, number> = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months[d.toLocaleDateString('en-GB', { month: 'short' })] = 0
        }
        rows.filter(i => i.status === 'paid' && i.paid_at).forEach(i => {
          const key = new Date(i.paid_at as string).toLocaleDateString('en-GB', { month: 'short' })
          if (key in months) months[key] += i.total || 0
        })
        setMonthlyRevenue(Object.entries(months).map(([month, total]) => ({ month, total })))
      }

      setLoading(false)
    }
    load()
  }, [])

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ width: '180px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '6px' }} />
          <div style={{ width: '240px', height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }} />
        </div>
        {/* Stats skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '20px', minHeight: '112px',
            }}>
              <div style={{ width: '60px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', marginBottom: '12px' }} />
              <div style={{ width: '80px', height: '28px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
          <div style={{ background: '#0f0f10', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', height: '280px' }} />
          <div style={{ background: '#0f0f10', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', height: '280px' }} />
        </div>
      </div>
    )
  }

  // ─── Content ─────────────────────────────────────────────────────────────

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || null
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '24px', fontWeight: 700,
          letterSpacing: '-0.03em', color: '#fff', margin: '0 0 4px',
        }}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p style={{ fontSize: '13px', color: '#52525b', margin: 0 }}>{today}</p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '14px',
      }}>
        <StatCard
          label="Outstanding"
          value={stats ? formatCurrency(stats.outstanding) : '€0.00'}
          sub={stats ? `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? 's' : ''} pending` : '0 invoices pending'}
        />
        <StatCard
          label="Paid this month"
          value={stats ? formatCurrency(stats.paidThisMonth) : '€0.00'}
          sub={stats ? `${stats.paidThisMonthCount} paid this month` : '0 paid this month'}
        />
        <StatCard
          label="Overdue"
          value={stats ? stats.overdueCount.toString() : '0'}
          sub={stats?.overdueAmount ? formatCurrency(stats.overdueAmount) : 'No overdue'}
        />
        <StatCard
          label="Total paid"
          value={stats ? formatCurrency(stats.paidThisMonth) : '€0.00'}
          sub="All time"
        />
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>

        {/* Recent invoices */}
        <div style={{
          background: '#0f0f10', borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '20px',
        }}>
          <SectionHeader title="Recent Invoices" action="View all" actionHref="/invoices" />

          {recentInvoices.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '12px',
                padding: '0 0 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '4px',
              }}>
                {['Client / Invoice', 'Amount', 'Due Date', 'Status'].map(h => (
                  <p key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', margin: 0 }}>{h}</p>
                ))}
              </div>
              {/* Rows */}
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {/* Client / Invoice */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff', margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inv.client?.name || 'No client'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>{inv.invoice_number}</p>
                  </div>
                  {/* Amount */}
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    {formatCurrency(inv.total, inv.currency)}
                  </p>
                  {/* Due date */}
                  <p style={{ fontSize: '12px', color: inv.status === 'overdue' ? '#f87171' : '#71717a', margin: 0 }}>
                    {formatDate(inv.due_date)}
                    {inv.status === 'overdue' && (
                      <span style={{ display: 'block', fontSize: '10px', color: '#f87171' }}>
                        {Math.abs(daysUntil(inv.due_date))}d overdue
                      </span>
                    )}
                  </p>
                  {/* Status */}
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <RevenueMiniChart monthly={monthlyRevenue} />

          {/* Quick links */}
          <div style={{
            background: '#0f0f10', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '20px',
          }}>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { href: '/invoices/new', label: 'New Invoice', color: '#10b981' },
                { href: '/clients', label: 'Add Client', color: '#71717a' },
                { href: '/settings/bank', label: 'Bank Details', color: '#71717a' },
                { href: '/settings/reminders', label: 'Reminders', color: '#71717a' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  background: 'transparent',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 400 }}>{item.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}