'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  useEffect(() => {
    // PKCE portable: tokens are in the URL fragment (#access_token=...)
    // Parse them and set the session
    const hash = window.location.hash.substring(1) // remove leading #
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          window.location.href = '/login?error=' + encodeURIComponent(error.message)
        } else {
          window.location.href = '/dashboard'
        }
      })
    } else {
      // Fallback: redirect to login
      window.location.href = '/login?error=no_token'
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid #222',
          borderTopColor: '#10b981', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Signing you in…
      </div>
    </div>
  )
}