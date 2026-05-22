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

export default function CTA() {
  return (
    <section style={{ padding: '120px 32px 140px', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 300,
              background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
              marginTop: -60,
            }} />

            <h2 className="display-lg" style={{ marginBottom: 20 }}>
              Start invoicing today.<br />
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                It&apos;s free.
              </span>
            </h2>
            <p className="body-lg" style={{ maxWidth: 440, margin: '0 auto 44px' }}>
              No credit card. No onboarding call. Just a clean tool that gets out of your way.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: 15 }}>
                Create free account →
              </a>
              <a href="/dashboard" className="btn-ghost" style={{ padding: '16px 32px', fontSize: 15 }}>
                View live demo
              </a>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-5)' }}>
              5 free invoices per month. No card required.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}