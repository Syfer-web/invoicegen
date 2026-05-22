'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState<'magic_link' | 'password'>('password')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (method === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        {/* Icon */}
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <svg className="h-[18px] w-[18px] text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        {/* Success message */}
        <h2 className="text-[15px] font-semibold text-white leading-snug tracking-tight mb-1">
          Check your email
        </h2>
        <p className="text-[13px] text-white/40 leading-relaxed mb-5">
          We sent a sign-in link to<br />
          <span className="text-white/70 font-medium">{email}</span>
        </p>

        {/* Help text */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-4 py-3">
          <p className="text-[12px] text-white/30 leading-relaxed">
            Click the link in the email — it expires in 1 hour. Check your spam folder if it doesn&apos;t arrive.
          </p>
        </div>

        <button
          onClick={() => setSent(false)}
          className="mt-4 text-[12px] text-white/30 hover:text-emerald-400/80 transition-colors"
        >
          ← Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3.5 py-2.5">
          <p className="text-[12px] text-red-400 leading-snug">{error}</p>
        </div>
      )}

      {/* Email input */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white placeholder-white/25 transition-all focus:border-emerald-500/40 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-emerald-500/15"
        />
      </div>

      {/* Password — only shown in password mode */}
      {method === 'password' && (
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white placeholder-white/25 transition-all focus:border-emerald-500/40 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-emerald-500/15"
          />
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 py-2.5 text-[13px] font-semibold text-black transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-40"
      >
        {loading ? 'Signing in...' : method === 'password' ? 'Sign in' : 'Send sign-in link'}
      </button>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.05]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0f1011] px-3 text-[11px] text-white/20 uppercase tracking-widest font-medium">
            or
          </span>
        </div>
      </div>

      {/* Method toggle */}
      <button
        type="button"
        onClick={() => {
          setMethod(method === 'password' ? 'magic_link' : 'password')
          setError('')
        }}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 text-[12px] text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all"
      >
        {method === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
      </button>
    </form>
  )
}