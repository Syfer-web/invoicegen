// =============================================
// INVOICE BUILDER TYPES
// =============================================

export type InvoiceType = 'standard' | 'quote' | 'proforma' | 'credit_note' | 'recurring'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type Currency = 'EUR' | 'GBP' | 'USD' | 'CAD' | 'AUD'

export type LineItem = {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  discount_percent: number
  sort_order: number
}

export type Client = {
  id?: string
  name: string
  company: string
  email: string
  address: string
  city: string
  postcode: string
  country: string
  vat_number: string
  phone: string
}

export type BankAccount = {
  id?: string
  account_holder: string
  bank_name: string
  iban: string
  swift_bic: string
  account_number: string
  sort_code: string
  currency: Currency
  is_default: boolean
}

export type Company = {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  country: string
  email: string
  phone: string
  vat_number: string
  logo_url: string
  website: string
  default_vat_rate: number
  default_currency: Currency
  default_payment_terms: number
  invoice_prefix: string
  invoice_counter: number
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  is_active: boolean
}

export type Invoice = {
  id?: string
  company_id: string
  company?: Company

  // Identity
  invoice_number: string
  type: InvoiceType
  status: InvoiceStatus

  // Client
  client: Client
  client_id?: string

  // Dates
  issue_date: string
  due_date: string
  payment_terms: number

  // Currency
  currency: Currency

  // Line items
  items: LineItem[]

  // Totals
  subtotal: number
  discount_amount: number
  discount_percent: number
  vat_total: number
  total: number

  // References
  project_ref: string
  order_number: string

  // Notes
  notes: string
  internal_notes: string
  payment_terms_text: string

  // Payment
  stripe_payment_link_id: string
  stripe_payment_link_url: string
  allow_partial_payment: boolean
  partial_payment_schedule: PartialPayment[]

  // Early payment discount
  early_payment_discount_percent: number
  early_payment_days: number

  // Branding
  accent_color: string

  // Meta
  created_at?: string
  updated_at?: string
}

export type PartialPayment = {
  due_date: string
  amount: number
  label: string
}

export type Plan = 'free' | 'pro' | 'scale'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none'

// =============================================
// HELPERS
// =============================================

export const CURRENCIES: { value: Currency; symbol: string; name: string }[] = [
  { value: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { value: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { value: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { value: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  { value: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
]

export const VAT_RATES: { value: number; label: string }[] = [
  { value: 21, label: 'NL 21% BTW' },
  { value: 9, label: 'NL 9% BTW' },
  { value: 0, label: 'NL 0% BTW' },
  { value: 20, label: 'UK 20% VAT' },
  { value: 5, label: 'UK 5% VAT' },
  { value: 0, label: 'UK 0% VAT' },
  { value: 19, label: 'DE 19% MwSt' },
  { value: 20, label: 'FR 20% TVA' },
  { value: 21, label: 'BE 21% BTW' },
  { value: 23, label: 'IE 23% VAT' },
  { value: 0, label: 'EU Reverse Charge' },
  { value: 0, label: 'Exempt' },
  { value: 0, label: 'No VAT' },
]

export const INVOICE_TYPES: { value: InvoiceType; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard Invoice', description: 'Regular invoice for goods or services' },
  { value: 'quote', label: 'Quote / Estimate', description: 'Non-binding estimate before work begins' },
  { value: 'proforma', label: 'Proforma Invoice', description: 'Preliminary invoice, non-binding' },
  { value: 'credit_note', label: 'Credit Note', description: 'Refund or credit against existing invoice' },
  { value: 'recurring', label: 'Recurring Template', description: 'Template for recurring billing' },
]

export const PAYMENT_TERMS_OPTIONS = [14, 30, 60, 90]

export const COUNTRIES = [
  'Netherlands', 'United Kingdom', 'United States', 'Germany', 'France',
  'Belgium', 'Spain', 'Italy', 'Portugal', 'Switzerland', 'Austria',
  'Ireland', 'Sweden', 'Denmark', 'Norway', 'Finland', 'Poland',
  'Czech Republic', 'Australia', 'Canada', 'Other',
]

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
  CAD: 'C$',
  AUD: 'A$',
}

export function createEmptyLineItem(vatRate = 21): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: 'item',
    unit_price: 0,
    vat_rate: vatRate,
    discount_percent: 0,
    sort_order: 0,
  }
}

export function createEmptyClient(): Client {
  return {
    name: '',
    company: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
    vat_number: '',
    phone: '',
  }
}

export function calculateInvoiceTotals(items: LineItem[], overallDiscount = 0): {
  subtotal: number
  discount_amount: number
  vat_total: number
  total: number
  vat_breakdown: { rate: number; net: number; vat: number }[]
} {
  const subtotal = items.reduce((sum, item) => {
    const net = item.quantity * item.unit_price * (1 - item.discount_percent / 100)
    return sum + net
  }, 0)

  const discount_amount = overallDiscount

  // VAT breakdown by rate
  const vatMap: Record<number, { net: number; vat: number }> = {}
  for (const item of items) {
    const net = item.quantity * item.unit_price * (1 - item.discount_percent / 100)
    if (!vatMap[item.vat_rate]) vatMap[item.vat_rate] = { net: 0, vat: 0 }
    vatMap[item.vat_rate].net += net
    vatMap[item.vat_rate].vat += net * item.vat_rate / 100
  }

  const vat_total = Object.values(vatMap).reduce((sum, v) => sum + v.vat, 0)
  const total = subtotal - discount_amount + vat_total

  const vat_breakdown = Object.entries(vatMap).map(([rate, v]) => ({
    rate: parseFloat(rate),
    net: Math.round(v.net * 100) / 100,
    vat: Math.round(v.vat * 100) / 100,
  }))

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discount_amount * 100) / 100,
    vat_total: Math.round(vat_total * 100) / 100,
    total: Math.round(total * 100) / 100,
    vat_breakdown,
  }
}