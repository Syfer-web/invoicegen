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

const TESTIMONIALS = [
  {
    quote: "I used to dread invoicing. Now it takes me under two minutes every time. The VIES validation alone has saved me from two potential compliance issues.",
    name: "Sophie van der Berg",
    role: "Brand Designer, Amsterdam",
    initials: "SvB",
    color: "#10b981",
  },
  {
    quote: "Switched from QuickBooks last year. InvoiceGen does exactly what I need — no bloat, no confusion. My accountant loves the clean exports too.",
    name: "James Okafor",
    role: "Frontend Developer, London",
    initials: "JO",
    color: "#6366f1",
  },
  {
    quote: "The automated reminders are a game-changer. I used to chase payments manually — now Stripe handles it and I get notified the second an invoice is viewed.",
    name: "Laura Cieslak",
    role: "Copywriter & Consultant, Berlin",
    initials: "LC",
    color: "#f59e0b",
  },
]

export default function Testimonials() {
  return (
    <section style={{ padding: '120px 32px', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Testimonials</div>
            <h2 className="display-lg" style={{ marginBottom: 16 }}>
              Loved by the people<br />who use it daily.
            </h2>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="three-col-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={{
                padding: '36px 32px',
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative top line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: t.color,
                  opacity: 0.6,
                }} />

                {/* Quote */}
                <p style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: 'var(--text-2)',
                  marginBottom: 28,
                  fontStyle: 'italic',
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `rgba(${hexToRgb(t.color)}, 0.15)`,
                    border: `1px solid rgba(${hexToRgb(t.color)}, 0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.color,
                    flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-4)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}