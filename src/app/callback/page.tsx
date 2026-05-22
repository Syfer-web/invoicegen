/**
 * Auth callback — handles tokens from Google OAuth (hash fragment) and magic links (query param).
 * Client-side page reads hash tokens and calls supabase.auth.setSession().
 */
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Google sends tokens in hash fragment (#access_token=...) — read them client-side
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    // Magic link sends ?code= — also handle via query param
    const code = new URLSearchParams(window.location.search).get('code')

    if (accessToken && refreshToken) {
      // Google OAuth — tokens in hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          router.push('/login?error=' + encodeURIComponent(error.message))
        } else {
          router.push('/dashboard')
        }
      })
    } else if (code) {
      // Magic link — code in query string
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.push('/login?error=' + encodeURIComponent(error.message))
        } else {
          router.push('/dashboard')
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