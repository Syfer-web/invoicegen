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

const STEPS = [
  {
    num: '01',
    title: 'Create your account',
    desc: 'Sign up free. No credit card needed. Your first 5 invoices are always free.',
    detail: 'Takes about 90 seconds',
  },
  {
    num: '02',
    title: 'Add your clients',
    desc: 'Import clients or add them manually. Their details are saved for next time.',
    detail: 'Supports EU VAT numbers',
  },
  {
    num: '03',
    title: 'Create & send invoices',
    desc: 'Draft an invoice in under a minute. Send via email or generate a Stripe payment link.',
    detail: 'PDF export included',
  },
]

export default function HowItWorks() {
  return (
    <section style={{ padding: '80px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>How it works</div>
            <h2 className="display-lg" style={{ marginBottom: 12 }}>
              Up and running<br />in minutes.
            </h2>
            <p className="body-lg" style={{ maxWidth: 380, margin: '0 auto' }}>
              No onboarding calls. No setup fees. Just a clean, fast tool that does exactly what you need.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="hiw-grid">
          {STEPS.map((step, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="hiw-card">
                <div className="hiw-num">{step.num}</div>
                <h3 className="hiw-title">{step.title}</h3>
                <p className="hiw-desc">{step.desc}</p>
                <div className="hiw-detail">
                  <span className="hiw-dot" />
                  {step.detail}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        .hiw-card {
          padding: 28px 24px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-1);
        }
        .hiw-num {
          font-size: clamp(3rem, 8vw, 4.5rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          color: rgba(16,185,129,0.08);
          line-height: 1;
          margin-bottom: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .hiw-title {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          color: var(--text);
        }
        .hiw-desc {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-3);
          margin-bottom: 16px;
        }
        .hiw-detail {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-4);
        }
        .hiw-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }

        @media (max-width: 768px) {
          .hiw-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .hiw-card {
            padding: 24px 20px;
          }
        }
      `}</style>
    </section>
  )
}