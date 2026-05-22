/**
 * Auth callback — handles Google OAuth hash tokens and magic link codes.
 * Reads tokens client-side (where hash is accessible), then POSTs to
 * server route which sets httpOnly cookies so the middleware can read them.
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const code = new URLSearchParams(window.location.search).get('code')

    if (accessToken && refreshToken) {
      // Google OAuth — POST tokens to server route which sets cookies
      fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      }).then(res => {
        if (res.redirected) {
          router.push(new URL(res.url).pathname)
        } else {
          router.push('/login?error=session_set_failed')
        }
      })
    } else if (code) {
      // Magic link — exchange code client-side, then POST session to set cookies
      // Use fetch to call our own set-session endpoint with the tokens
      fetch(`/api/auth/callback?code=${code}`)
        .then(res => {
          if (res.redirected) {
            router.push(new URL(res.url).pathname)
          } else {
            router.push('/login?error=code_exchange_failed')
          }
        })
    } else {
      router.push('/login?error=no_token')
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08090a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(255,255,255,0.2)',
          borderTop: '2px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Signing you in…</p>
      </div>
    </div>
  )
}