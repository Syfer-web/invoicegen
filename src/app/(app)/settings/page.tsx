'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      const { data: company } = await supabase
        .from('companies').select('name').eq('user_id', user.id).single()
      if (company) setCompanyName(company.name || '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('companies')
      .update({ name: companyName })
      .eq('user_id', user.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        <div className="h-48 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account details</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              placeholder="Acme Ltd"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : 'Save changes'}
          </button>
          {saved && <span className="text-xs text-zinc-500">Changes saved successfully</span>}
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-6">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger zone</h2>
        <p className="text-xs text-zinc-500 mb-4">Deleting your account will permanently remove all data including invoices, clients, and settings.</p>
        <button
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          disabled
        >
          Delete account
        </button>
      </div>
    </div>
  )
}