/**
 * Recurring Invoice Utilities
 * Helper functions for recurring invoice profiles
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly'

export type TemplateItem = {
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
}

export type RecurringProfile = {
  id: string
  company_id: string
  client_id: string | null
  name: string
  frequency: Frequency
  start_date: string
  next_run: string | null
  auto_send: boolean
  template_items: TemplateItem[]
  template_notes: string | null
  template_currency: string
  template_vat_rate: number
  is_active: boolean
  last_generated: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; email: string } | null
}

export type InvoiceData = {
  invoice_number: string
  type: 'recurring'
  status: 'draft' | 'sent'
  issue_date: string
  due_date: string
  payment_terms: number
  notes: string | null
  subtotal: number
  vat_total: number
  total: number
  currency: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    vat_rate: number
    sort_order: number
  }>
}

// ─── Frequency Mapping ──────────────────────────────────────────────────────

const FREQ_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
}

// ─── Core Utilities ─────────────────────────────────────────────────────────

/**
 * Calculate the next run date based on frequency
 */
export function calculateNextRun(currentRun: Date, frequency: Frequency): Date {
  const d = new Date(currentRun)
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'biweekly':
      d.setDate(d.getDate() + 14)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
  }
  return d
}

/**
 * Return due-date offset (payment_terms in days) for a frequency
 */
export function getDueDateFrequency(frequency: Frequency): number {
  return FREQ_DAYS[frequency] ?? 30
}

/**
 * Format a frequency value to a human-readable label
 */
export function getFrequencyLabel(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  }
  return labels[frequency] ?? frequency
}

/**
 * Generate the first N upcoming run dates for a profile
 */
export function getNextRuns(startDate: Date, frequency: Frequency, count = 3): Date[] {
  const runs: Date[] = []
  let cursor = new Date(startDate)
  for (let i = 0; i < count; i++) {
    runs.push(cursor)
    cursor = calculateNextRun(cursor, frequency)
  }
  return runs
}

// ─── Invoice Generation ──────────────────────────────────────────────────────

/**
 * Build invoice data from a recurring profile.
 * Returns data ready to be inserted into the invoices table.
 */
export function generateRecurringInvoice(
  profile: RecurringProfile,
  invoiceNumber: string
): InvoiceData {
  const issueDate = profile.next_run
    ? new Date(profile.next_run)
    : new Date()

  const dueDateOffset = getDueDateFrequency(profile.frequency)
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + dueDateOffset)

  const items = (profile.template_items || []).map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
    sort_order: index,
  }))

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )
  const vat_total = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price * (item.vat_rate / 100),
    0
  )
  const total = subtotal + vat_total

  return {
    invoice_number: invoiceNumber,
    type: 'recurring',
    status: profile.auto_send ? 'sent' : 'draft',
    issue_date: issueDate.toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    payment_terms: dueDateOffset,
    notes: profile.template_notes || null,
    subtotal: Math.round(subtotal * 100) / 100,
    vat_total: Math.round(vat_total * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: profile.template_currency || 'EUR',
    items,
  }
}

// ─── Currency Helpers ────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
  CAD: 'C$',
  AUD: 'A$',
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? '€'
  return `${sym}${amount.toFixed(2)}`
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? '€'
}

// ─── Date Formatting ────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

// ─── Status Helpers ─────────────────────────────────────────────────────────

export function isDueSoon(nextRun: string | null): boolean {
  if (!nextRun) return false
  const diff = new Date(nextRun).getTime() - Date.now()
  const days = diff / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 3
}

export function isOverdue(nextRun: string | null): boolean {
  if (!nextRun) return false
  return new Date(nextRun).getTime() < Date.now()
}