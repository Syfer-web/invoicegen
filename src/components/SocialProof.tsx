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

// ─── Data ─────────────────────────────────────────────────────
const STATS = [
  { value: '3,400+', label: 'Active users' },
  { value: '€2.4M+', label: 'Invoices processed' },
  { value: '99.2%', label: 'Uptime SLA' },
  { value: '<60s', label: 'Avg creation time' },
]

const LOGOS = [
  'Notion', 'Linear', 'Vercel', 'Figma',
  'Stripe', 'Loom', 'Looped', 'Arc',
  'Raycast', 'Cron', 'Plain', 'Superhuman',
]

const TESTIMONIALS = [
  {
    name: 'Sophie van der Berg',
    role: 'Freelance Designer',
    company: 'Amsterdam, NL',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=b6e3f4',
    quote: 'InvoiceGen cut my invoicing time from 20 minutes to under 2. The VIES validation alone has saved me from two compliance headaches already.',
    stars: 5,
  },
  {
    name: 'Marcus Webb',
    role: 'Agency Founder',
    company: 'London, UK',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
    quote: 'We switched from Harvest after a year. InvoiceGen handles EU VAT perfectly — something Harvest never did. The Stripe integration alone is worth it.',
    stars: 5,
  },
  {
    name: 'Lena Müller',
    role: 'Consultant',
    company: 'Berlin, DE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lena&backgroundColor=ffdfbf',
    quote: 'The automated reminder sequence recovered €4,200 in overdue payments last quarter. I literally set it and forgot it.',
    stars: 5,
  },
]

// ─── Testimonial card ──────────────────────────────────────────
function TestimonialCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div style={{
        background: '#18181B',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-3px)'
        el.style.borderColor = 'rgba(16,185,129,0.2)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
      >
        {/* Stars */}
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: t.stars }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#10b981">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>

        {/* Quote */}
        <p style={{
          fontSize: 14, lineHeight: 1.7,
          color: '#a0a0a0', margin: 0,
          flex: 1,
        }}>
          &ldquo;{t.quote}&rdquo;
        </p>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={t.avatar}
            alt={t.name}
            width={40}
            height={40}
            style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{t.name}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{t.role} · {t.company}</div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── SocialProof section ──────────────────────────────────────
export default function SocialProof() {
  return (
    <section style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: '#09090B',
    }}>
      {/* Stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }} className="sp-stats-grid">
        {STATS.map((stat, i) => (
          <Reveal key={i} delay={i * 60}>
            <div style={{
              padding: '36px 16px',
              textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#10b981',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Logo marquee */}
      <div className="sp-marquee-wrap">
        <div style={{
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#444', textAlign: 'center', marginBottom: 16,
        }}>
          Trusted by teams at
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{
            display: 'flex',
            gap: 0,
            animation: 'sp-marquee 30s linear infinite',
            width: 'max-content',
          }}>
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span key={i} style={{
                padding: '6px 28px',
                fontSize: 12, fontWeight: 600,
                color: '#555',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                borderRight: '1px solid rgba(255,255,255,0.05)',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 80px)',
      }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>Testimonials</div>
            <h2 className="display-lg" style={{ marginBottom: 0 }}>
              Loved by real businesses.
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }} className="sp-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} delay={i * 100} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sp-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 768px) {
          .sp-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .sp-stats-grid > div:nth-child(2) { border-right: none !important; }
          .sp-stats-grid > div:nth-child(1),
          .sp-stats-grid > div:nth-child(2) {
            border-bottom: 1px solid rgba(255,255,255,0.07) !important;
          }
          .sp-testimonials-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 400px) {
          .sp-stats-grid > div {
            padding: 24px 12px !important;
          }
        }
      `}</style>
    </section>
  )
}