'use client'

import { useState } from 'react'
import type { Invoice, LineItem } from '@/types/invoice'

interface Props {
  invoice: Invoice
  onUpdate: (items: LineItem[]) => void
  onNext: () => void
  onBack: () => void
}

const VAT_RATES = [
  { label: 'NL/21% BTW', value: 21 },
  { label: 'NL/9% BTW', value: 9 },
  { label: 'NL/0% BTW', value: 0 },
  { label: 'UK/20% VAT', value: 20 },
  { label: 'UK/5% VAT', value: 5 },
  { label: 'UK/0% VAT', value: 0 },
  { label: 'EU reverse charge', value: 0 },
  { label: 'No VAT', value: 0 },
]

function createEmptyItem(): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: '',
    quantity: 1,
    unit_price: 0,
    vat_rate: 21,
    total: 0,
  }
}

export default function LineItemsStep({ invoice, onUpdate, onNext, onBack }: Props) {
  const [items, setItems] = useState<LineItem[]>(
    invoice.items.length > 0 ? invoice.items : [createEmptyItem()]
  )
  const [defaultVat, setDefaultVat] = useState(21)

  const updateItem = (index: number, updates: Partial<LineItem>) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const merged = { ...item, ...updates }
      merged.total = merged.quantity * merged.unit_price
      return merged
    })
    setItems(updated)
    onUpdate(updated)
  }

  const addItem = () => {
    const newItems = [...items, { ...createEmptyItem(), vat_rate: defaultVat }]
    setItems(newItems)
    onUpdate(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onUpdate(updated)
  }

  // Recalculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const vatTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.vat_rate / 100), 0)
  const total = subtotal + vatTotal

  const handleNext = () => {
    if (items.every(item => item.description && item.quantity > 0 && item.unit_price > 0)) {
      onUpdate(items)
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">What are you charging?</h2>
          <p className="text-sm text-zinc-400">Add line items with automatic VAT/BTW calculation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Default VAT:</span>
          <select
            value={defaultVat}
            onChange={(e) => {
              const rate = Number(e.target.value)
              setDefaultVat(rate)
              setItems(prev => prev.map(item => ({ ...item, vat_rate: rate })))
              onUpdate(items.map(item => ({ ...item, vat_rate: rate })))
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {VAT_RATES.map(r => <option key={r.value} value={r.value} className="bg-[#18181B]">{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Line items table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              <th className="pb-3 pr-4">Description</th>
              <th className="pb-3 px-4 w-24">Qty</th>
              <th className="pb-3 px-4 w-32">Unit price</th>
              <th className="pb-3 px-4 w-28">VAT rate</th>
              <th className="pb-3 pl-4 w-28 text-right">Total</th>
              <th className="pb-3 pl-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item, index) => (
              <tr key={item.id} className="align-top">
                <td className="py-3 pr-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Web design services"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">€</span>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={item.vat_rate}
                    onChange={(e) => updateItem(index, { vat_rate: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {VAT_RATES.map(r => <option key={r.value} value={r.value} className="bg-[#18181B]">{r.label}</option>)}
                  </select>
                </td>
                <td className="py-3 pl-4 text-right font-medium text-white">
                  €{(item.quantity * item.unit_price).toFixed(2)}
                </td>
                <td className="py-3 pl-4">
                  <button
                    onClick={() => removeItem(index)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add item */}
      <button
        onClick={addItem}
        type="button"
        className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add line item
      </button>

      {/* Totals */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between py-2 text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-zinc-400">VAT/BTW</span>
          <span className="text-white">€{vatTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
          <span className="text-white">Total</span>
          <span className="text-emerald-400">€{total.toFixed(2)}</span>
        </div>
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
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
          disabled={!items.some(item => item.description && item.unit_price > 0)}
        >
          Continue to customize →
        </button>
      </div>
    </div>
  )
}