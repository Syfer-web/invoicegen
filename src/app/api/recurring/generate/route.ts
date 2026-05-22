import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateRecurringInvoice, calculateNextRun } from '@/lib/recurring'

// POST /api/recurring/generate
// Generates an invoice from a recurring profile and optionally sends it.
// Body: { profileId: string }
export async function POST(request: Request) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('recurring_profiles')
      .select('*, clients(name, email)')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get company details for sending
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, email')
      .eq('id', profile.company_id)
      .single()

    // Generate invoice number using DB function
    const { data: invoiceNumber } = await supabaseAdmin
      .rpc('generate_invoice_number', { company_id: profile.company_id })

    const invoiceData = generateRecurringInvoice(profile, invoiceNumber || `INV-${Date.now()}`)

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
      console.error('[recurring/generate] invoice error:', invoiceError)
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    // Insert invoice items
    if (invoiceData.items.length > 0) {
      const { error: itemsError } = await supabaseAdmin
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

      if (itemsError) {
        console.error('[recurring/generate] items error:', itemsError)
      }
    }

    // Update next_run and last_generated on the profile
    const nextRun = calculateNextRun(
      profile.next_run ? new Date(profile.next_run) : new Date(),
      profile.frequency
    )

    await supabaseAdmin
      .from('recurring_profiles')
      .update({
        next_run: nextRun.toISOString().split('T')[0],
        last_generated: new Date().toISOString(),
      })
      .eq('id', profile.id)

    // Send email if auto_send is enabled
    if (profile.auto_send && company && profile.clients) {
      const currencySymbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', CAD: 'C$', AUD: 'A$' }
      const sym = currencySymbols[invoiceData.currency] || '€'

      try {
        const { data: resendKey } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', company.id)
          .single()

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice: {
              ...invoiceData,
              company_email: company.email,
              items: invoiceData.items,
            },
            clientEmail: profile.clients.email,
            clientName: profile.clients.name,
            companyName: company.name,
            currencySymbol: sym,
          }),
        })
      } catch (emailError) {
        console.error('[recurring/generate] email error:', emailError)
        // Don't fail the whole operation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceData.invoice_number,
      status: invoiceData.status,
      total: invoiceData.total,
    })
  } catch (error: any) {
    console.error('[recurring/generate]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate recurring invoice' },
      { status: 500 }
    )
  }
}