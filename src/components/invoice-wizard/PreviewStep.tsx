'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { Invoice } from '@/types/invoice'
import InvoicePDF from './InvoicePDF'

interface Props {
  invoice: Invoice
  onBack: () => void
}

export default function PreviewStep({ invoice, onBack }: Props) {
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  // Get currency symbol from VAT rate context (simplified: default EUR)
  const currencySymbol = '€'

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const blob = await pdf(
        <InvoicePDF
          invoice={invoice}
          companyName={invoice.company_name}
          companyAddress={invoice.company_address}
          companyEmail={invoice.company_email}
          companyVat={invoice.company_vat}
          currencySymbol={currencySymbol}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoice_number}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to generate PDF. Please try again.')
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    setError('')
    try {
      // Step 1: Create Stripe payment link (server action)
      const res = await fetch('/api/invoices/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(invoice.total * 100), // cents
          currency: 'eur',
          invoiceNumber: invoice.invoice_number,
          clientEmail: invoice.client.email,
          description: invoice.items.map(i => i.description).join(', '),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create payment link')
      }

      const { paymentLinkUrl } = await res.json()

      // Step 2: Send email via Resend (server action)
      const emailRes = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice,
          paymentLinkUrl,
          clientEmail: invoice.client.email,
          clientName: invoice.client.name,
          companyName: invoice.company_name || 'Your Company',
          currencySymbol,
        }),
      })

      if (!emailRes.ok) {
        const data = await emailRes.json()
        throw new Error(data.error || 'Failed to send email')
      }

      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Invoice sent!</h2>
        <p className="text-zinc-400 mb-6 max-w-sm">
          Your invoice has been emailed to {invoice.client.email} with a Stripe payment link.
          We&apos;ll send automatic reminders at day 7 and day 14.
        </p>
        <div className="flex gap-3">
          <a href="/invoices" className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5">
            View all invoices
          </a>
          <button
            onClick={() => window.location.href = '/invoices/new'}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            Create another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Preview & send</h2>
        <p className="text-sm text-zinc-400">Review your invoice, download the PDF, or send it to your client.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Invoice preview (simplified) */}
      <div className="rounded-xl border border-white/10 bg-white p-8 text-black">
        <div className="flex items-start justify-between border-b border-black/10 pb-6 mb-6">
          <div>
            <div className="h-6 w-32 rounded bg-zinc-200 mb-2" />
            <div className="h-4 w-48 rounded bg-zinc-100" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-black">
              {invoice.type === 'proforma' ? 'PROFORMA' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'}
            </div>
            <div className="text-sm text-zinc-500 mt-1">#{invoice.invoice_number}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">From</p>
            <p className="font-medium">{invoice.company_name || 'Your Company Name'}</p>
            <p className="text-sm text-zinc-600">{invoice.company_address || '123 Business Street'}</p>
            <p className="text-sm text-zinc-600">{invoice.company_email || 'you@company.com'}</p>
            {invoice.company_vat && <p className="text-sm text-zinc-600">VAT: {invoice.company_vat}</p>}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Bill to</p>
            <p className="font-medium">{invoice.client.name}</p>
            {invoice.client.company && <p className="text-sm text-zinc-600">{invoice.client.company}</p>}
            <p className="text-sm text-zinc-600">{invoice.client.email}</p>
            <p className="text-sm text-zinc-600">{invoice.client.address}</p>
            {invoice.client.vat_number && <p className="text-sm text-zinc-600">VAT: {invoice.client.vat_number}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">Issue date</p>
            <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">Due date</p>
            <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">Payment terms</p>
            <p className="font-medium">{invoice.payment_terms} days</p>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              <th className="pb-3">Description</th>
              <th className="pb-3 text-right">Qty</th>
              <th className="pb-3 text-right">Unit price</th>
              <th className="pb-3 text-right">VAT</th>
              <th className="pb-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {invoice.items.map((item) => (
              <tr key={item.id} className="text-sm">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">{currencySymbol}{item.unit_price.toFixed(2)}</td>
                <td className="py-3 text-right">{item.vat_rate}%</td>
                <td className="py-3 text-right font-medium">{currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black/10 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Subtotal</span>
            <span>{currencySymbol}{(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-600">
            <span>VAT/BTW</span>
            <span>{currencySymbol}{(invoice.vat_total || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-black border-t border-black/10 pt-2">
            <span>Total</span>
            <span>{currencySymbol}{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 border-t border-black/10 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Notes</p>
            <p className="text-sm text-zinc-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {sending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send to {invoice.client.email}
            </>
          )}
        </button>
      </div>

      <button
        onClick={onBack}
        type="button"
        className="w-full rounded-full border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
      >
        ← Edit invoice
      </button>
    </div>
  )
}