'use client'

import { useState } from 'react'
import type { Invoice, LineItem, Client } from '@/types/invoice'
import ClientStep from '@/components/invoice-wizard/ClientStep'
import LineItemsStep from '@/components/invoice-wizard/LineItemsStep'
import CustomizeStep from '@/components/invoice-wizard/CustomizeStep'
import PreviewStep from '@/components/invoice-wizard/PreviewStep'

const STEPS = ['Client', 'Line Items', 'Customize', 'Preview']

function createEmptyInvoice(): Invoice {
  return {
    type: 'standard',
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    status: 'draft',
    client: {
      name: '',
      email: '',
      address: '',
    },
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    vat_total: 0,
    total: 0,
    payment_terms: 30,
  }
}

export default function NewInvoicePage() {
  const [step, setStep] = useState(0)
  const [invoice, setInvoice] = useState<Invoice>(createEmptyInvoice())

  const updateInvoice = (updates: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...updates }))
  }

  const updateClient = (client: Client) => {
    setInvoice(prev => ({ ...prev, client }))
  }

  const updateItems = (items: LineItem[]) => {
    // Recalculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const vat_total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.vat_rate / 100), 0)
    setInvoice(prev => ({ ...prev, items, subtotal, vat_total, total: subtotal + vat_total }))
  }

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div className="max-w-4xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((name, i) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i <= step 
                  ? 'bg-emerald-500 text-black' 
                  : 'border border-white/20 text-zinc-500'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= step ? 'text-white' : 'text-zinc-500'}`}>
                {name}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 sm:w-16 bg-white/10 mx-2`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        {step === 0 && (
          <ClientStep 
            invoice={invoice} 
            onUpdate={updateInvoice} 
            onClientUpdate={updateClient}
            onNext={nextStep}
          />
        )}
        {step === 1 && (
          <LineItemsStep 
            invoice={invoice}
            onUpdate={updateItems}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 2 && (
          <CustomizeStep
            invoice={invoice}
            onUpdate={updateInvoice}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <PreviewStep
            invoice={invoice}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  )
}