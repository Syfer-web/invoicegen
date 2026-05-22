import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'InvoiceGen — Beautiful invoices, zero friction',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08090a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Emerald glow - top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '400px',
        background: 'radial-gradient(ellipse at center top, rgba(16,185,129,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Logo */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <div style={{
          width: '32px', height: '32px',
          background: '#10b981',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(16,185,129,0.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>InvoiceGen</span>
      </div>

      {/* The card - white on dark, proper elevation */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: '#ffffff',
        borderRadius: '14px',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.24)',
      }}>
        {children}
      </div>

      {/* Footer */}
      <p style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', position: 'relative' }}>
        No account?{' '}
        <a href="/signup" style={{ color: '#10b981', fontWeight: 500, textDecoration: 'none' }}>
          Create one free
        </a>
      </p>
    </div>
  )
}