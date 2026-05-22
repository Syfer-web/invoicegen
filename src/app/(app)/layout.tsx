import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — InvoiceGen',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#09090B]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[220px] border-r border-white/[0.07] bg-[#09090B] flex flex-col z-30">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <a href="/dashboard" className="text-base font-bold tracking-tight text-white">
            Invoice<span className="text-emerald-400">Gen</span>
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-white bg-white/[0.06]"
          >
            Dashboard
          </a>
          <a
            href="/invoices"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            All Invoices
          </a>
          <a
            href="/invoices/new"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            New Invoice
          </a>
          <a
            href="/clients"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Clients
          </a>
          <a
            href="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Products
          </a>
          <a
            href="/recurring"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Recurring
          </a>

          {/* Separator */}
          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Settings</p>
          </div>

          <a
            href="/settings/bank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Bank Details
          </a>
          <a
            href="/settings/reminders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Reminders
          </a>
          <a
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Account
          </a>
        </nav>

        {/* Upgrade */}
        <div className="p-4 border-t border-white/[0.07]">
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-4">
            <p className="text-[13px] font-semibold text-emerald-400 mb-0.5">Upgrade to Pro</p>
            <p className="text-xs text-zinc-500 mb-3 leading-snug">Unlimited invoices, automated reminders, Stripe payments.</p>
            <a
              href="/pricing"
              className="block w-full rounded-lg bg-emerald-500 py-2 text-center text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Upgrade
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-[220px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-[#09090B]/90 backdrop-blur-md px-8 py-4">
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <a
              href="/invoices/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              + New Invoice
            </a>
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-emerald-400">S</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}