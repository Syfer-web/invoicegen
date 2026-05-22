import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import {
  ReminderType,
  ReminderData,
  getTemplate,
  renderReminderEmail,
  renderReminderText,
  formatCurrency,
  formatDate,
} from '@/lib/reminder-email-templates'

export const dynamic = 'force-dynamic'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type InvoiceRow = {
  id: string
  invoice_number: string
  status: string
  total: number
  currency: string
  issue_date: string
  due_date: string
  payment_terms: number
  payment_terms_text?: string
  stripe_payment_link_url?: string
  clients: { name: string; email: string } | null
  companies: {
    id: string
    name: string
    email: string
    logo_url?: string
  } | null
}

// ─── HELPER: Fetch and validate invoice ──────────────────────────────────────

async function loadInvoice(supabase: Awaited<ReturnType<typeof getSupabaseServer>>, invoiceId: string): Promise<InvoiceRow | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      status,
      total,
      currency,
      issue_date,
      due_date,
      payment_terms,
      payment_terms_text,
      stripe_payment_link_url,
      clients:client_id(name, email),
      companies:company_id(name, email, logo_url)
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !data) return null
  return data as unknown as InvoiceRow
}

// ─── HELPER: Check whether this reminder type was already sent ────────────────

async function wasAlreadySent(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  invoiceId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const { data } = await supabase
    .from('sent_reminders')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('reminder_type', reminderType)
    .limit(1)

  return (data?.length ?? 0) > 0
}

// ─── HELPER: Days overdue ─────────────────────────────────────────────────────

function daysOverdue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── HELPER: Resend email ─────────────────────────────────────────────────────

async function sendEmailViaResend(params: {
  to: string
  subject: string
  html: string
  text: string
  fromName: string
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error('RESEND_API_KEY is not configured')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${params.fromName} <reminders@invoicegen.app>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any)?.message ?? `Resend API error: ${res.status}`)
  }
}

// ─── HELPER: Log sent reminder ────────────────────────────────────────────────

async function logReminder(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  invoiceId: string,
  reminderType: ReminderType
): Promise<void> {
  await supabase.from('sent_reminders').insert({
    invoice_id: invoiceId,
    reminder_type: reminderType,
  })
}

// ─── HELPER: Update invoice status ───────────────────────────────────────────

async function updateInvoiceStatus(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  invoiceId: string,
  currentStatus: string
): Promise<void> {
  const due = new Date()
  due.setHours(0, 0, 0, 0)
  const overdue = due > new Date() && currentStatus === 'sent'
  if (overdue) {
    await supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoiceId)
  }
}

// ─── POST /api/reminders/send-single ──────────────────────────────────────────
// Body: { invoiceId: string; reminderType: 'gentle' | 'firm' | 'final' }

export async function POST(req: NextRequest) {
  try {
    // Parse + validate body
    const body = await req.json().catch(() => null)
    const { invoiceId, reminderType } = body ?? {}

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    const validTypes: ReminderType[] = ['gentle', 'firm', 'final']
    if (!reminderType || !validTypes.includes(reminderType)) {
      return NextResponse.json(
        { error: `reminderType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServer()

    // Load invoice
    const invoice = await loadInvoice(supabase, invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Prevent sending to paid/cancelled invoices
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot send reminder for invoice with status: ${invoice.status}` },
        { status: 422 }
      )
    }

    // Check if already sent
    const alreadySent = await wasAlreadySent(supabase, invoiceId, reminderType)
    if (alreadySent) {
      return NextResponse.json(
        { error: `A '${reminderType}' reminder has already been sent for this invoice` },
        { status: 409 }
      )
    }

    // Client validation
    const client = invoice.clients
    const company = invoice.companies
    if (!client?.email) {
      return NextResponse.json({ error: 'Invoice has no client email address' }, { status: 422 })
    }

    // Payment link
    const paymentLink = invoice.stripe_payment_link_url
    if (!paymentLink) {
      return NextResponse.json({ error: 'Invoice has no payment link — please create one first' }, { status: 422 })
    }

    // Build reminder data
    const data: ReminderData = {
      client_name: client.name || 'Valued Client',
      client_email: client.email,
      invoice_number: invoice.invoice_number,
      amount: formatCurrency(invoice.total, invoice.currency),
      amount_raw: invoice.total,
      currency_symbol: formatCurrency(0, invoice.currency).replace(/[\d,.]/g, '').trim(),
      company_name: company?.name ?? 'Our Company',
      company_email: company?.email ?? '',
      company_logo: company?.logo_url,
      issue_date: formatDate(invoice.issue_date),
      due_date: formatDate(invoice.due_date),
      days_overdue: daysOverdue(invoice.due_date),
      payment_link: paymentLink,
      payment_terms_text: invoice.payment_terms_text ?? `Net ${invoice.payment_terms}`,
      payment_terms_days: invoice.payment_terms,
    }

    // Render email
    const template = getTemplate(reminderType)
    const { subject, html } = renderReminderEmail({ template, data })
    const text = renderReminderText({ template, data })

    // Send email
    await sendEmailViaResend({
      to: client.email,
      subject,
      html,
      text,
      fromName: data.company_name,
    })

    // Log reminder
    await logReminder(supabase, invoiceId, reminderType)

    // Update invoice status if overdue
    await updateInvoiceStatus(supabase, invoiceId, invoice.status)

    return NextResponse.json({
      success: true,
      reminderType,
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      sentTo: client.email,
    })

  } catch (error: any) {
    console.error('[/api/reminders/send-single]', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}

// ─── GET /api/reminders/send-single ───────────────────────────────────────────
// Returns which reminder types are available for a given invoice
// Query params: ?invoiceId=uuid

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId query parameter is required' }, { status: 400 })
    }

    const supabase = await getSupabaseServer()
    const invoice = await loadInvoice(supabase, invoiceId)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch all sent reminders for this invoice
    const { data: sentRows } = await supabase
      .from('sent_reminders')
      .select('reminder_type, created_at')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })

    const sentTypes = new Set((sentRows ?? []).map(r => r.reminder_type))

    return NextResponse.json({
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      invoiceStatus: invoice.status,
      daysOverdue: daysOverdue(invoice.due_date),
      available: ['gentle', 'firm', 'final'].filter(t => !sentTypes.has(t)),
      sent: sentRows ?? [],
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}