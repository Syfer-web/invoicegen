'use client'
import { useEffect, useRef, useState } from 'react'

// ─── Scroll reveal ─────────────────────────────────────────────
function useReveal(threshold = 0.1) {
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
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Feature cards ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    tag: 'Speed',
    headline: 'Invoice in under 60 seconds',
    desc: 'Auto-fill clients, drag in line items, send in one click. No more copy-paste templates.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    tag: 'VAT Compliance',
    headline: 'BTW-correct, every time',
    desc: 'Real-time VIES validation, reverse charge handling, and country-specific numbering schemes.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    tag: 'Stripe Payments',
    headline: 'Accept payments online',
    desc: 'Generate a Stripe payment link in one click and get paid faster, directly into your bank.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
      </svg>
    ),
    tag: 'Automated Reminders',
    headline: 'Never chase manually',
    desc: 'Set it and forget it — custom reminder sequences at 7, 14, and 30 days with smart timing.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    tag: 'Multi-currency',
    headline: 'Bill in any currency',
    desc: 'EUR, GBP, USD, CHF — invoice in your client\'s currency with live exchange rates baked in.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    tag: 'PDF Export',
    headline: 'Pixel-perfect PDFs',
    desc: 'Export beautiful, print-ready PDFs that look professional in any inbox or on any device.',
  },
]

function FeatureCard({ feature, delay }: { feature: typeof FEATURES[0]; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div style={{
        background: '#18181B',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '28px 26px',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.2)'
        el.style.borderColor = 'rgba(16,185,129,0.2)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
      >
        {/* Icon circle */}
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          {feature.icon}
        </div>

        {/* Tag */}
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#10b981', marginBottom: 8,
        }}>
          {feature.tag}
        </div>

        {/* Headline */}
        <h3 style={{
          fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: '#e0e0e0',
          margin: '0 0 10px',
          lineHeight: 1.2,
        }}>
          {feature.headline}
        </h3>

        {/* Desc */}
        <p style={{
          fontSize: 13, lineHeight: 1.6,
          color: '#666', margin: 0,
        }}>
          {feature.desc}
        </p>
      </div>
    </Reveal>
  )
}

// ─── Features section ─────────────────────────────────────────
export default function Features() {
  return (
    <section style={{ padding: 'clamp(60px, 8vw, 120px) clamp(16px, 5vw, 80px)', background: '#09090B' }}>
      {/* Header */}
      <Reveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="label-caps" style={{ marginBottom: 14 }}>Features</div>
          <h2 className="display-lg" style={{ marginBottom: 16 }}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <p className="body-lg" style={{ maxWidth: 480, margin: '0 auto' }}>
            Built for freelancers and small agencies who bill internationally and can&apos;t afford compliance mistakes.
          </p>
        </div>
      </Reveal>

      {/* Bento grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }} className="features-grid">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={i} feature={feature} delay={i * 80} />
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}