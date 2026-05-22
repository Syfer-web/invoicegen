'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReminderSettingsPage() {
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
      if (!user) return

      const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
      if (!company) return

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

      // Count pending reminders
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, due_date')
        .eq('company_id', company.id)
        .in('status', ['sent', 'overdue'])
      setPendingCount(invoices?.length || 0)

      setLoading(false)
    }
    load()
  }, [])

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

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded mb-2" />
        <div className="h-4 w-72 bg-white/5 rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Reminders</h1>
        <p className="text-sm text-zinc-500 mt-1">Control when clients receive payment reminders. {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} currently need{pendingCount === 1 ? 's' : ''} attention.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Master toggle */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Enable reminders</p>
              <p className="text-xs text-zinc-500 mt-0.5">Automatically remind clients about unpaid invoices</p>
            </div>
            <button type="button" onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))} className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {form.enabled && (
          <>
            {/* Auto send toggle */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-remind without approval</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Send reminders automatically on schedule — no manual approval needed</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, auto_reminders: !p.auto_reminders }))} className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${form.auto_reminders ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.auto_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Reminder schedule */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white mb-4">Reminder schedule</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-xs font-medium text-zinc-400">Due soon</span>
                    <p className="text-xs text-zinc-600 mt-0.5">days before due</p>
                  </div>
                  <input type="number" min="1" max="30" value={form.due_soon_days} onChange={e => setForm(p => ({ ...p, due_soon_days: Number(e.target.value) }))} className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center" />
                  <span className="text-xs text-zinc-500 w-20">days before</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-xs font-medium text-zinc-400">First reminder</span>
                    <p className="text-xs text-zinc-600 mt-0.5">days after due</p>
                  </div>
                  <input type="number" min="1" max="30" value={form.first_reminder_days} onChange={e => setForm(p => ({ ...p, first_reminder_days: Number(e.target.value) }))} className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center" />
                  <span className="text-xs text-zinc-500 w-20">days after due</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-xs font-medium text-zinc-400">Second reminder</span>
                    <p className="text-xs text-zinc-600 mt-0.5">days after due</p>
                  </div>
                  <input type="number" min="1" max="60" value={form.second_reminder_days} onChange={e => setForm(p => ({ ...p, second_reminder_days: Number(e.target.value) }))} className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center" />
                  <span className="text-xs text-zinc-500 w-20">days after due</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-xs font-medium text-zinc-400">Final reminder</span>
                    <p className="text-xs text-zinc-600 mt-0.5">days after due</p>
                  </div>
                  <input type="number" min="1" max="90" value={form.final_reminder_days} onChange={e => setForm(p => ({ ...p, final_reminder_days: Number(e.target.value) }))} className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center" />
                  <span className="text-xs text-zinc-500 w-20">days after due</span>
                </div>
              </div>
            </div>

            {/* Manual trigger */}
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
              <p className="text-sm font-semibold text-white mb-1">Send reminders now</p>
              <p className="text-xs text-zinc-500 mb-4">Manually trigger all reminders — checks every overdue invoice and sends appropriate emails.</p>
              <button type="button" onClick={triggerNow} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Send reminders now
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-all disabled:opacity-50">
          {saving && <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          Save settings
        </button>
      </form>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}