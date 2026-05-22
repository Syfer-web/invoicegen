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

const INTEGRATIONS = [
  {
    name: 'Stripe',
    desc: 'Accept online payments with one click. Generate payment links, track statuses, handle refunds.',
    color: '#635bff',
    icon: <StripeIcon />,
  },
  {
    name: 'Resend',
    desc: 'Beautiful email delivery for invoices and reminders. Tracked opens, instant notifications.',
    color: '#000000',
    icon: <ResendIcon />,
  },
  {
    name: 'VIES',
    desc: 'Real-time EU VAT number validation via the official VIES API. Never send a bad VAT number.',
    color: '#10b981',
    icon: <GlobeIcon />,
  },
  {
    name: 'PDF Export',
    desc: 'Generate pixel-perfect PDF invoices. Auto-branded, BTW-correct, ready to send or archive.',
    color: '#ef4444',
    icon: <PDFIcon />,
  },
  {
    name: 'Accounting Export',
    desc: 'Export to CSV, Xero, and QuickBooks. Keep your accountant happy with clean, structured data.',
    color: '#22c55e',
    icon: <ChartIcon />,
  },
  {
    name: 'Multi-currency',
    desc: 'Invoice in EUR, GBP, USD, CHF, and 12 more currencies. Auto-convert with live exchange rates.',
    color: '#f59e0b',
    icon: <CoinsIcon />,
  },
]

function StripeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#635bff">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  )
}
function ResendIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#000" strokeWidth="1.5"/>
      <path d="M2 8l10 6 10-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9"/>
      <path d="M2.5 12h19M12 2.5c-3 4-3 13-3 13s3 9 3 9c0-4 0-9 0-13s0-9 0-13c-3 4-3 13-3 13s3 9 3 9"/>
    </svg>
  )
}
function PDFIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#ef4444" opacity="0.2"/>
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M8 8h8M8 12h5M8 16h3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="14" width="4" height="6" rx="1" fill="#22c55e"/>
      <rect x="10" y="9" width="4" height="11" rx="1" fill="#22c55e"/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill="#22c55e"/>
    </svg>
  )
}
function CoinsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="10" r="6" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M9 7v6M7 10h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="14" r="6" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M15 11v6M13 14h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Integrations() {
  return (
    <section style={{ padding: '120px 32px', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Integrations</div>
            <h2 className="display-lg" style={{ marginBottom: 16 }}>
              Plugs into your<br />existing stack.
            </h2>
            <p className="body-lg" style={{ maxWidth: 460, margin: '0 auto' }}>
              InvoiceGen connects with the tools you already use — no rework required.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="three-col-grid">
          {INTEGRATIONS.map((int, i) => (
            <Reveal key={i} delay={i * 60}>
              <div style={{
                padding: '28px 24px',
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--border-2)'
                el.style.background = 'var(--bg-2)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--bg-1)'
              }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `rgba(${hexToRgb(int.color)}, 0.1)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {int.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  {int.name}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-4)' }}>
                  {int.desc}
                </p>
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