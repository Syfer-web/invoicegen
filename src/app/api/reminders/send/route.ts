import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/reminders/send — manual trigger (called by button in UI or by external scheduler)
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer()

    // Get all companies with reminder_settings enabled
    const { data: settings } = await supabase
      .from('reminder_settings')
      .select('*, companies(id, name, user_id)')
      .eq('enabled', true)
      .eq('auto_reminders', true)

    if (!settings || settings.length === 0) {
      return NextResponse.json({ message: 'No reminder settings found', sent: 0 })
    }

    const today = new Date().toISOString().split('T')[0]
    let totalSent = 0
    const results: { company: string; reminders: string[] }[] = []

    for (const setting of settings) {
      const companyId = (setting.companies as any)?.id
      if (!companyId) continue

      // Get overdue invoices that haven't been reminded recently
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, clients(name, email)')
        .eq('company_id', companyId)
        .in('status', ['sent', 'overdue'])
        .neq('status', 'paid')
        .neq('status', 'cancelled')

      if (!invoices) continue

      const companyResults: string[] = []

      for (const invoice of invoices) {
        const dueDate = invoice.due_date
        const daysOverdue = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))

        // Check which reminders we've already sent
        const { data: existingReminders } = await supabase
          .from('sent_reminders')
          .select('reminder_type')
          .eq('invoice_id', invoice.id)

        const sentTypes = new Set((existingReminders || []).map(r => r.reminder_type))

        // Determine what reminder to send
        let reminderType: string | null = null
        let subject = ''
        let message = ''

        if (daysOverdue >= setting.final_reminder_days && !sentTypes.has('final_reminder')) {
          reminderType = 'final_reminder'
          subject = `Final Reminder: Invoice ${invoice.invoice_number} is ${Math.abs(daysOverdue)} days overdue`
          message = `Dear ${(invoice.clients as any)?.name || 'Client'},\n\nThis is a final reminder that invoice ${invoice.invoice_number} for ${invoice.currency}${invoice.total} was due on ${dueDate} and is now ${Math.abs(daysOverdue)} days overdue.\n\nPlease arrange payment immediately to avoid further action.\n\nBest regards`
        } else if (daysOverdue >= setting.second_reminder_days && !sentTypes.has('second_reminder')) {
          reminderType = 'second_reminder'
          subject = `Reminder: Invoice ${invoice.invoice_number} is overdue`
          message = `Dear ${(invoice.clients as any)?.name || 'Client'},\n\nJust a reminder that invoice ${invoice.invoice_number} for ${invoice.currency}${invoice.total} was due on ${dueDate} and is now ${Math.abs(daysOverdue)} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nBest regards`
        } else if (daysOverdue >= setting.first_reminder_days && !sentTypes.has('first_reminder')) {
          reminderType = 'first_reminder'
          subject = `Payment Reminder: Invoice ${invoice.invoice_number}`
          message = `Dear ${(invoice.clients as any)?.name || 'Client'},\n\nWe wanted to remind you that invoice ${invoice.invoice_number} for ${invoice.currency}${invoice.total} was due on ${dueDate}.\n\nIf you have already paid, please disregard this message. Otherwise, please arrange payment at your earliest convenience.\n\nBest regards`
        } else if (daysOverdue >= 1 && !sentTypes.has('overdue')) {
          reminderType = 'overdue'
          subject = `Invoice ${invoice.invoice_number} is due today`
          message = `Dear ${(invoice.clients as any)?.name || 'Client'},\n\nThis is a reminder that invoice ${invoice.invoice_number} for ${invoice.currency}${invoice.total} is due today (${dueDate}).\n\nPlease arrange payment at your earliest convenience.\n\nBest regards`
        } else if (daysOverdue < 0 && Math.abs(daysOverdue) <= setting.due_soon_days && !sentTypes.has('due_soon')) {
          reminderType = 'due_soon'
          subject = `Upcoming: Invoice ${invoice.invoice_number} due in ${Math.abs(daysOverdue)} days`
          message = `Dear ${(invoice.clients as any)?.name || 'Client'},\n\nThis is a friendly reminder that invoice ${invoice.invoice_number} for ${invoice.currency}${invoice.total} is due in ${Math.abs(daysOverdue)} days (${dueDate}).\n\nPlease ensure funds are arranged.\n\nBest regards`
        }

        if (reminderType) {
          const clientEmail = (invoice.clients as any)?.email
          if (clientEmail) {
            // Send email via Resend
            const resendKey = process.env.RESEND_API_KEY
            if (resendKey) {
              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'InvoiceGen <noreply@invoicegen.app>',
                  to: [clientEmail],
                  subject,
                  text: message,
                }),
              })

              if (emailRes.ok) {
                // Log the reminder
                await supabase.from('sent_reminders').insert({
                  invoice_id: invoice.id,
                  reminder_type: reminderType,
                })

                // Update invoice status to overdue if past due
                if (daysOverdue > 0 && invoice.status === 'sent') {
                  await supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoice.id)
                }

                companyResults.push(`${invoice.invoice_number} → ${reminderType}`)
                totalSent++
              }
            }
          }
        }
      }

      if (companyResults.length > 0) {
        results.push({ company: (setting.companies as any)?.name || 'Unknown', reminders: companyResults })
      }
    }

    return NextResponse.json({
      message: `Sent ${totalSent} reminders`,
      total: totalSent,
      results,
    })

  } catch (error: any) {
    console.error('Reminder error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/reminders/send — check what reminders are pending (no send)
export async function GET() {
  try {
    const supabase = await getSupabaseServer()

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(name, email), companies(name)')
      .in('status', ['sent', 'overdue'])
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
      .limit(50)

    const pending: {
      invoice_number: string
      client: string
      email: string
      company: string
      total: number
      currency: string
      due_date: string
      days_overdue: number
      status: string
    }[] = []

    const today = new Date().toISOString().split('T')[0]

    for (const inv of (invoices || [])) {
      const daysOverdue = Math.floor((new Date(today).getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
      pending.push({
        invoice_number: inv.invoice_number,
        client: (inv.clients as any)?.name || 'Unknown',
        email: (inv.clients as any)?.email || '',
        company: (inv.companies as any)?.name || '',
        total: inv.total,
        currency: inv.currency,
        due_date: inv.due_date,
        days_overdue: daysOverdue,
        status: inv.status,
      })
    }

    return NextResponse.json({ pending })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}