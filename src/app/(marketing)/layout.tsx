import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'InvoiceGen — Beautiful invoices, zero friction',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08090a]">

      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(16,185,129,0.04),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Logo */}
      <div className="relative mb-10">
        <a href="/" className="flex items-center gap-2.5 group/logo">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all group-hover/logo:shadow-[0_0_28px_rgba(16,185,129,0.45)]">
            <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-white/90">InvoiceGen</span>
        </a>
      </div>

      {/* Pages render their own card + footer */}
      {children}

    </div>
  )
}