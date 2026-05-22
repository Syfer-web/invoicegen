'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        <div style={{
          width: '40px', height: '40px',
          background: 'rgba(16,185,129,0.1)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Check your email
        </h2>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px', lineHeight: '1.5' }}>
          We sent a confirmation link to<br />
          <span style={{ color: '#111', fontWeight: 500 }}>{email}</span>
        </p>
        <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
          Click the link to activate your account. Check your spam folder if it doesn&apos;t arrive.
        </div>
        <button
          onClick={() => setSent(false)}
          style={{ marginTop: '12px', fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '14px',
          border: '1px solid #e5e5e5', borderRadius: '8px', background: '#fff', color: '#111',
          outline: 'none', fontFamily: 'inherit',
        }}
        onFocus={(e) => e.target.style.borderColor = '#10b981'}
        onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        required
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '14px',
          border: '1px solid #e5e5e5', borderRadius: '8px', background: '#fff', color: '#111',
          outline: 'none', fontFamily: 'inherit',
        }}
        onFocus={(e) => e.target.style.borderColor = '#10b981'}
        onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Create password (8+ chars)"
        required
        minLength={8}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '14px',
          border: '1px solid #e5e5e5', borderRadius: '8px', background: '#fff', color: '#111',
          outline: 'none', fontFamily: 'inherit',
        }}
        onFocus={(e) => e.target.style.borderColor = '#10b981'}
        onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '11px', background: '#111', color: '#fff',
          fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Creating account...' : 'Create free account'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', margin: '0' }}>
        By creating an account you agree to our{' '}
        <a href="/terms" style={{ color: '#10b981', textDecoration: 'none' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: '#10b981', textDecoration: 'none' }}>Privacy Policy</a>.
      </p>
    </form>
  )
}