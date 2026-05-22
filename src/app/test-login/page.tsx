'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestLogin() {
  const [email, setEmail] = useState('saad@syfer.cc')
  const [password, setPassword] = useState('Test1234!')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    setResult(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('signIn result:', { data, error })
      setResult({ data, error })

      if (data.session) {
        // Try to set session via our API
        const res = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })
        const sessionResult = await res.json()
        console.log('set-session result:', sessionResult)
        setResult((r: any) => ({ ...r, sessionResult }))

        // Check cookies
        const cookies = document.cookie
        console.log('cookies after set-session:', cookies)
        setResult((r: any) => ({ ...r, cookies }))
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
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: '#fff' }} />
        <button onClick={handleSignIn} disabled={loading}
          style={{ padding: '10px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      {result && (
        <pre style={{ background: '#1a1a1a', padding: '16px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px', border: '1px solid #333' }}>
          {JSON.stringify(result, (k, v) => {
            if (k === 'access_token' || k === 'refresh_token') return v?.slice(0, 20) + '...'
            return v
          }, 2)}
        </pre>
      )}
    </div>
  )
}
