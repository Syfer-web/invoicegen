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

type UserProfile = { full_name: string | null }

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

function formatMonthShort(date: Date) {
  return date.toLocaleDateString('en-GB', { month: 'short' })
}

// ─── Glow Orbs (background depth) ─────────────────────────────────────────

function GlowOrbs() {
  return (
    <>
      {/* Emerald glow — top right */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-40px',
        width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle secondary — bottom left */}
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-20px',
        width: '240px', height: '240px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
    </>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accentColor, href,
}: {
  label: string
  value: string
  sub: string
  accentColor: string
  href?: string
}) {
  const [hovered, setHovered] = useState(false)
  const content = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '20px 24px',
        borderRadius: '16px',
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.2s ease',
        cursor: href ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar on left */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%',
        width: '3px',
        borderRadius: '0 3px 3px 0',
        background: accentColor,
        opacity: hovered ? 1 : 0.6,
        transition: 'opacity 0.2s ease',
      }} />
      <div>
        <p style={{
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#52525b', margin: '0 0 12px',
        }}>{label}</p>
        <p style={{
          fontSize: '28px', fontWeight: 700,
          letterSpacing: '-0.03em',
          color: hovered ? '#fff' : (accentColor === '#fff' ? '#fff' : accentColor),
          margin: 0,
          transition: 'color 0.2s ease',
        }}>{value}</p>
      </div>
      <p style={{ fontSize: '12px', color: '#52525b', margin: '8px 0 0' }}>{sub}</p>
      {href && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

// ─── Revenue Chart ───────────────────────────────────────────────────────────

function RevenueChart({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(...monthly.map(m => m.total), 1)
  const height = 90
  const hasData = monthly.some(m => m.total > 0)

  const points = monthly.map((m, i) => ({
    x: (i / Math.max(monthly.length - 1, 1)) * 100,
    y: height - (m.total / max) * height,
    total: m.total,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`).join(' ')
  const areaD = `${pathD} L 100% ${height} L 0% ${height} Z`
  const areaGradientId = 'revGrad'

  const total = monthly.reduce((s, m) => s + m.total, 0)

  return (
    <div style={{
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#52525b', margin: 0 }}>
          Revenue — last 6 months
        </p>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
          {hasData ? formatCurrency(total) : '—'}
        </p>
      </div>

      {hasData ? (
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
            <defs>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${areaGradientId})`} />
            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={`${p.x}%`} cy={p.y} r="1.5" fill="#10b981" />
            ))}
          </svg>
          {/* Month labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '1px' }}>
            {monthly.map(m => (
              <span key={m.month} style={{ fontSize: '10px', color: '#3f3f46', flex: 1, textAlign: 'center' }}>{m.month}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px` }}>
          {[35, 55, 40, 60, 45, 30].map((h, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: '4px 4px 0 0',
              background: 'rgba(255,255,255,0.06)',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    paid:    { bg: 'rgba(16,185,129,0.12)', text: '#34d399', dot: '#34d399', label: 'Paid' },
    sent:    { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', dot: '#60a5fa', label: 'Sent' },
    draft:   { bg: 'rgba(255,255,255,0.05)', text: '#71717a', dot: '#71717a', label: 'Draft' },
    overdue: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', dot: '#f87171', label: 'Overdue' },
    cancelled: { bg: 'rgba(63,63,70,0.12)', text: '#52525b', dot: '#52525b', label: 'Cancelled' },
  }
  const c = configs[status] || configs.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px',
      borderRadius: '100px',
      fontSize: '11px', fontWeight: 600,
      background: c.bg, color: c.text,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ userName }: { userName: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {/* Invoice icon */}
      <div style={{
        width: '56px', height: '56px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a1a1aa', margin: '0 0 8px' }}>
        No invoices yet
      </h3>
      <p style={{ fontSize: '13px', color: '#52525b', margin: '0 0 24px', maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Create your first invoice and start getting paid online.
      </p>
      <Link
        href="/invoices/new"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          borderRadius: '10px',
          background: '#10b981', color: '#000',
          fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        New Invoice
      </Link>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    href: '/invoices/new',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: 'rgba(16,185,129,0.12)', iconColor: '#34d399',
    title: 'New Invoice', sub: 'Create and send instantly',
  },
  {
    href: '/clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: 'rgba(255,255,255,0.06)', iconColor: '#71717a',
    title: 'Add Client', sub: 'Save for faster invoicing',
  },
  {
    href: '/settings/bank',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: 'rgba(255,255,255,0.06)', iconColor: '#71717a',
    title: 'Bank Details', sub: 'Set up payment info',
  },
  {
    href: '/settings/reminders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: 'rgba(255,255,255,0.06)', iconColor: '#71717a',
    title: 'Reminders', sub: 'Auto-collect overdue',
  },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      ...style,
    }}>
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite',
        borderRadius: '16px',
      }} />
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; total: number }[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile for user name
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setUserProfile(profile)

      // Get company
      const { data: company } = await supabase
        .from('companies').select('id').eq('user_id', user.id).single()
      const companyId = company?.id
      if (!companyId) { setLoading(false); return }

      // Invoices
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
        setRecentInvoices(rows.slice(0, 5))

        // Monthly revenue
        const months: Record<string, number> = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months[d.toLocaleDateString('en-GB', { month: 'short' })] = 0
        }
        rows.filter(i => i.status === 'paid' && i.paid_at).forEach(i => {
          const shortKey = new Date(i.paid_at as string).toLocaleDateString('en-GB', { month: 'short' })
          if (shortKey in months) months[shortKey] += i.total || 0
        })
        setMonthlyRevenue(Object.entries(months).map(([month, total]) => ({ month, total })))
      }

      setLoading(false)
    }
    load()
  }, [])

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ position: 'relative' }}>
        <GlowOrbs />
        {/* Greeting skeleton */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ width: '200px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', marginBottom: '8px' }} />
            <div style={{ width: '140px', height: '16px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>
        {/* Stats skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {[220, 180, 160, 140].map((w, i) => (
            <div key={i} style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '112px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.8s infinite', borderRadius: '16px' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '160px' }} />
          <div style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '160px' }} />
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      </div>
    )
  }

  // ─── Content ─────────────────────────────────────────────────────────────────

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = userProfile?.full_name?.split(' ')[0] || null

  return (
    <div style={{ position: 'relative' }}>
      <GlowOrbs />

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: 700,
          letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px',
        }}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p style={{ fontSize: '14px', color: '#52525b', margin: 0 }}>
          Here's what's happening with your invoices
        </p>
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
          value={stats ? formatCurrency(stats.outstanding) : '—'}
          sub={stats ? `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? 's' : ''} pending` : ''}
          accentColor="#fff"
          href="/invoices"
        />
        <StatCard
          label="Paid this month"
          value={stats ? formatCurrency(stats.paidThisMonth) : '—'}
          sub={stats ? `${stats.paidThisMonthCount} paid` : ''}
          accentColor="#34d399"
          href="/invoices?status=paid"
        />
        <StatCard
          label="Overdue"
          value={stats ? stats.overdueCount.toString() : '—'}
          sub={stats ? (stats.overdueAmount > 0 ? formatCurrency(stats.overdueAmount) : 'No overdue') : ''}
          accentColor={stats && stats.overdueCount > 0 ? '#f87171' : '#52525b'}
          href="/invoices?status=overdue"
        />
        <StatCard
          label="Total clients"
          value={stats ? stats.outstandingCount.toString() : '0'}
          sub="Add your first client"
          accentColor="#52525b"
          href="/clients"
        />
      </div>

      {/* Revenue chart */}
      <div style={{ marginBottom: '14px' }}>
        <RevenueChart monthly={monthlyRevenue} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>

        {/* Recent invoices */}
        <div style={{
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: 0 }}>Recent invoices</h2>
            <Link href="/invoices" style={{
              fontSize: '12px', color: '#10b981', textDecoration: 'none',
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              All invoices
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyState userName={firstName || 'there'} />
          ) : (
            <div>
              {recentInvoices.map((inv, i) => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < recentInvoices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>{inv.invoice_number}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p style={{ fontSize: '12px', color: '#52525b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inv.client?.name || 'No client'} · Due {formatDate(inv.due_date)}
                      {daysUntil(inv.due_date) < 0 && inv.status !== 'paid' && (
                        <span style={{ color: '#f87171', marginLeft: '6px' }}>({Math.abs(daysUntil(inv.due_date))}d overdue)</span>
                      )}
                    </p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7', marginLeft: '20px', flexShrink: 0 }}>
                    {formatCurrency(inv.total, inv.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: 0 }}>Quick actions</h2>
          </div>
          <div style={{ padding: '10px' }}>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: '9px',
                  background: action.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: action.iconColor }}>{action.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', margin: 0 }}>{action.title}</p>
                  <p style={{ fontSize: '12px', color: '#52525b', margin: '2px 0 0' }}>{action.sub}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}