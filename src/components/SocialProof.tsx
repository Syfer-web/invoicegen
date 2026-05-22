'use client'
import { useEffect, useRef } from 'react'

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

export default function SocialProof() {
  return (
    <section className="sp-section">
      {/* Stats bar */}
      <div className="sp-stats">
        {STATS.map((stat, i) => (
          <div key={i} className="sp-stat">
            <div className="sp-stat-value">{stat.value}</div>
            <div className="sp-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Logo marquee */}
      <div className="sp-marquee-wrap">
        <div className="sp-marquee-label">Trusted by teams at</div>
        <div className="sp-marquee-track">
          {[...LOGOS, ...LOGOS].map((name, i) => (
            <span key={i} className="sp-logo">{name}</span>
          ))}
        </div>
      </div>

      <style>{`
        .sp-section {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }

        /* Stats */
        .sp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--border);
        }
        .sp-stat {
          padding: 32px 16px;
          text-align: center;
          border-right: 1px solid var(--border);
        }
        .sp-stat:last-child { border-right: none; }
        .sp-stat-value {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--accent);
          line-height: 1;
          margin-bottom: 6px;
        }
        .sp-stat-label {
          font-size: 12px;
          color: var(--text-4);
          font-weight: 500;
        }

        /* Marquee */
        .sp-marquee-wrap {
          padding: 24px 0;
          background: var(--bg-1);
        }
        .sp-marquee-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-5);
          text-align: center;
          margin-bottom: 16px;
        }
        .sp-marquee-track {
          display: flex;
          gap: 0;
          animation: marquee 28s linear infinite;
          width: max-content;
        }
        .sp-logo {
          padding: 6px 24px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-4);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .sp-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .sp-stat {
            padding: 24px 12px;
          }
          .sp-stat:nth-child(2) { border-right: none; }
          .sp-stat:nth-child(1),
          .sp-stat:nth-child(2) {
            border-bottom: 1px solid var(--border);
          }
        }
        @media (max-width: 400px) {
          .sp-stat-value { font-size: 1.4rem; }
          .sp-stat-label { font-size: 11px; }
        }
      `}</style>
    </section>
  )
}