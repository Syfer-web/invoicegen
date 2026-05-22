'use client'

import { useState } from 'react'
import type { Invoice } from '@/types/invoice'

interface Props {
  invoice: Invoice
  onUpdate: (updates: Partial<Invoice>) => void
  onNext: () => void
  onBack: () => void
}

const INVOICE_TYPES = [
  { value: 'standard', label: 'Standard invoice', description: 'Regular invoice for goods or services' },
  { value: 'proforma', label: 'Proforma invoice', description: 'Quote converted to invoice, non-binding' },
  { value: 'credit_note', label: 'Credit note', description: 'Refund or credit against existing invoice' },
  { value: 'recurring', label: 'Recurring invoice', description: 'Template for monthly/quarterly billing' },
]

const PAYMENT_TERMS = [14, 30, 60, 90]

export default function CustomizeStep({ invoice, onUpdate, onNext, onBack }: Props) {
  const [notes, setNotes] = useState(invoice.notes || '')
  const [payment_terms, setPaymentTerms] = useState(invoice.payment_terms || 30)

  const handleNext = () => {
    onUpdate({ notes, payment_terms })
    onNext()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Customize your invoice</h2>
        <p className="text-sm text-zinc-400">Set invoice type, payment terms, and any extra notes.</p>
      </div>

      {/* Invoice type */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Invoice type</label>
        <div className="grid gap-3 md:grid-cols-2">
          {INVOICE_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => onUpdate({ type: type.value as Invoice['type'] })}
              className={`rounded-lg border p-4 text-left transition-colors ${
                invoice.type === type.value
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <p className="text-sm font-medium text-white">{type.label}</p>
              <p className="text-xs text-zinc-400 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Issue date</label>
          <input
            type="date"
            value={invoice.issue_date}
            onChange={(e) => onUpdate({ issue_date: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Due date</label>
          <input
            type="date"
            value={invoice.due_date}
            onChange={(e) => onUpdate({ due_date: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Payment terms */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Payment terms</label>
        <div className="flex flex-wrap gap-3">
          {PAYMENT_TERMS.map(days => (
            <button
              key={days}
              type="button"
              onClick={() => setPaymentTerms(days)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                payment_terms === days
                  ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bank: NL12 INGB 0000 0000 00\nReference: Invoice #INV-001"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          type="button"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          type="button"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          Preview invoice →
        </button>
      </div>
    </div>
  )
}