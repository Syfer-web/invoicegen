'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function ReminderSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const [form, setForm] = useState({
    enabled: true,
    auto_reminders: true,
    due_soon_days: 3,
    first_reminder_days: 1,
    second_reminder_days: 7,
    final_reminder_days: 14,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
      if (!company) { setLoading(false); return }

      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('company_id', company.id)
        .single()

      if (settings) {
        setForm({
          enabled: settings.enabled ?? true,
          auto_reminders: settings.auto_reminders ?? true,
          due_soon_days: settings.due_soon_days ?? 3,
          first_reminder_days: settings.first_reminder_days ?? 1,
          second_reminder_days: settings.second_reminder_days ?? 7,
          final_reminder_days: settings.final_reminder_days ?? 14,
        })
      }

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, due_date')
        .eq('company_id', company.id)
        .in('status', ['sent', 'overdue'])
      setPendingCount(invoices?.length || 0)

      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) { setSaving(false); return }

    const { error } = await supabase
      .from('reminder_settings')
      .upsert({ company_id: company.id, ...form }, { onConflict: 'company_id' })

    if (error) {
      setToast({ type: 'error', message: error.message })
    } else {
      setToast({ type: 'success', message: 'Reminder settings saved' })
    }

    setSaving(false)
    setTimeout(() => setToast(null), 3000)
  }

  async function triggerNow() {
    setToast({ type: 'success', message: 'Reminders triggered — checking all overdue invoices...' })
    try {
      const res = await fetch('/api/reminders/send', { method: 'POST' })
      const data = await res.json()
      setToast({ type: 'success', message: `Sent ${data.total || 0} reminders` })
    } catch {
      setToast({ type: 'error', message: 'Failed to send reminders' })
    }
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button
        type="button"
        onClick={onChange}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 999,
          transition: 'background 0.2s',
          background: checked ? '#10b981' : '#3f3f46',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s',
            transform: checked ? 'translateX(23px)' : 'translateX(3px)',
          }}
        />
      </button>
    )
  }

  function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
    return (
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 14,
          textAlign: 'center',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    )
  }

  function ScheduleRow({ label, sublabel, value, onChange, min, max, suffix }: {
    label: string
    sublabel: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    suffix: string
  }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 160, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#71717a' }}>{label}</span>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{sublabel}</p>
        </div>
        <NumberInput value={value} onChange={onChange} min={min} max={max} />
        <span style={{ fontSize: 12, color: '#71717a', width: 80 }}>{suffix}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, animation: 'pulse 2s ease-in-out infinite' }}>
        <div style={{ height: 32, width: 192, borderRadius: 8, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
        <div style={{ height: 16, width: 288, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 32 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Reminders</h1>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
            Control when clients receive payment reminders. {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} currently need{pendingCount === 1 ? 's' : ''} attention.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Enable reminders</p>
                <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, margin: '4px 0 0' }}>Automatically remind clients about unpaid invoices</p>
              </div>
              <Toggle checked={form.enabled} onChange={() => setForm(p => ({ ...p, enabled: !p.enabled }))} />
            </div>
          </div>

          {form.enabled && (
            <>
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Auto-remind without approval</p>
                    <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, margin: '4px 0 0' }}>Send reminders automatically on schedule — no manual approval needed</p>
                  </div>
                  <Toggle checked={form.auto_reminders} onChange={() => setForm(p => ({ ...p, auto_reminders: !p.auto_reminders }))} />
                </div>
              </div>

              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Reminder schedule</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <ScheduleRow label="Due soon" sublabel="days before due" value={form.due_soon_days} onChange={v => setForm(p => ({ ...p, due_soon_days: v }))} min={1} max={30} suffix="days before" />
                  <ScheduleRow label="First reminder" sublabel="days after due" value={form.first_reminder_days} onChange={v => setForm(p => ({ ...p, first_reminder_days: v }))} min={1} max={30} suffix="days after due" />
                  <ScheduleRow label="Second reminder" sublabel="days after due" value={form.second_reminder_days} onChange={v => setForm(p => ({ ...p, second_reminder_days: v }))} min={1} max={60} suffix="days after due" />
                  <ScheduleRow label="Final reminder" sublabel="days after due" value={form.final_reminder_days} onChange={v => setForm(p => ({ ...p, final_reminder_days: v }))} min={1} max={90} suffix="days after due" />
                </div>
              </div>

              <div style={{ borderRadius: 16, border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.05)', padding: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Send reminders now</p>
                <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16 }}>Manually trigger all reminders — checks every overdue invoice and sends appropriate emails.</p>
                <button
                  type="button"
                  onClick={triggerNow}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: '#10b981', padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#000', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: 16 }}>↻</span>
                  Send reminders now
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, background: '#10b981', padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#000', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            {saving && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.6s linear infinite' }} />}
            Save settings
          </button>
        </form>

        {toast && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5',
            animation: 'slideInRight 0.3s ease',
          }}>
            <span style={{ fontSize: 16 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.message}
          </div>
        )}
      </div>
    </>
  )
}