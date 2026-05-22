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
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12l5 5L20 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FREE_FEATURES = ['5 invoices/month', '1 company', 'PDF export', 'Email support']
const PRO_FEATURES = ['50 invoices/month', '3 companies', 'Stripe payments', 'Automated reminders', 'VIES validation', 'Priority support']
const SCALE_FEATURES = ['Unlimited invoices', 'Unlimited companies', 'Custom branding', 'API access', 'White-label invoices', 'Dedicated account manager']

function PlanCard({ name, price, period, desc, features, cta, ctaHref, highlight = false, delay = 0 }: any) {
  return (
    <Reveal delay={delay}>
      <div className={`pricing-card${highlight ? ' pricing-card-pro' : ''}`}>
        <div className="pricing-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {highlight && (
              <div className="pricing-badge">Most popular</div>
            )}
            <div className="pricing-plan-name">{name}</div>
          </div>
        </div>
        <div className="pricing-price">
          <span className="pricing-price-value">{price}</span>
          <span className="pricing-price-period">/{period}</span>
        </div>
        <p className="pricing-desc">{desc}</p>
        <a href={ctaHref} className={highlight ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
          {cta}
        </a>
        <ul className="pricing-features">
          {features.map((f: string, i: number) => (
            <li key={i} className="pricing-feature-item">
              {CHECK} {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

export default function Pricing({ region, prices, symbol }: { region: string; prices: any; symbol: string }) {
  const [annual, setAnnual] = useState(false)

  return (
    <section style={{ padding: '80px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>Pricing</div>
            <h2 className="display-lg" style={{ marginBottom: 12 }}>
              Simple pricing.<br />No surprises.
            </h2>
            <p className="body-lg" style={{ maxWidth: 380, margin: '0 auto 32px' }}>
              Start free, upgrade when you need more. All plans include VAT compliance.
            </p>

            {/* Toggle */}
            <div className="pricing-toggle">
              {[{ label: 'Monthly', value: false }, { label: 'Annual', value: true }].map(t => (
                <button
                  key={String(t.value)}
                  onClick={() => setAnnual(t.value)}
                  className={`pricing-toggle-btn${annual === t.value ? ' active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="pricing-grid">
          <PlanCard
            name="Free"
            price="€0"
            period="month"
            desc="Perfect for trying things out."
            features={FREE_FEATURES}
            cta="Get started free"
            ctaHref="/signup"
            delay={0}
          />
          <PlanCard
            name="Pro"
            price={`${symbol}${annual ? prices.pro_annual : prices.pro}`}
            period="month"
            desc="For freelancers and small agencies."
            features={PRO_FEATURES}
            cta="Start Pro →"
            ctaHref="/signup?plan=pro"
            highlight={true}
            delay={80}
          />
          <PlanCard
            name="Scale"
            price={`${symbol}${annual ? prices.scale_annual : prices.scale}`}
            period="month"
            desc="For growing agencies with multiple clients."
            features={SCALE_FEATURES}
            cta="Contact sales"
            ctaHref="mailto:hello@invoicegen.app"
            delay={160}
          />
        </div>

        <Reveal>
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--text-5)' }}>
            All prices exclude local VAT. Monthly plans billed month-to-month. Annual plans billed annually.
          </p>
        </Reveal>
      </div>

      <style>{`
        .pricing-card {
          padding: 28px 24px;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          background: var(--bg-1);
          display: flex;
          flex-direction: column;
        }
        .pricing-card-pro {
          border-color: rgba(16,185,129,0.2);
          background: var(--bg-2);
          box-shadow: 0 0 0 1px rgba(16,185,129,0.15), inset 0 0 60px rgba(16,185,129,0.03);
          position: relative;
        }
        .pricing-card-pro::before {
          content: '';
          position: absolute;
          top: 0;
          left: 24px;
          right: 24px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent);
        }
        .pricing-card-header {
          margin-bottom: 20px;
        }
        .pricing-plan-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-4);
        }
        .pricing-card-pro .pricing-plan-name {
          color: var(--accent);
        }
        .pricing-badge {
          padding: 3px 8px;
          border-radius: 100px;
          background: rgba(16,185,129,0.12);
          font-size: 10px;
          font-weight: 700;
          color: var(--accent);
          margin-right: 8px;
        }
        .pricing-price {
          margin-bottom: 12px;
        }
        .pricing-price-value {
          font-size: clamp(2rem, 5vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .pricing-price-period {
          font-size: 13px;
          color: var(--text-4);
        }
        .pricing-desc {
          font-size: 13px;
          color: var(--text-3);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pricing-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-2);
        }

        .pricing-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0;
          padding: 4px;
          border-radius: 100px;
          background: var(--bg-2);
          border: 1px solid var(--border);
        }
        .pricing-toggle-btn {
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--text-3);
        }
        .pricing-toggle-btn.active {
          background: var(--accent);
          color: #000;
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .pricing-card {
            padding: 24px 20px;
          }
        }
      `}</style>
    </section>
  )
}