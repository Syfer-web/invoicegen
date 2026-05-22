import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateRecurringInvoice, calculateNextRun } from '@/lib/recurring'

// POST /api/recurring/check-due
// Called by a cron job daily — finds all due profiles, generates invoices, updates next_run.
// Returns count of generated invoices.
// Optional auth: accepts a secret header (CRON_SECRET) in production.
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const providedSecret = request.headers.get('x-cron-secret')

    // In production, verify cron secret
    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all active profiles where next_run <= today
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('recurring_profiles')
      .select('*, clients(name, email), companies(name, email)')
      .eq('is_active', true)
      .lte('next_run', today.toISOString().split('T')[0])

    if (fetchError) {
      console.error('[check-due] fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        generated: 0,
        message: 'No due profiles found',
      })
    }

    const results: Array<{
      profile_id: string
      success: boolean
      invoice_id?: string
      error?: string
    }> = []

    const currencySymbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', CAD: 'C$', AUD: 'A$' }

    for (const profile of profiles) {
      try {
        // Generate invoice number
        const { data: invoiceNumber } = await supabaseAdmin
          .rpc('generate_invoice_number', { company_id: profile.company_id })

        const invoiceData = generateRecurringInvoice(
          profile,
          invoiceNumber || `INV-${Date.now()}`
        )

        // Create the invoice
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .insert({
            company_id: profile.company_id,
            client_id: profile.client_id,
            invoice_number: invoiceData.invoice_number,
            type: 'recurring',
            status: invoiceData.status,
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            payment_terms: invoiceData.payment_terms,
            notes: invoiceData.notes,
            subtotal: invoiceData.subtotal,
            vat_total: invoiceData.vat_total,
            total: invoiceData.total,
            currency: invoiceData.currency,
            sent_at: invoiceData.status === 'sent' ? new Date().toISOString() : null,
          })
          .select()
          .single()

        if (invoiceError) {
          results.push({ profile_id: profile.id, success: false, error: invoiceError.message })
          continue
        }

        // Insert invoice items
        if (invoiceData.items.length > 0) {
          await supabaseAdmin
            .from('invoice_items')
            .insert(
              invoiceData.items.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                vat_rate: item.vat_rate,
                sort_order: item.sort_order,
              }))
            )
        }

        // Calculate and update next_run
        const runDate = profile.next_run ? new Date(profile.next_run) : new Date()
        const nextRun = calculateNextRun(runDate, profile.frequency)

        await supabaseAdmin
          .from('recurring_profiles')
          .update({
            next_run: nextRun.toISOString().split('T')[0],
            last_generated: new Date().toISOString(),
          })
          .eq('id', profile.id)

        // Send email if auto_send
        if (profile.auto_send && profile.clients && profile.companies) {
          const sym = currencySymbols[invoiceData.currency] || '€'
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

          await fetch(`${appUrl}/api/invoices/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice: {
                ...invoiceData,
                company_email: profile.companies.email,
                items: invoiceData.items,
              },
              clientEmail: profile.clients.email,
              clientName: profile.clients.name,
              companyName: profile.companies.name,
              currencySymbol: sym,
            }),
          })
        }

        results.push({ profile_id: profile.id, success: true, invoice_id: invoice.id })
      } catch (err: any) {
        console.error(`[check-due] profile ${profile.id} error:`, err)
        results.push({ profile_id: profile.id, success: false, error: err.message })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      generated: successCount,
      total: profiles.length,
      results,
    })
  } catch (error: any) {
    console.error('[check-due]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check due recurring invoices' },
      { status: 500 }
    )
  }
}