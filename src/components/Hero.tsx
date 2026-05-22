'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Scroll reveal hook ──────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Invoice preview card ─────────────────────────────────────
function InvoicePreview() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 400) }, [])
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: 'clamp(24px, 4vw, 44px)',
      width: '100%',
      maxWidth: 580,
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: "'Inter', system-ui, sans-serif",
      transform: mounted ? 'translateY(0)' : 'translateY(24px)',
      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: '#ccc', fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Invoice</div>
          <div style={{ fontSize: 'clamp(14px, 2.5vw, 19px)', fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>INV-2024-0847</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'clamp(18px, 4vw, 27px)', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>€2,850.00</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 5 }}>Due 14 Jul 2024</div>
        </div>
      </div>

      {/* Bill to */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 9, color: '#ccc', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5 }}>Bill to</div>
        <div style={{ fontSize: 'clamp(13px, 2vw, 16px)', fontWeight: 600, color: '#111' }}>Meridian Design Studio</div>
        <div style={{ fontSize: 12, color: '#999' }}>Amsterdam, Netherlands</div>
      </div>

      {/* Line items */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 18, marginBottom: 18 }}>
        {[
          { item: 'Brand Identity Design', qty: 1, price: '1,200.00' },
          { item: 'UI/UX Consultation', qty: 8, price: '1,200.00' },
          { item: 'Brand Guidelines Document', qty: 1, price: '450.00' },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '11px 0',
            borderBottom: '1px solid #f7f7f7',
            fontSize: 'clamp(11px, 1.8vw, 13px)',
          }}>
            <div>
              <span style={{ color: '#444' }}>{row.item}</span>
              <span style={{ color: '#ccc', marginLeft: 7 }}>×{row.qty}</span>
            </div>
            <span style={{ color: '#333', fontWeight: 500 }}>€{row.price}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '100%', maxWidth: 220 }}>
          {[
            { label: 'Subtotal', value: '€2,850.00', bold: false },
            { label: 'BTW (21%)', value: '€598.50', bold: false },
            { label: 'Total', value: '€3,448.50', bold: true },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '7px 0',
              fontSize: 'clamp(11px, 1.8vw, 13px)',
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

      {/* CTA */}
      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: '#10b981',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          padding: '11px 22px',
          borderRadius: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
        }}>
          <span>Pay with Stripe</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  )
}

// ─── Floating badge ───────────────────────────────────────────
function FloatingBadge({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute',
      background: 'rgba(9,9,11,0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      padding: '10px 16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Hero section ────────────────────────────────────────────
export default function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      alignItems: 'center',
      padding: '80px clamp(20px, 4vw, 80px)',
      gap: 40,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.13) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', right: '-20%', top: '10%', width: '600px', height: '600px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* ── LEFT: Copy ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Reveal delay={0}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 6px',
            borderRadius: 100,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.22)',
            marginBottom: 32,
            fontSize: 12, fontWeight: 600, color: '#10b981',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            New — AI-powered VAT validation
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 0.93,
            letterSpacing: '-0.045em',
            color: '#f5f5f5',
            margin: '0 0 28px',
          }}>
            invoicing<br />
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>made effortless.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p style={{
            fontSize: 'clamp(0.95rem, 1.8vw, 1.06rem)',
            lineHeight: 1.7,
            color: '#a0a0a0',
            margin: '0 0 40px',
            maxWidth: 440,
          }}>
            Create professional invoices in under 60 seconds. Automated reminders, Stripe payments, and BTW-compliant for EU and UK.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, fontWeight: 600 }}>
              Start for free →
            </a>
            <a href="/dashboard" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15, fontWeight: 500 }}>
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
            Trusted by 3,400+ freelancers and agencies across Europe
          </p>
        </Reveal>
      </div>

      {/* ── RIGHT: Preview + floating badges ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
        {/* Top-left badge */}
        <FloatingBadge style={{ top: '-4%', left: '-2%', animation: 'badge-float-a 4s ease-in-out infinite alternate' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666' }}>Payment received</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>€1,240.00</div>
            </div>
          </div>
        </FloatingBadge>

        {/* Bottom-right badge */}
        <FloatingBadge style={{ bottom: '-2%', right: '-2%', animation: 'badge-float-b 4s ease-in-out infinite alternate' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666' }}>Invoice sent</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e0' }}>Today, 09:14</div>
            </div>
          </div>
        </FloatingBadge>

        <InvoicePreview />
      </div>

      <style>{`
        @keyframes badge-float-a {
          from { transform: translateY(0px); }
          to   { transform: translateY(-8px); }
        }
        @keyframes badge-float-b {
          from { transform: translateY(0px); }
          to   { transform: translateY(8px); }
        }
        @media (max-width: 900px) {
          section {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            padding: 80px 20px 60px !important;
            gap: 48px !important;
          }
        }
        @media (max-width: 480px) {
          section > div:last-child > div:first-child,
          section > div:last-child > div:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}