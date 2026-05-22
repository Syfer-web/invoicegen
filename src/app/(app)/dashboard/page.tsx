'use client'

export default function Dashboard() {
  // Mock data — will come from Supabase
  const stats = [
    { label: 'Outstanding', value: '€0', sub: '0 invoices' },
    { label: 'Paid this month', value: '€0', sub: '0 invoices' },
    { label: 'Total invoiced', value: '€0', sub: 'All time' },
    { label: 'Draft', value: '0', sub: 'Not sent yet' },
  ]

  const recentInvoices = [
    // Empty state — no invoices yet
  ]

  return (
    <div>
      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-zinc-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex gap-4">
        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Recent invoices */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent invoices</h2>
          <a href="/invoices" className="text-sm text-emerald-400 hover:text-emerald-300">View all →</a>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5">
          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No invoices yet</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-xs">
                Create your first invoice and get paid faster with automated reminders and Stripe payments.
              </p>
              <button className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Invoice rows */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}