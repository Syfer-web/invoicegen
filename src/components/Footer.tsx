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
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const FOOTER_LINKS = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Solutions: ['For Freelancers', 'For Agencies', 'For Small Business', 'Integrations'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
}

const SOCIAL_LINKS = [
  { label: 'X', href: '#', icon: <XIcon /> },
  { label: 'LinkedIn', href: '#', icon: <LinkedInIcon /> },
  { label: 'GitHub', href: '#', icon: <GitHubIcon /> },
]

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '72px 32px 40px' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 64 }} className="five-col-grid">
          {/* Brand */}
          <Reveal delay={0}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6M12 9v6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>InvoiceGen</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-4)', lineHeight: 1.65, maxWidth: 260, marginBottom: 24 }}>
                Professional invoicing for freelancers and agencies. BTW-correct, Stripe-ready, EU and UK compliant.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {SOCIAL_LINKS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--bg-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-4)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([col, links], i) => (
            <Reveal key={col} delay={(i + 1) * 60}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)', marginBottom: 20 }}>
                  {col}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {links.map(link => (
                    <li key={link} style={{ marginBottom: 12 }}>
                      <a
                        href="#"
                        style={{ fontSize: 14, color: 'var(--text-4)', transition: 'color 0.15s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom bar */}
        <Reveal delay={300}>
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-5)' }}>
              © 2024 InvoiceGen. All rights reserved.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-5)' }}>
              Made with care in Europe 🇪🇺
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}