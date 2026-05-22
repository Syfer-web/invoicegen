'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Callback() {
  const [error, setError] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)

    // Check for Google OAuth fragment tokens (pkcePortable: true)
    // These come as #access_token=...&provider_token=...&refresh_token=...
    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const googleAccessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    // Standard PKCE: authorization code in query params
    const code = url.searchParams.get('code')
    const errorParam = url.searchParams.get('error')

    if (errorParam) {
      window.location.href = '/login?error=' + encodeURIComponent(errorParam)
      return
    }

    if (googleAccessToken && refreshToken) {
      // PKCE portable flow: tokens in URL fragment
      // Google tokens are in the fragment; exchange code for Supabase session
      if (code) {
        // We have both fragment tokens AND code — use code to get Supabase session
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            setError(error.message)
            setTimeout(() => { window.location.href = '/login?error=' + encodeURIComponent(error.message) }, 1500)
          } else {
            window.location.href = '/dashboard'
          }
        })
      } else {
        // No code but have fragment — this is a Google token, not Supabase
        // Store Google token temporarily and redirect to get a Supabase session
        sessionStorage.setItem('google_access_token', googleAccessToken)
        // Redirect to login to re-initiate with Supabase code
        window.location.href = '/login?error=session_required'
      }
    } else if (code) {
      // Standard flow: code only
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message)
          setTimeout(() => { window.location.href = '/login?error=' + encodeURIComponent(error.message) }, 1500)
        } else {
          window.location.href = '/dashboard'
        }
      })
    } else {
      window.location.href = '/login?error=no_code'
    }
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
        <div style={{
          width: '32px', height: '32px', border: '3px solid #222',
          borderTopColor: '#10b981', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {error ? (
          <div>
            <p style={{ color: '#f87171', marginBottom: '8px' }}>Error: {error}</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Redirecting to login...</p>
          </div>
        ) : (
          <p style={{ color: '#888' }}>Signing you in…</p>
        )}
      </div>
    </div>
  )
}