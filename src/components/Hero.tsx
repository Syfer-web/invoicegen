'use client'
import { useState, useEffect } from 'react'

function FloatingBadge({ children, position }: { children: React.ReactNode; position: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <div
      className="animate-fade-up badge-float"
      data-position={position}
    >
      {children}
    </div>
  )
}

// Invoice preview card — scales with container
function InvoicePreview() {
  return (
    <div className="invoice-card">
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 'clamp(24px, 5vw, 48px)',
        width: '100%',
        maxWidth: 620,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.06)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: '#bbb', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>INVOICE</div>
            <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: '#111' }}>INV-2024-0847</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 800, color: '#10b981' }}>€2,850.00</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Due 14 Jul 2024</div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Bill to</div>
          <div style={{ fontSize: 'clamp(13px, 2.5vw, 16px)', fontWeight: 600, color: '#111' }}>Meridian Design Studio</div>
          <div style={{ fontSize: 12, color: '#888' }}>Amsterdam, Netherlands</div>
        </div>
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          {[
            { item: 'Brand Identity Design', qty: 1, price: '1,200.00' },
            { item: 'UI/UX Consultation', qty: 8, price: '1,200.00' },
            { item: 'Brand Guidelines Document', qty: 1, price: '450.00' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid #f5f5f5',
              fontSize: 'clamp(11px, 2vw, 13px)',
            }}>
              <div>
                <span style={{ color: '#444' }}>{row.item}</span>
                <span style={{ color: '#bbb', marginLeft: 6 }}>×{row.qty}</span>
              </div>
              <span style={{ color: '#333', fontWeight: 500 }}>€{row.price}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 240 }}>
            {[
              { label: 'Subtotal', value: '€2,850.00' },
              { label: 'BTW (21%)', value: '€598.50' },
              { label: 'Total', value: '€3,448.50', bold: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                fontSize: 'clamp(11px, 2vw, 13px)',
                fontWeight: row.bold ? 700 : 400,
                borderTop: row.bold ? '2px solid #111' : 'none',
                marginTop: row.bold ? 4 : 0,
              }}>
                <span style={{ color: row.bold ? '#111' : '#888' }}>{row.label}</span>
                <span style={{ color: row.bold ? '#10b981' : '#333' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: '#10b981',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>Pay with Stripe</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="hero-section">
      {/* Ambient background */}
      <div className="hero-glow" />
      <div className="hero-glow-2" />
      <div className="hero-grid" />

      {/* Content */}
      <div className="hero-content">
        {/* Pill badge */}
        <div className="hero-pill animate-fade-up">
          <span className="hero-pill-icon">
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span>New — AI-powered VAT validation</span>
        </div>

        {/* Headline */}
        <h1 className="hero-headline animate-fade-up" style={{ animationDelay: '80ms' }}>
          invoicing<br />
          <span className="hero-headline-accent">made effortless.</span>
        </h1>

        {/* Subline */}
        <p className="hero-sub animate-fade-up" style={{ animationDelay: '160ms' }}>
          Create professional invoices in under 60 seconds. Automated reminders, Stripe payments, and BTW-compliant for EU and UK.
        </p>

        {/* CTAs */}
        <div className="hero-ctas animate-fade-up" style={{ animationDelay: '220ms' }}>
          <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
            Start for free →
          </a>
          <a href="/dashboard" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
            See how it works
          </a>
        </div>

        <p className="hero-micro animate-fade-up" style={{ animationDelay: '280ms' }}>
          Trusted by 3,400+ freelancers and agencies across Europe
        </p>
      </div>

      {/* Invoice preview + floating badges */}
      <div className="hero-preview animate-fade-up" style={{ animationDelay: '350ms' }}>
        <FloatingBadge position="tl">
          <div className="badge-card badge-tl">
            <span className="badge-icon badge-icon-green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div>
              <div className="badge-label">Payment received</div>
              <div className="badge-value badge-value-green">€1,240.00</div>
            </div>
          </div>
        </FloatingBadge>

        <FloatingBadge position="br">
          <div className="badge-card badge-br">
            <span className="badge-icon badge-icon-purple">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div>
              <div className="badge-label">Sent</div>
              <div className="badge-value">Today, 09:14</div>
            </div>
          </div>
        </FloatingBadge>

        <InvoicePreview />
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll">
        <span>scroll</span>
        <div className="hero-scroll-line" />
      </div>

      <style>{`
        /* ── Hero section layout ── */
        .hero-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 16px 80px;
          position: relative;
          overflow: hidden;
          gap: 0;
        }

        /* ── Glows ── */
        .hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 50% at 50% -5%, rgba(16,185,129,0.14) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-glow-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 50% 30% at 85% 85%, rgba(16,185,129,0.05) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* ── Content ── */
        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
          padding: 0 8px;
        }

        /* ── Pill ── */
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 8px;
          border-radius: 100px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          margin-bottom: 28px;
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
        }
        .hero-pill-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Headline ── */
        .hero-headline {
          font-size: clamp(2.8rem, 10vw, 5.5rem);
          font-weight: 800;
          line-height: 0.92;
          letter-spacing: -0.045em;
          color: #f5f5f5;
          margin: 0 0 24px;
        }
        .hero-headline-accent {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Sub ── */
        .hero-sub {
          font-size: clamp(0.95rem, 2.5vw, 1.125rem);
          line-height: 1.6;
          color: #a0a0a0;
          margin: 0 auto 36px;
          max-width: 420px;
        }

        /* ── CTAs ── */
        .hero-ctas {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        /* ── Micro ── */
        .hero-micro {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        /* ── Preview ── */
        .hero-preview {
          position: relative;
          z-index: 1;
          margin-top: 56px;
          width: 100%;
          max-width: 660px;
          display: flex;
          justify-content: center;
        }

        /* ── Floating badges ── */
        .badge-float { position: absolute; }
        .badge-card {
          background: rgba(10,10,10,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .badge-tl { top: -16px; left: -24px; }
        .badge-br { bottom: -16px; right: -24px; }
        .badge-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-icon-green { background: rgba(16,185,129,0.12); }
        .badge-icon-purple { background: rgba(139,92,246,0.12); }
        .badge-label { font-size: 10px; color: #666; }
        .badge-value { font-size: 13px; font-weight: 700; color: #f5f5f5; }
        .badge-value-green { color: #10b981; }

        /* ── Scroll indicator ── */
        .hero-scroll {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #444;
        }
        .hero-scroll span {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .hero-scroll-line {
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, #444, transparent);
        }

        /* ── Invoice card ── */
        .invoice-card {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        /* ── Mobile responsive ── */
        @media (max-width: 640px) {
          .hero-section {
            padding: 80px 16px 60px;
            justify-content: flex-start;
            gap: 0;
          }
          .hero-content {
            text-align: left;
            max-width: 100%;
            padding: 0;
          }
          .hero-headline {
            font-size: clamp(2.4rem, 12vw, 3.5rem);
          }
          .hero-ctas {
            justify-content: flex-start;
          }
          .hero-micro {
            text-align: left;
          }
          .hero-preview {
            margin-top: 40px;
            max-width: 100%;
          }
          .badge-tl { top: -12px; left: -8px; }
          .badge-br { bottom: -12px; right: -8px; }
          .hero-scroll { display: none; }
        }

        @media (max-width: 480px) {
          .badge-tl, .badge-br { display: none; }
        }
      `}</style>
    </section>
  )
}