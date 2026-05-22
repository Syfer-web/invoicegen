'use client'
import { useEffect, useRef, useState } from 'react'

// ─── Scroll reveal ─────────────────────────────────────────────
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

// ─── Icons ─────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12l5 5L20 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Data ─────────────────────────────────────────────────────
const FREE_FEATURES  = ['5 invoices/month', '1 company', 'PDF export', 'Email support']
const PRO_FEATURES   = ['50 invoices/month', '3 companies', 'Stripe payments', 'Automated reminders', 'VIES validation', 'Priority support']
const SCALE_FEATURES = ['Unlimited invoices', 'Unlimited companies', 'Custom branding', 'API access', 'White-label invoices', 'Dedicated account manager']

// ─── Plan card ─────────────────────────────────────────────────
function PlanCard({
  name, price, period, desc, features, cta, ctaHref,
  variant = 'default', // 'default' | 'pro' | 'scale'
  delay = 0,
}: {
  name: string; price: string; period: string; desc: string;
  features: string[]; cta: string; ctaHref: string;
  variant?: 'default' | 'pro' | 'scale';
  delay?: number;
}) {
  const isPro = variant === 'pro'

  return (
    <Reveal delay={delay}>
      <div style={{
        padding: '28px 24px',
        borderRadius: 20,
        background: isPro ? '#111' : '#18181B',
        border: isPro ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
        borderLeft: isPro ? '3px solid #10b981' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isPro
          ? '0 0 0 1px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.08), inset 0 1px 0 rgba(16,185,129,0.1)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: variant === 'scale' ? 0.65 : 1,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={e => {
        if (variant === 'scale') (e.currentTarget as HTMLDivElement).style.opacity = '1'
      }}
      onMouseLeave={e => {
        if (variant === 'scale') (e.currentTarget as HTMLDivElement).style.opacity = '0.65'
      }}
      >
        {/* Top shimmer for Pro */}
        {isPro && (
          <div style={{
            position: 'absolute', top: 0, left: 24, right: 24, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)',
          }} />
        )}

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          {isPro && (
            <div style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 100,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 10, fontWeight: 700, color: '#10b981',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              Most popular
            </div>
          )}
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: isPro ? '#10b981' : '#555',
          }}>
            {name}
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            color: isPro ? '#f5f5f5' : '#e0e0e0',
          }}>
            {price}
          </span>
          <span style={{ fontSize: 13, color: '#555' }}>/{period}</span>
        </div>

        {/* Desc */}
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
          {desc}
        </p>

        {/* CTA */}
        <a
          href={ctaHref}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '13px 20px',
            borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            background: isPro ? '#10b981' : 'rgba(255,255,255,0.06)',
            color: isPro ? '#000' : '#a0a0a0',
            border: isPro ? 'none' : '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
            marginBottom: 28,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
        >
          {cta}
        </a>

        {/* Features */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#a0a0a0' }}>
              <CheckIcon /> {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

// ─── Pricing section ───────────────────────────────────────────
export default function Pricing({ region, prices, symbol }: { region: string; prices: any; symbol: string }) {
  const [annual, setAnnual] = useState(false)

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 120px) clamp(16px, 5vw, 80px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: '#09090B',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
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
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 0,
              padding: 4,
              borderRadius: 100,
              background: '#18181B',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <button
                onClick={() => setAnnual(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 100,
                  fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: !annual ? '#10b981' : 'transparent',
                  color: !annual ? '#000' : '#666',
                  transition: 'all 0.15s ease',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 100,
                  fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: annual ? '#10b981' : 'transparent',
                  color: annual ? '#000' : '#666',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                Annual
                {annual && (
                  <span style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 100,
                    padding: '2px 7px',
                    fontSize: 10, fontWeight: 700,
                  }}>
                    −20%
                  </span>
                )}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }} className="pricing-grid">
          {/* Free */}
          <PlanCard
            name="Free"
            price="€0"
            period="month"
            desc="Perfect for trying things out."
            features={FREE_FEATURES}
            cta="Get started free"
            ctaHref="/signup"
            variant="default"
            delay={0}
          />
          {/* Pro — dominant */}
          <PlanCard
            name="Pro"
            price={`${symbol}${annual ? prices.pro_annual : prices.pro}`}
            period="month"
            desc="For freelancers and small agencies."
            features={PRO_FEATURES}
            cta="Start Pro →"
            ctaHref="/signup?plan=pro"
            variant="pro"
            delay={80}
          />
          {/* Scale — muted */}
          <PlanCard
            name="Scale"
            price={`${symbol}${annual ? prices.scale_annual : prices.scale}`}
            period="month"
            desc="For growing agencies with multiple clients."
            features={SCALE_FEATURES}
            cta="Contact sales"
            ctaHref="mailto:hello@invoicegen.app"
            variant="scale"
            delay={160}
          />
        </div>

        {/* Footer note */}
        <Reveal>
          <p style={{
            textAlign: 'center', marginTop: 32,
            fontSize: 11, color: '#444',
          }}>
            All prices exclude local VAT. Monthly plans billed month-to-month. Annual plans billed annually.
          </p>
        </Reveal>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  )
}