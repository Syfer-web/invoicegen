'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 mx-auto">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            We sent a magic link to<br />
            <span className="text-white font-medium">{email}</span>
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-zinc-500 text-xs">Click the link in your inbox — it expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo mark */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">InvoiceGen</span>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h1 className="text-lg font-semibold text-white text-center mb-1">Sign in</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">Welcome back</p>

        {/* Method toggle */}
        <div className="flex rounded-lg p-1 mb-6 bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              method === 'password'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMethod('magic_link')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              method === 'magic_link'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          {method === 'password' && (
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : method === 'password' ? (
              'Sign in'
            ) : (
              'Send magic link'
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-zinc-500 text-xs">
            No account yet?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}