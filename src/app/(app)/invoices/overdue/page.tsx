'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total: number
  currency: string
  due_date: string
  client_id: string
  client: { id: string; name: string; email: string } | null
}

type SentReminder = {
  id: string
  reminder_type: 'gentle' | 'firm' | 'final'
  created_at: string
}

type OverdueInvoice = Invoice & {
  days_overdue: number
  sent_reminders: SentReminder[]
  last_reminder_at: string | null
}

type RepeatOffender = {
  client_id: string
  client_name: string
  overdue_count: number
  total_overdue: number
}

type Toast = { id: string; type: 'success' | 'error'; message: string }

type SortKey = 'most-overdue' | 'highest-amount' | 'oldest'
type FilterDays = 'all' | '7' | '14' | '30'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'EUR') {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  return `${symbols[currency] || '€'}${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function daysOverdue(dueDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

function getReminderType(days: number): 'gentle' | 'firm' | 'final' {
  if (days <= 7) return 'gentle'
  if (days <= 21) return 'firm'
  return 'final'
}

function getReminderLabel(type: 'gentle' | 'firm' | 'final') {
  const labels = { gentle: 'Gentle reminder', firm: 'Firm reminder', final: 'Final notice' }
  return labels[type]
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div style={{
      background: '#18181B', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', minHeight: '100px',
    }}>
      <div style={{ width: '60px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', marginBottom: '12px' }} />
      <div style={{ width: '80px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', marginBottom: '10px' }} />
      <div style={{ width: '110px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)' }} />
    </div>
  )
}

function SkeletonInvoiceRow() {
  return (
    <div style={{
      background: '#18181B', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '120px', height: '14px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px' }} />
          <div style={{ width: '80px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ width: '70px', height: '24px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: '60px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: '90px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{
      background: '#18181B', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: accent, borderRadius: '3px 0 0 3px' }} />
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>{sub}</p>
    </div>
  )
}

// ─── DAYS OVERDUE BADGE ───────────────────────────────────────────────────────

function DaysOverdueBadge({ days }: { days: number }) {
  let bg: string, text: string, border: string
  if (days <= 3) {
    bg = 'rgba(251,191,36,0.12)'; text = '#fbbf24'; border = 'rgba(251,191,36,0.2)'
  } else if (days <= 7) {
    bg = 'rgba(251,146,60,0.12)'; text = '#fb923c'; border = 'rgba(251,146,60,0.2)'
  } else if (days <= 14) {
    bg = 'rgba(248,113,113,0.12)'; text = '#f87171'; border = 'rgba(248,113,113,0.2)'
  } else if (days <= 30) {
    bg = 'rgba(248,113,113,0.18)'; text = '#ef4444'; border = 'rgba(248,113,113,0.3)'
  } else {
    bg = 'rgba(220,38,38,0.18)'; text = '#dc2626'; border = 'rgba(220,38,38,0.35)'
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '100px',
      fontSize: '11px', fontWeight: 700,
      background: bg, color: text, border: `1px solid ${border}`,
      letterSpacing: '0.01em',
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
      </svg>
      {days} day{days !== 1 ? 's' : ''} overdue
    </span>
  )
}

// ─── REPEAT OFFENDERS CARD ────────────────────────────────────────────────────

function RepeatOffendersCard({ offenders }: { offenders: RepeatOffender[] }) {
  return (
    <div style={{
      background: 'rgba(251,146,60,0.07)',
      border: '1px solid rgba(251,146,60,0.2)',
      borderRadius: '12px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(251,146,60,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#fb923c', margin: '0 0 4px' }}>
          {offenders.length} client{offenders.length !== 1 ? 's' : ''} — repeat offenders
        </p>
        <p style={{ fontSize: '11px', color: '#71717a', margin: 0 }}>
          {offenders.map(o => o.client_name).join(', ')}
        </p>
      </div>
    </div>
  )
}

// ─── REMINDER CONFIRM MODAL ────────────────────────────────────────────────────

function ReminderModal({
  invoice,
  onConfirm,
  onClose,
  loading,
}: {
  invoice: OverdueInvoice
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  const type = getReminderType(invoice.days_overdue)
  const typeColor = type === 'gentle' ? '#34d399' : type === 'firm' ? '#fb923c' : '#f87171'
  const typeLabel = getReminderLabel(type)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#18181B', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: 'rgba(16,185,129,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              Send Reminder
            </h3>
            <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
              Send a gentle nudge to {invoice.client?.name || 'your client'}
            </p>
          </div>
        </div>

        {/* Invoice info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
          padding: '14px', marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>Invoice</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>{invoice.invoice_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>Amount</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>Send type</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: typeColor }}>{typeLabel}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#a1a1aa', fontSize: '13px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 2, padding: '10px', borderRadius: '10px',
              background: '#10b981', border: 'none',
              color: '#000', fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
            onMouseDown={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
            onMouseUp={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                Send {type === 'gentle' ? 'Reminder' : type === 'firm' ? 'Firm' : 'Final Notice'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── TOAST ─────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'success' ? '#18181B' : '#18181B',
            border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
            borderLeft: `3px solid ${toast.type === 'success' ? '#34d399' : '#f87171'}`,
            borderRadius: '10px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: '280px', maxWidth: '380px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={toast.type === 'success' ? '#34d399' : '#f87171'} strokeWidth="2.5">
            {toast.type === 'success'
              ? <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" /><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" /></>
            }
          </svg>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#fff', margin: 0, flex: 1 }}>{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#52525b', padding: '0', display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}

// ─── EMPTY STATE ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 24px',
      background: '#18181B', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(52,211,153,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="1.5" />
            <path d="M8 12l3 3 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
        No overdue invoices
      </h3>
      <p style={{ fontSize: '14px', color: '#52525b', margin: '0 0 24px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
        All your invoices are on time — well done! 🎉
      </p>
      <Link href="/invoices/new" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 20px', background: '#10b981', color: '#000',
        borderRadius: '10px', fontSize: '13px', fontWeight: 700,
        textDecoration: 'none',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        New Invoice
      </Link>
    </div>
  )
}

// ─── OVERDUE INVOICE CARD ─────────────────────────────────────────────────────

function OverdueInvoiceCard({
  invoice,
  onSendReminder,
  sendingId,
}: {
  invoice: OverdueInvoice
  onSendReminder: (id: string) => void
  sendingId: string | null
}) {
  const isSending = sendingId === invoice.id
  const reminderType = getReminderType(invoice.days_overdue)

  return (
    <div style={{
      background: '#18181B', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px', padding: '18px 20px',
      transition: 'border-color 0.2s, transform 0.15s',
      position: 'relative',
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
      {/* Top row: badge + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' }}>
        <DaysOverdueBadge days={invoice.days_overdue} />
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
          {formatCurrency(invoice.total, invoice.currency)}
        </p>
      </div>

      {/* Client + invoice number */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>
          {invoice.client?.name || 'No client'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#52525b', fontFamily: 'monospace' }}>{invoice.invoice_number}</span>
          {invoice.client?.email && (
            <>
              <span style={{ color: '#27272a', fontSize: '10px' }}>·</span>
              <span style={{ fontSize: '11px', color: '#52525b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {invoice.client.email}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '10px', color: '#52525b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due date</p>
          <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>{formatDate(invoice.due_date)}</p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: '#52525b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last reminder</p>
          <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
            {invoice.last_reminder_at
              ? timeAgo(invoice.last_reminder_at)
              : <span style={{ color: '#52525b', fontStyle: 'italic' }}>Never</span>
            }
          </p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: '#52525b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sending</p>
          <p style={{ fontSize: '12px', color: '#10b981', margin: 0 }}>{getReminderLabel(reminderType)}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onSendReminder(invoice.id)}
          disabled={isSending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px',
            background: isSending ? 'rgba(16,185,129,0.5)' : '#10b981',
            border: 'none', color: '#000',
            fontSize: '12px', fontWeight: 700,
            cursor: isSending ? 'not-allowed' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isSending) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
        >
          {isSending ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Sending…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Send Reminder
            </>
          )}
        </button>

        <Link href={`/invoices`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 12px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#a1a1aa', fontSize: '12px', fontWeight: 500,
          textDecoration: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View
        </Link>

        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 12px', borderRadius: '8px',
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
          color: '#34d399', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.15)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.08)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mark Paid
        </button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function OverduePage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>('most-overdue')
  const [filterDays, setFilterDays] = useState<FilterDays>('all')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [modalInvoice, setModalInvoice] = useState<OverdueInvoice | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [repeatOffenders, setRepeatOffenders] = useState<RepeatOffender[]>([])

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setCheckingAuth(false)
    })
  }, [router])

  // Fetch overdue invoices
  const fetchOverdue = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Fetch all invoices that are overdue (due_date < today AND status IN ('sent', 'overdue'))
    const { data: rawInvoices, error } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, status, total, currency, due_date,
        client_id, clients:client_id(id, name, email)
      `)
      .eq('user_id', user.id)
      .in('status', ['sent', 'overdue'])
      .lt('due_date', todayStr)
      .order('due_date', { ascending: true })

    if (error || !rawInvoices) { setLoading(false); return }

    // Fetch sent reminders for all these invoices
    const invoiceIds = rawInvoices.map(i => i.id)
    const { data: allReminders } = await supabase
      .from('sent_reminders')
      .select('id, invoice_id, reminder_type, created_at')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: true })

    // Build overdue invoices with reminder data
    const reminderMap: Record<string, SentReminder[]> = {}
    for (const r of (allReminders ?? [])) {
      if (!reminderMap[r.invoice_id]) reminderMap[r.invoice_id] = []
      reminderMap[r.invoice_id].push(r)
    }

    const overdue: OverdueInvoice[] = rawInvoices.map((inv: any) => {
      const reminders = reminderMap[inv.id] ?? []
      const clientData = inv.clients?.[0] ?? inv.clients ?? null
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        status: inv.status,
        total: inv.total,
        currency: inv.currency,
        due_date: inv.due_date,
        client_id: inv.client_id,
        client: clientData ? { id: clientData.id, name: clientData.name, email: clientData.email } : null,
        days_overdue: daysOverdue(inv.due_date),
        sent_reminders: reminders,
        last_reminder_at: reminders.length > 0 ? reminders[reminders.length - 1].created_at : null,
      }
    })

    setInvoices(overdue)

    // Build repeat offenders: clients with 3+ overdue invoices
    const clientMap: Record<string, { count: number; total: number; name: string }> = {}
    for (const inv of overdue) {
      const cid = inv.client_id || inv.client?.id
      if (!cid) continue
      if (!clientMap[cid]) clientMap[cid] = { count: 0, total: 0, name: inv.client?.name || 'Unknown' }
      clientMap[cid].count++
      clientMap[cid].total += inv.total
    }
    const offenders = Object.entries(clientMap)
      .filter(([, v]) => v.count >= 2)
      .map(([cid, v]) => ({ client_id: cid, client_name: v.name, overdue_count: v.count, total_overdue: v.total }))
    setRepeatOffenders(offenders)

    setLoading(false)
  }, [])

  useEffect(() => {
    if (!checkingAuth) fetchOverdue()
  }, [checkingAuth, fetchOverdue])

  // Toast helpers
  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => dismissToast(id), 4000)
  }
  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  // Sort & filter
  const filtered = invoices.filter(inv => {
    if (filterDays === 'all') return true
    return inv.days_overdue >= parseInt(filterDays)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'most-overdue') return b.days_overdue - a.days_overdue
    if (sortBy === 'highest-amount') return b.total - a.total
    if (sortBy === 'oldest') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    return 0
  })

  // Stats
  const totalOverdueAmount = invoices.reduce((s, i) => s + i.total, 0)
  const overdueCount = invoices.length
  const avgDays = overdueCount > 0
    ? Math.round(invoices.reduce((s, i) => s + i.days_overdue, 0) / overdueCount)
    : 0

  // Send reminder via modal confirm
  const handleSendReminder = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId)
    if (inv) setModalInvoice(inv)
  }

  const confirmSendReminder = async () => {
    if (!modalInvoice) return
    setSendingId(modalInvoice.id)
    setModalInvoice(null)

    try {
      const type = getReminderType(modalInvoice.days_overdue)
      const res = await fetch('/api/reminders/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: modalInvoice.id, reminderType: type }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send reminder')
      }

      showToast('success', `Reminder sent to ${modalInvoice.client?.name || 'client'}`)
      // Refresh data
      await fetchOverdue()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send reminder')
    } finally {
      setSendingId(null)
    }
  }

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#52525b' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '13px' }}>Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(248,113,113,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" /><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Overdue Invoices
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#71717a', margin: 0, marginLeft: '48px' }}>
          {loading ? 'Loading…' : `${overdueCount} invoice${overdueCount !== 1 ? 's' : ''} need attention`}
        </p>
      </div>

      {/* Stats bar */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <StatCard
            label="Total Overdue"
            value={formatCurrency(totalOverdueAmount)}
            sub={`${overdueCount} invoice${overdueCount !== 1 ? 's' : ''}`}
            accent="#f87171"
          />
          <StatCard
            label="Invoices Overdue"
            value={String(overdueCount)}
            sub={overdueCount > 0 ? 'need action' : 'all clear'}
            accent="#fb923c"
          />
          <StatCard
            label="Avg. Days Overdue"
            value={overdueCount > 0 ? `${avgDays}d` : '—'}
            sub={overdueCount > 0 ? 'average age' : 'no overdue'}
            accent="#fbbf24"
          />
          <StatCard
            label="At Risk"
            value={String(repeatOffenders.length)}
            sub={repeatOffenders.length > 0 ? 'repeat offenders' : 'no repeat offenders'}
            accent="#ef4444"
          />
        </div>
      )}

      {/* Repeat offenders alert */}
      {!loading && repeatOffenders.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <RepeatOffendersCard offenders={repeatOffenders} />
        </div>
      )}

      {/* Controls */}
      {!loading && overdueCount > 0 && (
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '20px',
          flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Sort */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#52525b', marginRight: '6px', alignSelf: 'center' }}>Sort:</span>
            {([
              ['most-overdue', 'Most overdue'],
              ['highest-amount', 'Highest amount'],
              ['oldest', 'Oldest first'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                  background: sortBy === key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  border: sortBy === key ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                  color: sortBy === key ? '#fff' : '#71717a',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#52525b', marginRight: '6px', alignSelf: 'center' }}>Filter:</span>
            {([
              ['all', 'All'],
              ['7', '7+ days'],
              ['14', '14+ days'],
              ['30', '30+ days'],
            ] as [FilterDays, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterDays(key)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                  background: filterDays === key ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                  border: filterDays === key ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  color: filterDays === key ? '#10b981' : '#71717a',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div>
          {[1, 2, 3].map(i => <SkeletonInvoiceRow key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        overdueCount === 0 ? <EmptyState /> : (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            background: '#18181B', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
              No invoices match the current filter.
            </p>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
          {sorted.map(inv => (
            <OverdueInvoiceCard
              key={inv.id}
              invoice={inv}
              onSendReminder={handleSendReminder}
              sendingId={sendingId}
            />
          ))}
        </div>
      )}

      {/* Reminder confirm modal */}
      {modalInvoice && (
        <ReminderModal
          invoice={modalInvoice}
          onConfirm={confirmSendReminder}
          onClose={() => setModalInvoice(null)}
          loading={false}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .invoice-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .controls-wrap { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  )
}