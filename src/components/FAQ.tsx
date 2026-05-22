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

const FAQ_ITEMS = [
  {
    q: 'Can I change plans later?',
    a: 'Yes — upgrade or downgrade at any time. When you upgrade, you\'ll be prorated for the remainder of your billing period. When you downgrade, the change takes effect at the end of your current billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards via Stripe — Visa, Mastercard, American Express, and UnionPay. SEPA direct debit is available for annual plans in the EU.',
  },
  {
    q: 'Do you handle VAT automatically?',
    a: 'Yes. InvoiceGen automatically applies the correct VAT rate based on your client\'s country and your business location. We also validate EU VAT numbers against VIES in real time and handle reverse charge for B2B cross-border transactions.',
  },
  {
    q: 'Is my data secure?',
    a: 'We use 256-bit SSL encryption for all data in transit and AES-256 encryption at rest. We\'re GDPR compliant, never share your data with third parties, and you can export or delete all your data at any time.',
  },
  {
    q: 'Can I use InvoiceGen for multiple businesses?',
    a: 'Pro supports up to 3 companies. Scale supports unlimited companies with a unified dashboard — perfect for agency owners managing multiple client accounts.',
  },
  {
    q: 'What happens if I exceed my invoice limit?',
    a: 'You\'ll receive an alert when you reach 80% of your monthly limit. If you exceed the limit, you can upgrade instantly or purchase additional invoices at €0.50 each (Pro) or €0.25 each (Scale).',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ padding: '120px 32px', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ maxWidth: 740 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>FAQ</div>
            <h2 className="display-lg" style={{ marginBottom: 16 }}>Questions? Answered.</h2>
            <p className="body-lg">
              Can&apos;t find what you&apos;re looking for?{' '}
              <a href="mailto:hello@invoicegen.app" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Email us
              </a>
              .
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 24,
                  }}
                >
                  <span style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: open === i ? 'var(--accent)' : 'var(--text)',
                    transition: 'color 0.15s ease',
                  }}>
                    {item.q}
                  </span>
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: open === i ? 'var(--accent)' : 'var(--bg-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke={open === i ? '#000' : 'var(--text-3)'} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                <div style={{
                  overflow: 'hidden',
                  maxHeight: open === i ? 400 : 0,
                  transition: 'max-height 0.3s ease',
                }}>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-3)', paddingBottom: 24 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}