'use client'
import { useEffect, useRef, useState } from 'react'

function useReveal(threshold = 0.15) {
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

const FEATURES = [
  {
    tag: 'Speed',
    headline: 'Invoice in under 60 seconds',
    body: 'No templates to fumble with. Start a new invoice, add your client, drop in line items — done. Export to PDF or send directly via email.',
    points: ['Auto-fill from your saved client list', 'Recurring invoice presets', 'One-click duplicate & resend'],
    visual: <SpeedVisual />,
  },
  {
    tag: 'Compliance',
    headline: 'BTW-correct, every time',
    body: 'Automated VAT calculations for Netherlands, UK, and all EU countries. Validates against VIES before you send. Never get flagged for an incorrect BTW number again.',
    points: ['VIES API validation in real-time', 'Reverse charge handling for B2B cross-border', 'Country-specific invoice numbering schemes'],
    visual: <ComplianceVisual />,
  },
  {
    tag: 'Automation',
    headline: 'Chase payments without lifting a finger',
    body: 'Set automated email reminders at 7, 14, and 30 days. Get notified the moment an invoice is viewed or paid. Integrate Stripe to accept online payments in seconds.',
    points: ['Customisable reminder sequences', 'Stripe payment link generation', 'Real-time status tracking'],
    visual: <AutomationVisual />,
  },
]

function SpeedVisual() {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Steps */}
      {[
        { step: '01', label: 'Select client', done: true },
        { step: '02', label: 'Add line items', done: true },
        { step: '03', label: 'Review & send', done: false },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: i < 2 ? 20 : 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.done ? 'var(--accent)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {s.done
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>{s.step}</span>
            }
          </div>
          <div style={{ flex: 1, height: 2, background: i < 2 ? 'var(--accent)' : 'var(--border)', borderRadius: 1 }} />
        </div>
      ))}
      <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--accent-dim)', borderRadius: 10, border: '1px solid var(--accent-border)' }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Ready to send</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>Invoice created in <strong style={{ color: 'var(--text)' }}>47 seconds</strong></div>
      </div>
    </div>
  )
}

function ComplianceVisual() {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>VIES Validation</div>
      {[
        { name: 'Meridian Design Studio', country: 'NL', vat: 'NL001234567B01', status: 'valid' },
        { name: 'Acme Corp', country: 'DE', vat: 'DE123456789', status: 'valid' },
        { name: 'TechStart Ltd', country: 'FR', vat: 'FRAB123456789', status: 'pending' },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>
            {row.country}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{row.vat}</div>
          </div>
          <div style={{
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: row.status === 'valid' ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
            color: row.status === 'valid' ? 'var(--accent)' : '#fbbf24',
          }}>
            {row.status === 'valid' ? '✓ Valid' : 'Pending'}
          </div>
        </div>
      ))}
    </div>
  )
}

function AutomationVisual() {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Automated Reminders</div>
      {[
        { day: 'Day 1', label: 'Invoice sent', icon: '→', color: 'var(--text-4)' },
        { day: 'Day 7', label: 'Reminder: Payment due', icon: '🔔', color: 'var(--text-3)' },
        { day: 'Day 14', label: 'Second reminder', icon: '⏰', color: 'var(--text-3)' },
        { day: 'Day 30', label: 'Final notice', icon: '⚠', color: '#fbbf24' },
      ].map((r, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 16px',
          marginBottom: 8,
          borderRadius: 10,
          background: 'var(--bg-3)',
          border: r.color === '#fbbf24' ? '1px solid rgba(251,191,36,0.25)' : '1px solid var(--border)',
        }}>
          <div style={{ width: 40, fontSize: 11, fontWeight: 600, color: 'var(--text-5)' }}>{r.day}</div>
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>{r.label}</div>
          <div style={{ fontSize: 14 }}>{r.icon}</div>
        </div>
      ))}
    </div>
  )
}

export default function Features() {
  return (
    <section style={{ padding: '120px 32px' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Section header */}
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Features</div>
            <h2 className="display-lg" style={{ marginBottom: 16 }}>
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
            <p className="body-lg" style={{ maxWidth: 500, margin: '0 auto' }}>
              Built for freelancers and small agencies who bill internationally and can&apos;t afford compliance mistakes.
            </p>
          </div>
        </Reveal>

        {/* Feature rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 100 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                alignItems: 'center',
                direction: i % 2 === 1 ? 'rtl' : 'ltr',
              }} className="features-grid">
                <div style={{ direction: 'ltr' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    marginBottom: 20,
                  }}>
                    {f.tag}
                  </div>
                  <h3 className="display-md" style={{ marginBottom: 16 }}>{f.headline}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-3)', marginBottom: 24 }}>{f.body}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {f.points.map((p, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, color: 'var(--text-2)' }}>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ direction: 'ltr' }}>
                  {f.visual}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}