'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setErrorMsg(decodeURIComponent(errorParam))
        return
      }

      if (!code) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          router.replace('/login')
        }
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        setStatus('error')
        setErrorMsg(error?.message || 'Session could not be created.')
      } else {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    }

    handleCallback()
  }, [router, searchParams])

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
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        {status === 'loading' && (
          <>
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
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{
              width: '48px', height: '48px',
              background: 'rgba(16,185,129,0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Signed in!</p>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Redirecting to your dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{
              width: '48px', height: '48px',
              background: 'rgba(239,68,68,0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>Sign-in failed</p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>{errorMsg}</p>
            <button
              onClick={() => router.replace('/login')}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Callback() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08090a',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid #222',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}