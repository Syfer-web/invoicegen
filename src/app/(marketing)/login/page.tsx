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
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-zinc-400 mb-6">We sent a magic link to <strong className="text-white">{email}</strong>. Click it to sign in.</p>
        <button onClick={() => setSent(false)} className="text-sm text-emerald-400 hover:text-emerald-300">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-zinc-400 text-sm">Sign in to your InvoiceGen account</p>
      </div>

      {/* Method toggle */}
      <div className="flex bg-white/5 rounded-lg p-1 mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => setMethod('password')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            method === 'password'
              ? 'bg-emerald-500 text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMethod('magic_link')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            method === 'magic_link'
              ? 'bg-emerald-500 text-black'
              : 'text-zinc-400 hover:text-white'
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
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {method === 'password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-500 py-3 text-base font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : method === 'password' ? 'Sign in' : 'Send magic link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Create one free
        </Link>
      </div>
    </div>
  )
}