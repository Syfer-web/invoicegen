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

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12l5 5L20 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const CROSS = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M6 6l12 12M18 6L6 18" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const FEATURES = [
  'Invoice in under 60 seconds',
  'VAT auto-calculation',
  'VIES real-time validation',
  'Stripe payment links',
  'Automated reminders',
  'PDF export included',
  'Multi-currency support',
  'Multi-company support',
  'API access',
  'White-label',
]

const ROWS = FEATURES.map((f, i) => ({
  feature: f,
  invoicegen: true,
  stripe: f.includes('VIES') || f.includes('automated reminders') || f.includes('60 second') ? false : true,
  quickbooks: i === 0 || f.includes('Stripe') ? false : true,
}))

export default function ComparisonTable() {
  return (
    <section style={{ padding: '120px 32px', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Compare</div>
            <h2 className="display-lg" style={{ marginBottom: 16 }}>
              Built for invoicing.<br />Not会计.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }} className="compare-grid">
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '1px solid var(--border)' }}>
              {['Feature', 'InvoiceGen', 'Stripe Invoicing', 'QuickBooks'].map((h, i) => (
                <div
                  key={h}
                  style={{
                    padding: '20px 24px',
                    background: i === 0 ? 'var(--bg-1)' : i === 1 ? 'rgba(16,185,129,0.04)' : 'var(--bg-1)',
                    fontSize: i === 0 ? 13 : 12,
                    fontWeight: i === 0 ? 600 : 700,
                    color: i === 1 ? 'var(--accent)' : 'var(--text-4)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  {i === 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                      {h}
                    </div>
                  ) : h}
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {ROWS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  borderBottom: i < ROWS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-1)',
                }}
              >
                <div style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>
                  {row.feature}
                </div>
                {[row.invoicegen, row.stripe, row.quickbooks].map((val, j) => (
                  <div
                    key={j}
                    style={{
                      padding: '16px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid var(--border)',
                      background: j === 1 ? 'rgba(16,185,129,0.02)' : 'transparent',
                    }}
                  >
                    {val ? (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {CHECK}
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {CROSS}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}