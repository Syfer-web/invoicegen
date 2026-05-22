export type InvoiceType = 'standard' | 'proforma' | 'credit_note' | 'recurring'

export type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number // percentage, e.g. 21 for 21%
  total: number
}

export type Client = {
  id?: string
  name: string
  company?: string
  email: string
  address: string
  city?: string
  postcode?: string
  country?: string
  vat_number?: string
}

export type Invoice = {
  id?: string
  type: InvoiceType
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  
  // Company (from user settings)
  company_name?: string
  company_address?: string
  company_email?: string
  company_vat?: string
  
  // Client
  client: Client
  
  // Dates
  issue_date: string
  due_date: string
  
  // Line items
  items: LineItem[]
  
  // Totals
  subtotal: number
  vat_total: number
  total: number
  
  // Payment
  payment_terms?: number // days
  payment_link?: string
  notes?: string
  
  // Meta
  created_at?: string
  updated_at?: string
}

export type Company = {
  id: string
  name: string
  address: string
  email: string
  vat_number?: string
  logo_url?: string
  default_vat_rate: number
  default_payment_terms: number
  stripe_account_id?: string
}

export type UserPlan = 'free' | 'pro' | 'scale'

export type Subscription = {
  id: string
  plan: UserPlan
  status: 'active' | 'cancelled' | 'past_due'
  invoices_used_this_month: number
  invoices_limit: number
  current_period_end: string
}