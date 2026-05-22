'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const TIMEZONES = [
  'Europe/Dublin',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Bucharest',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
]

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        padding: '12px 16px',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <span style={{ fontSize: 16 }}>{isSuccess ? '✓' : '✕'}</span>
      {toast.message}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: 2 }}
      >
        ✕
      </button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ height: 32, width: 192, borderRadius: 8, background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s ease-in-out infinite' }} />
      <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: 24, animation: 'pulse 2s ease-in-out infinite' }}>
        <div style={{ height: 80 }} />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [profileName, setProfileName] = useState('')
  const [email, setEmail] = useState('')
  const [timezone, setTimezone] = useState('Europe/Dublin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email || '')
      if (user.user_metadata?.full_name) setProfileName(user.user_metadata.full_name)

      const { data: company } = await supabase
        .from('companies').select('name, timezone').eq('user_id', user.id).single()
      if (company) {
        setCompanyName(company.name || '')
        if (company.timezone) setTimezone(company.timezone)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase
      .from('companies')
      .update({ name: companyName, timezone })
      .eq('user_id', user.id)

    if (profileName !== (user.user_metadata?.full_name || '')) {
      await supabase.auth.updateUser({ data: { full_name: profileName } })
    }

    setSaving(false)
    addToast('success', 'Settings saved successfully')
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This will permanently remove ALL your data including invoices, clients, products, and settings. This action CANNOT be undone.')) return
    addToast('error', 'Account deletion is currently disabled. Contact support to delete your account.')
  }

  if (loading) return <LoadingSkeleton />

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Account Settings</h1>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>Manage your account details and preferences</p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>Business details</h2>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>Business name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                placeholder="Acme Ltd"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Used for calculating due dates and scheduling recurring invoices</p>
            </div>
          </div>

          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>Profile</h2>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>Display name</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                placeholder="Your name"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', fontSize: 14, color: '#52525b', cursor: 'not-allowed', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Email cannot be changed — contact support if you need to update it</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 8, background: '#10b981', padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#000', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
            >
              {saving ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.6s linear infinite' }} />
                  Saving…
                </>
              ) : 'Save changes'}
            </button>
          </div>
        </form>

        <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#f87171', margin: '0 0 4px' }}>Danger zone</h2>
          <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16, lineHeight: 1.5 }}>
            Deleting your account will permanently remove all data including invoices, clients, products, bank details, and settings. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            style={{ borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', padding: '10px 16px', fontSize: 14, fontWeight: 500, color: '#f87171', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            Delete account
          </button>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  )
}