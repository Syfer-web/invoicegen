'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const [error, setError] = useState('')

  useEffect(() => {
    // Parse tokens from hash fragment (#access_token=...&refresh_token=...)
    const hash = window.location.hash.substring(1) // remove leading #
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const expiresIn = parseInt(params.get('expires_in') || '3600')
    const providerToken = params.get('provider_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setError(error.message)
        } else {
          window.location.href = '/dashboard'
        }
      })
    } else {
      // Try code exchange (magic link flow)
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            setError(error.message)
          } else {
            window.location.href = '/dashboard'
          }
        })
      } else {
        setError('no_token')
      }
    }
  }, [])

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ fontSize: '14px', color: '#dc2626' }}>
          Auth failed: {error}
        </p>
        <a href="/login" style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
          ← Back to login
        </a>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{
        width: '32px', height: '32px', border: '2px solid #e5e5e5',
        borderTop: '2px solid #10b981', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: '13px', color: '#888' }}>Signing you in…</p>
    </div>
  )
}