'use client'
import { useEffect, useRef, useState } from 'react'

const badges = [
  { label: 'SSL Encrypted', desc: '256-bit AES' },
  { label: 'GDPR Compliant', desc: 'EU data laws' },
  { label: 'Stripe Verified', desc: 'Secure payments' },
  { label: 'SOC 2 Type II', desc: 'Enterprise-grade' },
]

export default function SecurityBadges() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-wrap items-center justify-center gap-8 py-8 px-6"
      style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-4)' }}>{b.label}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-5)' }}>·</span>
          <span className="text-[11px]" style={{ color: 'var(--text-5)' }}>{b.desc}</span>
        </div>
      ))}
    </div>
  )
}