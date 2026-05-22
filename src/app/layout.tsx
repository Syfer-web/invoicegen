import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InvoiceGen — Professional Invoices in Seconds',
  description: 'Generate professional invoices instantly. Free to start, no credit card required. BTW/VAT correct for Europe, UK and USA.',
  keywords: 'invoice generator, invoice software, create invoice, VAT invoice, euro invoice, UK invoice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}