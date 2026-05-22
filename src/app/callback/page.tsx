'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Callback page creates its own client — localStorage for PKCE verifier
// + cookies for session access, all in one browser client instance
function getCallbackClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export default function Callback() {
  const [status, setStatus] = useState('Signing you in…')
  const [error, setError] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/dashboard'
    const errorParam = url.searchParams.get('error')

    if (errorParam) {
      window.location.href = `/login?error=${encodeURIComponent(errorParam)}`
      return
    }

    if (!code) {
      window.location.href = '/login?error=no_code'
      return
    }

    const supabase = getCallbackClient()

    supabase.auth.exchangeCodeForSession(code).then(({ error, data }) => {
      if (error) {
        setStatus('')
        setError(error.message)
        setTimeout(() => {
          window.location.href = `/login?error=${encodeURIComponent(error.message)}`
        }, 2000)
      } else if (data.user) {
        // Give cookies time to write, then redirect
        setTimeout(() => { window.location.href = next }, 300)
      } else {
        window.location.href = '/login?error=session_failed'
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#08090a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '300px' }}>
        {error ? (
          <div>
            <p style={{ color: '#f87171', marginBottom: '8px', fontSize: '13px' }}>Error: {error}</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Redirecting to login…</p>
          </div>
        ) : (
          <>
            <div style={{
              width: '32px', height: '32px', border: '3px solid #222',
              borderTopColor: '#10b981', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#888' }}>{status}</p>
          </>
        )}
      </div>
    </div>
  )
}