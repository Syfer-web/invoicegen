import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — InvoiceGen',
}

// Force all (app) routes to be server-rendered on each request.
// This prevents Next.js from attempting static prerendering at build time,
// which fails because Supabase env vars aren't available during the build worker.
// Pages in (app) depend on Supabase auth + data, so they must be dynamic.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary, #09090B)',
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
            fontSize: '15px', fontWeight: 700,
            letterSpacing: '-0.02em', color: '#fff', textDecoration: 'none',
          }}>
            Invoice<span style={{ color: '#10b981' }}>Gen</span>
          </a>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '12px 10px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {[
            { href: '/dashboard', label: 'Dashboard', active: true },
            { href: '/invoices', label: 'All Invoices', active: false },
            { href: '/invoices/new', label: 'New Invoice', active: false },
            { href: '/clients', label: 'Clients', active: false },
            { href: '/products', label: 'Products', active: false },
            { href: '/recurring', label: 'Recurring', active: false },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px', fontWeight: item.active ? 600 : 400,
                color: item.active ? '#fff' : '#71717a',
                background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </a>
          ))}

          {/* Settings section */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{
              padding: '0 12px 8px',
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#3f3f46', margin: 0,
            }}>Settings</p>
            {[
              { href: '/settings/bank', label: 'Bank Details' },
              { href: '/settings/reminders', label: 'Reminders' },
              { href: '/settings', label: 'Account' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px', fontWeight: 400,
                  color: '#71717a',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </a>
            ))}
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
            <p style={{
              fontSize: '13px', fontWeight: 600,
              color: '#10b981', margin: '0 0 4px',
            }}>Upgrade to Pro</p>
            <p style={{
              fontSize: '11px', color: '#52525b',
              margin: '0 0 12px', lineHeight: 1.5,
            }}>Unlimited invoices, automated reminders.</p>
            <a
              href="/pricing"
              style={{
                display: 'block', width: '100%',
                padding: '8px',
                borderRadius: '8px',
                background: '#10b981', color: '#000',
                fontSize: '12px', fontWeight: 700,
                textAlign: 'center', textDecoration: 'none',
              }}
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
          {/* Left — empty, page title shown in content */}
          <div />

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* New Invoice CTA */}
            <a
              href="/invoices/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: '#10b981', color: '#000',
                borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Invoice
            </a>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: '#10b981',
              }}>S</span>
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