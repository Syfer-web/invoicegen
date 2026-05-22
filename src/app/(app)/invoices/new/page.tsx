import InvoiceBuilder from '@/components/invoice-builder/InvoiceBuilder'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Invoice — InvoiceGen',
}

export default function NewInvoicePage() {
  return <InvoiceBuilder />
}