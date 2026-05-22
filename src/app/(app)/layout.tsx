'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  section?: string
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    href: '/invoices',
    label: 'All Invoices',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: '/invoices/new',
    label: 'New Invoice',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: '/products',
    label: 'Products',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: '/recurring',
    label: 'Recurring',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
]

const settingsItems: NavItem[] = [
  {
    href: '/settings/bank',
    label: 'Bank Details',
    section: 'settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" /></svg>,
  },
  {
    href: '/settings/reminders',
    label: 'Reminders',
    section: 'settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: '/settings',
    label: 'Account',
    section: 'settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" /></svg>,
  },
]

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [hover, setHover] = useState(false)

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : hover ? 500 : 400,
        color: isActive ? '#fff' : hover ? '#d4d4d8' : '#71717a',
        textDecoration: 'none',
        background: isActive ? 'rgba(255,255,255,0.06)' : hover ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'all 0.15s',
        position: 'relative',
        outline: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Active left border indicator */}
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '4px', bottom: '4px',
          width: '3px', borderRadius: '0 2px 2px 0',
          background: '#10b981',
        }} />
      )}
      <span style={{
        color: isActive ? '#10b981' : hover ? '#a1a1aa' : '#52525b',
        transition: 'color 0.15s',
        display: 'flex', alignItems: 'center',
      }}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      if (prof) setProfile(prof)
    }
    loadProfile()
  }, [])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#09090B',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0,
        width: '224px',
        background: '#09090B',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        zIndex: 30,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 19px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <a href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '15px', fontWeight: 700,
            letterSpacing: '-0.02em', color: '#fff', textDecoration: 'none',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            Invoice<span style={{ color: '#10b981' }}>Gen</span>
          </a>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '12px 10px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {navItems.map(item => (
              <NavItem key={item.href} item={item} isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} />
            ))}
          </div>

          {/* Settings section */}
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{
              padding: '0 12px 8px',
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#3f3f46', margin: 0,
            }}>Settings</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {settingsItems.map(item => (
                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
              ))}
            </div>
          </div>
        </nav>

        {/* Upgrade card */}
        <div style={{ padding: '16px' }}>
          <div style={{
            borderRadius: '12px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            padding: '16px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', margin: '0 0 4px' }}>
              Upgrade to Pro
            </p>
            <p style={{ fontSize: '11px', color: '#52525b', margin: '0 0 12px', lineHeight: 1.5 }}>
              Unlimited invoices, automated reminders.
            </p>
            <a href="/pricing" style={{
              display: 'block', width: '100%',
              padding: '8px',
              borderRadius: '8px',
              background: '#10b981', color: '#000',
              fontSize: '12px', fontWeight: 700,
              textAlign: 'center', textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.85')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
            >
              Upgrade
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: '224px', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#09090B',
          position: 'sticky', top: 0, zIndex: 20,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(9,9,11,0.85)',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 12px',
            height: '36px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            minWidth: '200px',
            cursor: 'text',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '13px', color: '#52525b', flex: 1 }}>Search…</span>
            <span style={{
              fontSize: '10px', color: '#3f3f46',
              background: 'rgba(255,255,255,0.06)',
              padding: '2px 6px', borderRadius: '4px',
              fontFamily: 'monospace',
            }}>⌘K</span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notifications */}
            <button style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {notifications > 0 && (
                <span style={{
                  position: 'absolute', top: '6px', right: '6px',
                  width: '8px', height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '1.5px solid #09090B',
                }} />
              )}
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Force all (app) routes to be server-rendered on each request.
// Note: dynamic export moved to individual pages since this layout is 'use client'.