import Link from 'next/link'

// Inline SVG Revenue Chart
function RevenueChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const values = [0, 0, 0, 0, 0, 0] // placeholder — wire to Supabase later

  const max = Math.max(...values, 1)
  const width = 320
  const height = 80
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - (v / max) * height,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-zinc-400">Revenue (6 months)</p>
          <p className="text-2xl font-bold text-white mt-1">€0</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          All time
        </div>
      </div>
      {values.every(v => v === 0) ? (
        <div className="h-20 flex items-center justify-center">
          <p className="text-xs text-zinc-500">Create invoices to see revenue</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#revGrad)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <div className="flex justify-between mt-2">
        {months.map(m => (
          <span key={m} className="text-xs text-zinc-600">{m}</span>
        ))}
      </div>
    </div>
  )
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-400',
    overdue: 'bg-red-500/10 text-red-400',
    draft: 'bg-white/5 text-zinc-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
        status === 'paid' ? 'bg-emerald-400' :
        status === 'pending' ? 'bg-amber-400' :
        status === 'overdue' ? 'bg-red-400' :
        'bg-zinc-600'
      }`} />
      {status}
    </span>
  )
}

export default function Dashboard() {
  const stats = [
    { label: 'Outstanding', value: '€0', sub: '0 invoices', color: 'text-amber-400' },
    { label: 'Paid this month', value: '€0', sub: '0 invoices', color: 'text-emerald-400' },
    { label: 'Total invoiced', value: '€0', sub: 'All time', color: 'text-white' },
    { label: 'Overdue', value: '0', sub: '€0', color: 'text-red-400' },
  ]

  const recentInvoices = [] // wire to Supabase

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Welcome back — here's your invoicing overview.</p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{stat.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-600 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="mb-8">
        <RevenueChart />
      </div>

      {/* Recent invoices + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices table */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Recent invoices</h2>
            <Link href="/invoices" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white mb-1.5">No invoices yet</h3>
              <p className="text-xs text-zinc-500 mb-5 max-w-xs">
                Send your first invoice and start getting paid.
              </p>
              <Link href="/invoices/new" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider hidden md:table-cell">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider hidden lg:table-cell">Due</th>
                </tr>
              </thead>
              <tbody>
                {/* Wire to Supabase */}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column — quick stats & actions */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Quick actions</p>
            <div className="space-y-2">
              <Link href="/invoices/new" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                New Invoice
              </Link>
              <Link href="/clients" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                Add Client
              </Link>
            </div>
          </div>

          {/* Payment status breakdown */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Invoice status</p>
            <div className="space-y-3">
              {[
                { label: 'Paid', count: 0, color: 'bg-emerald-400', pct: 0 },
                { label: 'Pending', count: 0, color: 'bg-amber-400', pct: 0 },
                { label: 'Overdue', count: 0, color: 'bg-red-400', pct: 0 },
                { label: 'Draft', count: 0, color: 'bg-zinc-600', pct: 0 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-zinc-400 flex-1">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Getting started card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-1">Getting started</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Add your Stripe account in Settings to start accepting online payments. Connect your bank — no technical knowledge needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}