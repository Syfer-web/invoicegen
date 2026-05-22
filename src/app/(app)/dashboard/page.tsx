'use client'

import { useState, useEffect, useRef } from 'react'
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
  totalPaidAllTime: number
}

type UserProfile = { full_name: string | null }

type Activity = {
  id: string
  type: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'client_added' | 'payment_received'
  description: string
  time: string
  timeAgo: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'EUR') {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  const sym = symbols[currency] || '€'
  return `${sym}${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid:      { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', label: 'Paid' },
    sent:      { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', label: 'Sent' },
    draft:     { bg: 'rgba(255,255,255,0.04)', text: '#71717a', label: 'Draft' },
    overdue:   { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: 'Overdue' },
    cancelled: { bg: 'rgba(63,63,70,0.08)',   text: '#52525b', label: 'Cancelled' },
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

function StatCard({
  label, value, sub, trend, accentColor, trendValue
}: {
  label: string
  value: string
  sub: string
  trend?: 'up' | 'down' | 'neutral'
  accentColor?: string
  trendValue?: string
}) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'
  const accent = accentColor || '#10b981'
  const trendColor = isPositive ? '#10b981' : isNegative ? '#f87171' : '#71717a'

  return (
    <div style={{
      background: '#18181B',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '116px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.12)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '3px', background: accent, borderRadius: '3px 0 0 3px',
      }} />

      <div>
        <p style={{
          fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#71717a', margin: '0 0 8px',
        }}>{label}</p>
        <p style={{
          fontSize: '30px', fontWeight: 700,
          letterSpacing: '-0.03em',
          color: '#fff', margin: 0, lineHeight: 1,
        }}>{value}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>{sub}</p>
        {trend && trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {trend === 'up' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="2.5">
                <path d="M7 17l9.2-9.2M17 17V8H8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {trend === 'down' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="2.5">
                <path d="M17 7L7.8 16.2M7 7v9h9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span style={{ fontSize: '11px', fontWeight: 600, color: trendColor }}>{trendValue}</span>
          </div>
        )}
      </div>
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
      marginBottom: '14px',
    }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: 0, letterSpacing: '0.01em' }}>{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} style={{
          fontSize: '12px', color: '#10b981', textDecoration: 'none',
          fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
          transition: 'gap 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.gap = '8px')}
          onMouseLeave={e => (e.currentTarget.style.gap = '4px')}
        >
          {action}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px',
      background: '#18181B', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto' }}>
          <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.04)" />
          <path d="M12 12h16M12 20h10M12 28h13" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 16px' }}>
        No invoices yet. Create your first one to get started.
      </p>
      <Link href="/invoices/new" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '9px 18px',
        background: '#10b981', color: '#000',
        borderRadius: '8px',
        fontSize: '13px', fontWeight: 600,
        textDecoration: 'none',
        transition: 'opacity 0.15s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.85')}
        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        New Invoice
      </Link>
    </div>
  )
}

// ─── Revenue Mini Chart ────────────────────────────────────────────────────────

function RevenueMiniChart({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(...monthly.map(m => m.total), 1)
  const hasData = monthly.some(m => m.total > 0)
  const total = monthly.reduce((s, m) => s + m.total, 0)

  return (
    <div style={{
      background: '#18181B', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '20px',
    }}>
      <SectionHeader title="Revenue — Last 6 Mo" />
      <div style={{ marginTop: '4px', marginBottom: '20px' }}>
        <p style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {hasData ? formatCurrency(total) : '€0.00'}
        </p>
        <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>
          {hasData ? `${monthly.filter(m => m.total > 0).length} months with revenue` : 'No revenue recorded yet'}
        </p>
      </div>
      {/* Chart */}
      <div style={{ position: 'relative', height: '60px' }}>
        <svg viewBox="0 0 100 60" style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts = monthly.map((m, i) => ({
              x: (i / Math.max(monthly.length - 1, 1)) * 100,
              y: 60 - (m.total / max) * 58,
            }))
            const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
            const area = `${line} L 100 60 L 0 60 Z`
            return (
              <>
                <path d={area} fill="url(#rg)" />
                <path d={line} fill="none" stroke="#10b981" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#10b981" />
                ))}
              </>
            )
          })()}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {monthly.map(m => (
          <span key={m.month} style={{ fontSize: '10px', color: '#3f3f46', flex: 1, textAlign: 'center' }}>{m.month}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, onHover }: { invoice: Invoice; onHover: boolean }) {
  const [rowHover, setRowHover] = useState(false)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 14px',
        borderRadius: '8px',
        background: rowHover ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.15s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
    >
      {/* Client / Invoice */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: '13px', fontWeight: 500, color: '#fff',
          margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {invoice.client?.name || 'No client'}
        </p>
        <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>{invoice.invoice_number}</p>
      </div>
      {/* Amount */}
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
        {formatCurrency(invoice.total, invoice.currency)}
      </p>
      {/* Due date */}
      <p style={{
        fontSize: '12px',
        color: invoice.status === 'overdue' ? '#f87171' : '#71717a',
        margin: 0,
      }}>
        {formatDate(invoice.due_date)}
        {invoice.status === 'overdue' && (
          <span style={{ display: 'block', fontSize: '10px', color: '#f87171', marginTop: '1px' }}>
            {Math.abs(daysUntil(invoice.due_date))}d overdue
          </span>
        )}
      </p>
      {/* Status */}
      <StatusBadge status={invoice.status} />
      {/* Row actions — visible on hover */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '4px', opacity: rowHover ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>
        <button title="Edit" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button title="Duplicate" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  const iconMap: Record<string, { bg: string; icon: React.ReactNode }> = {
    invoice_paid: {
      bg: 'rgba(52,211,153,0.12)',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    invoice_created: {
      bg: 'rgba(255,255,255,0.06)',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    invoice_sent: {
      bg: 'rgba(96,165,250,0.12)',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    client_added: {
      bg: 'rgba(16,185,129,0.10)',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    payment_received: {
      bg: 'rgba(52,211,153,0.12)',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
  }
  const config = iconMap[activity.type] || iconMap.invoice_created

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: config.bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '2px',
      }}>
        {config.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 2px', lineHeight: 1.4 }}>
          {activity.description}
        </p>
        <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>{activity.timeAgo}</p>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: '#18181B', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', minHeight: '116px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '3px', borderRadius: '3px 0 0 3px',
        background: 'rgba(255,255,255,0.04)',
      }} />
      <div style={{ width: '55px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', marginBottom: '12px' }} />
      <div style={{ width: '80px', height: '30px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', marginBottom: '10px' }} />
      <div style={{ width: '100px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)' }} />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div style={{
      background: '#18181B', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)', padding: '20px',
    }}>
      <div style={{ width: '120px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', marginBottom: '14px' }} />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ flex: 2 }}>
            <div style={{ width: `${100 + i * 20}px`, height: '11px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', marginBottom: '5px' }} />
            <div style={{ width: '60px', height: '9px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '60px', height: '11px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '70px', height: '11px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '50px', height: '20px', borderRadius: '100px', background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; total: number }[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
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
        .limit(25)

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
        const totalPaidAllTime = rows.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)

        setStats({ outstanding, outstandingCount, paidThisMonth, paidThisMonthCount, overdueCount, overdueAmount, totalPaidAllTime })
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

        // Build activity feed from recent invoices
        const act: Activity[] = []
        rows.slice(0, 8).forEach(inv => {
          if (inv.status === 'paid' && inv.paid_at) {
            act.push({
              id: inv.id + '-paid',
              type: 'invoice_paid',
              description: `${inv.client?.name || 'Client'} payment received — ${inv.invoice_number}`,
              time: inv.paid_at,
              timeAgo: timeAgo(inv.paid_at),
            })
          } else if (inv.status === 'sent') {
            act.push({
              id: inv.id + '-sent',
              type: 'invoice_sent',
              description: `${inv.invoice_number} sent to ${inv.client?.name || 'client'}`,
              time: inv.created_at,
              timeAgo: timeAgo(inv.created_at),
            })
          } else if (inv.status === 'draft') {
            act.push({
              id: inv.id + '-created',
              type: 'invoice_created',
              description: `${inv.invoice_number} created for ${inv.client?.name || 'client'}`,
              time: inv.created_at,
              timeAgo: timeAgo(inv.created_at),
            })
          }
        })
        act.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        setActivity(act.slice(0, 6))
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
        <div style={{ marginBottom: '32px' }}>
          <div style={{ width: '220px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '6px' }} />
          <div style={{ width: '160px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }} />
        </div>
        {/* Stats skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '20px',
        }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        {/* Table skeleton */}
        <SkeletonTable />
      </div>
    )
  }

  // ─── Content ─────────────────────────────────────────────────────────────

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || null
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayShort = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div>
      {/* Personal greeting header */}
      <div style={{
        marginBottom: '32px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '26px', fontWeight: 700,
            letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px',
          }}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p style={{ fontSize: '14px', color: '#52525b', margin: 0 }}>
            {today} · {stats ? `${stats.outstandingCount + stats.overdueCount} open items` : 'Loading…'}
          </p>
        </div>
        {/* Quick action pill row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/invoices/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            background: '#10b981', color: '#000',
            borderRadius: '100px',
            fontSize: '13px', fontWeight: 700,
            textDecoration: 'none',
            transition: 'opacity 0.15s, transform 0.15s',
            letterSpacing: '-0.01em',
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.opacity = '0.88'
              el.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.opacity = '1'
              el.style.transform = 'scale(1)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Invoice
          </Link>
          {[
            { href: '/clients', label: 'Add Client', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" /></svg> },
            { href: '/products', label: 'Products', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round" /></svg> },
            { href: '/recurring', label: 'Recurring', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a1a1aa',
              borderRadius: '100px',
              fontSize: '12px', fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(255,255,255,0.08)'
                el.style.borderColor = 'rgba(255,255,255,0.14)'
                el.style.color = '#fff'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.color = '#a1a1aa'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <StatCard
          label="Outstanding"
          value={stats ? formatCurrency(stats.outstanding) : '€0.00'}
          sub={stats ? `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? 's' : ''} pending` : '0 pending'}
          trend={stats && stats.outstandingCount > 0 ? 'up' : 'neutral'}
          trendValue={stats && stats.outstandingCount > 0 ? `+${stats.outstandingCount}` : undefined}
          accentColor="#f59e0b"
        />
        <StatCard
          label="Paid this month"
          value={stats ? formatCurrency(stats.paidThisMonth) : '€0.00'}
          sub={stats ? `${stats.paidThisMonthCount} paid` : '0 this month'}
          trend={stats && stats.paidThisMonthCount > 0 ? 'up' : 'neutral'}
          trendValue={stats && stats.paidThisMonthCount > 0 ? `+${stats.paidThisMonthCount}` : undefined}
          accentColor="#10b981"
        />
        <StatCard
          label="Overdue"
          value={stats ? stats.overdueCount.toString() : '0'}
          sub={stats?.overdueAmount ? formatCurrency(stats.overdueAmount) : 'No overdue'}
          trend={stats && stats.overdueCount > 0 ? 'down' : 'neutral'}
          trendValue={stats && stats.overdueCount > 0 ? `${stats.overdueCount} inv` : undefined}
          accentColor="#f87171"
        />
        <StatCard
          label="Total earned"
          value={stats ? formatCurrency(stats.totalPaidAllTime) : '€0.00'}
          sub="All time"
          trend="up"
          trendValue={stats ? `${stats.totalPaidAllTime > 0 ? '↗' : ''}` : undefined}
          accentColor="#10b981"
        />
      </div>

      {/* Main content row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '14px',
      }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Recent invoices */}
          <div style={{
            background: '#18181B', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
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
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                  gap: '12px',
                  padding: '0 14px 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '4px',
                }}>
                  {['Client', 'Amount', 'Due', 'Status', ''].map(h => (
                    <p key={h} style={{
                      fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#3f3f46', margin: 0,
                    }}>{h}</p>
                  ))}
                </div>
                {/* Rows */}
                {recentInvoices.map(inv => (
                  <InvoiceRow key={inv.id} invoice={inv} onHover={false} />
                ))}
                {/* View all link */}
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <Link href="/invoices" style={{
                    fontSize: '12px', color: '#10b981', textDecoration: 'none',
                    fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px',
                    transition: 'gap 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.gap = '8px')}
                    onMouseLeave={e => (e.currentTarget.style.gap = '4px')}
                  >
                    View all invoices
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Revenue chart — desktop only */}
          <style>{`
            @media (max-width: 900px) {
              .revenue-chart { display: none !important; }
            }
          `}</style>
          <div className="revenue-chart">
            <RevenueMiniChart monthly={monthlyRevenue} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Activity feed */}
          <div style={{
            background: '#18181B', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px',
          }}>
            <SectionHeader title="Recent Activity" />
            {activity.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#3f3f46', margin: '8px 0', textAlign: 'center' }}>
                No activity yet
              </p>
            ) : (
              <div>
                {activity.map(a => <ActivityItem key={a.id} activity={a} />)}
              </div>
            )}
          </div>

          {/* Quick links card */}
          <div style={{
            background: '#18181B', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px',
          }}>
            <SectionHeader title="Quick Links" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { href: '/settings/bank', label: 'Bank Details', desc: 'Payment information', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" /></svg> },
                { href: '/settings/reminders', label: 'Reminders', desc: 'Auto-payment alerts', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                { href: '/settings', label: 'Account Settings', desc: 'Profile & preferences', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" /></svg> },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '8px',
                  textDecoration: 'none', background: 'transparent',
                  transition: 'background 0.15s',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.icon}
                    <div>
                      <p style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '11px', color: '#52525b', margin: '1px 0 0' }}>{item.desc}</p>
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only revenue chart */}
      <style>{`
        @media (min-width: 901px) {
          .revenue-chart-mobile { display: none !important; }
        }
        @media (max-width: 900px) {
          .revenue-chart-mobile { display: block !important; margin-top: 14px; }
          .main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="revenue-chart-mobile" style={{ display: 'none' }}>
        <RevenueMiniChart monthly={monthlyRevenue} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .quick-actions { flex-direction: column !important; align-items: flex-start !important; }
          .quick-actions a { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}