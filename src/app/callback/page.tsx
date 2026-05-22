'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Callback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase client (with detectSessionInUrl:true) auto-processes the
    // ?code=XXX from magic link/OAuth and exchanges it for a session.
    // authenticateFromURL handles PKCE exchange + cookie writing + redirect.
    supabase.auth.authenticateFromURL(window.location.href).then(({ error }) => {
      if (error) {
        // Give user time to see the error, then redirect
        setTimeout(() => router.push('/login?error=' + encodeURIComponent(error.message)), 3000)
      } else {
        // Success — redirect to dashboard
        router.push('/dashboard')
      }
    })
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#08090a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid #222',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#888', fontSize: '14px' }}>Signing you in…</p>
      </div>
    </div>
  )
}