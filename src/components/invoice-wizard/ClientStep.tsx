'use client'

import { useState } from 'react'
import type { Invoice, Client } from '@/types/invoice'

interface Props {
  invoice: Invoice
  onUpdate: (updates: Partial<Invoice>) => void
  onClientUpdate: (client: Client) => void
  onNext: () => void
}

const COUNTRIES = ['Netherlands', 'United Kingdom', 'United States', 'Germany', 'France', 'Belgium', 'Spain', 'Italy', 'Portugal', 'Other']

export default function ClientStep({ invoice, onClientUpdate, onNext }: Props) {
  const [client, setClient] = useState<Client>(invoice.client)

  const updateField = (field: keyof Client, value: string) => {
    const updated = { ...client, [field]: value }
    setClient(updated)
    onClientUpdate(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!client.name || !client.email) return
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Who are you invoicing?</h2>
        <p className="text-sm text-zinc-400">Add your client&apos;s details. You can save them for next time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contact name *</label>
          <input
            type="text"
            value={client.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Jan de Vries"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Company (optional)</label>
          <input
            type="text"
            value={client.company || ''}
            onChange={(e) => updateField('company', e.target.value)}
            placeholder="Acme BV"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address *</label>
          <input
            type="email"
            value={client.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="jan@acme.nl"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Country</label>
          <select
            value={client.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          >
            <option value="" className="bg-[#18181B]">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#18181B]">{c}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Address</label>
          <input
            type="text"
            value={client.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Keizersgracht 123, 1016 CJ Amsterdam"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">VAT number (optional)</label>
          <input
            type="text"
            value={client.vat_number || ''}
            onChange={(e) => updateField('vat_number', e.target.value)}
            placeholder="NL001234567B01"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
          disabled={!client.name || !client.email}
        >
          Continue to line items →
        </button>
      </div>
    </form>
  )
}