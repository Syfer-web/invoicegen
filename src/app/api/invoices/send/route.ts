import { NextResponse } from 'next/server'
import type { Invoice } from '@/types/invoice'

export async function POST(request: Request) {
  try {
    const { invoice, paymentLinkUrl, clientEmail, clientName, companyName, currencySymbol } = await request.json()

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json(
        { error: 'Resend is not configured yet. Add RESEND_API_KEY to .env.local' },
        { status: 503 }
      )
    }

    // Build email HTML
    const invoiceType = invoice.type === 'proforma' ? 'Proforma Invoice' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'
    const lines = invoice.items.map((item: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${item.description || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${currencySymbol}${item.unit_price.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${item.vat_rate}%</td>
        <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;">${currencySymbol}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`
    ).join('')

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px;color:#000;">
      <div style="border-bottom:1px solid #e5e5e5;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-size:24px;font-weight:700;margin:0;">${invoiceType}</h1>
        <p style="color:#666;margin:4px 0 0;">#${invoice.invoice_number}</p>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
        <div>
          <p style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a0a0a0;margin:0 0 6px;">From</p>
          <p style="font-weight:600;margin:0;">${companyName}</p>
          <p style="color:#666;font-size:14px;margin:2px 0;">${invoice.company_email || ''}</p>
        </div>
        <div>
          <p style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a0a0a0;margin:0 0 6px;">Bill to</p>
          <p style="font-weight:600;margin:0;">${clientName}</p>
          <p style="color:#666;font-size:14px;margin:2px 0;">${clientEmail}</p>
        </div>
      </div>

      <div style="display:flex;gap:32px;margin-bottom:32px;">
        <div>
          <p style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a0a0a0;margin:0 0 4px;">Issue date</p>
          <p style="font-size:13px;font-weight:500;">${new Date(invoice.issue_date).toLocaleDateString('en-GB', { day:'2-digit',month:'long',year:'numeric' })}</p>
        </div>
        <div>
          <p style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a0a0a0;margin:0 0 4px;">Due date</p>
          <p style="font-size:13px;font-weight:500;">${new Date(invoice.due_date).toLocaleDateString('en-GB', { day:'2-digit',month:'long',year:'numeric' })}</p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;color:#666;text-transform:uppercase;">Description</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:#666;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:#666;text-transform:uppercase;">Unit price</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:#666;text-transform:uppercase;">VAT</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:#666;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${lines}</tbody>
      </table>

      <div style="text-align:right;margin-bottom:32px;">
        <p style="font-size:13px;color:#666;">Subtotal: <strong>${currencySymbol}${(invoice.subtotal || 0).toFixed(2)}</strong></p>
        <p style="font-size:13px;color:#666;">VAT/BTW: <strong>${currencySymbol}${(invoice.vat_total || 0).toFixed(2)}</strong></p>
        <p style="font-size:18px;font-weight:700;padding-top:8px;border-top:1.5px solid #000;">Total: ${currencySymbol}${(invoice.total || 0).toFixed(2)}</p>
      </div>

      ${paymentLinkUrl ? `
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${paymentLinkUrl}" style="display:inline-block;background:#10b981;color:#000;font-weight:600;padding:14px 32px;border-radius:100px;text-decoration:none;font-size:15px;">
          Pay now · ${currencySymbol}${(invoice.total || 0).toFixed(2)}
        </a>
        <p style="color:#666;font-size:12px;margin-top:12px;">Secure payment via Stripe · InvoiceGen</p>
      </div>
      ` : ''}

      ${invoice.notes ? `
      <div style="border-top:1px solid #e5e5e5;padding-top:20px;">
        <p style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a0a0a0;margin:0 0 6px;">Notes</p>
        <p style="font-size:13px;color:#404040;white-space:pre-line;">${invoice.notes}</p>
      </div>
      ` : ''}

      <div style="border-top:1px solid #e5e5e5;margin-top:40px;padding-top:16px;text-align:center;">
        <p style="font-size:11px;color:#a0a0a0;">${companyName} · Powered by InvoiceGen</p>
      </div>
    </body>
    </html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${companyName} < invoices@invoicegen.app >`,
        to: [clientEmail],
        subject: `${invoiceType} #${invoice.invoice_number} from ${companyName}`,
        html,
      }),
    })

    if (!emailRes.ok) {
      const data = await emailRes.json()
      throw new Error(data.message || 'Failed to send email')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[send-invoice]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice' },
      { status: 500 }
    )
  }
}