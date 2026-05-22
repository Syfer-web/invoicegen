'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestLogin() {
  const [email, setEmail] = useState('saad@syfer.cc')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink() {
    setLoading(true)
    setResult(null)
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
      })
      console.log('magic link result:', { data, error })
      setResult({ data, error })
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handlePassword() {
    setLoading(true)
    setResult(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: (document.getElementById('pw') as HTMLInputElement)?.value || '',
      })
      console.log('password result:', { data, error })
      setResult({ data, error })

      if (data.session) {
        const res = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })
        const sessionResult = await res.json()
        console.log('set-session result:', sessionResult)
        setResult((r: any) => ({ ...r, sessionResult }))

        // Check cookies after
        setTimeout(() => {
          setResult((r: any) => ({ ...r, cookies: document.cookie }))
        }, 500)
      }
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', fontSize: '13px', background: '#111', color: '#eee', minHeight: '100vh' }}>
      <h1 style={{ color: '#10b981', marginBottom: '24px' }}>Auth Test</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', marginBottom: '24px' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: '#fff' }} />
        <input id="pw" type="password" placeholder="Password"
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: '#fff' }} />
        <button onClick={handlePassword}
          style={{ padding: '10px', borderRadius: '6px', border: 'none', background: '#444', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? '...' : 'Sign In with Password'}
        </button>
        <button onClick={handleMagicLink}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #10b981', background: 'transparent', color: '#10b981', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? '...' : 'Send Magic Link'}
        </button>
      </div>

      {result && (
        <pre style={{ background: '#1a1a1a', padding: '16px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px', border: '1px solid #333' }}>
          {JSON.stringify(result, (k, v) => {
            if (k === 'access_token' || k === 'refresh_token') return (v as string)?.slice(0, 20) + '...'
            return v
          }, 2)}
        </pre>
      )}
    </div>
  )
}