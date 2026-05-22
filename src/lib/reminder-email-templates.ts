// =============================================
// INVOICEGEN — MULTI-TIER REMINDER EMAIL TEMPLATES
// =============================================
// 3 tiers: gentle (Day 1), firm (Day 7), final (Day 14)
// All emails: inline styles, payment link button, <300 words
// =============================================

export type ReminderType = 'gentle' | 'firm' | 'final'

export interface ReminderTemplate {
  type: ReminderType
  subject: string
  body: string  // raw text with {placeholders}
}

export type ReminderData = {
  client_name: string
  client_email: string
  invoice_number: string
  amount: string          // e.g. "€1,250.00"
  amount_raw: number      // raw number for button
  currency_symbol: string
  company_name: string
  company_email: string
  company_logo?: string
  issue_date: string      // formatted: "21 May 2026"
  due_date: string        // formatted: "21 May 2026"
  days_overdue: number
  payment_link: string
  payment_terms_text: string
  payment_terms_days: number
}

// ─── PLACEHOLDER REPLACEMENT ────────────────────────────────────────────────

export function replacePlaceholders(template: ReminderTemplate, data: ReminderData): {
  subject: string
  body: string
} {
  const replacements: Record<string, string | number> = {
    '{client_name}': data.client_name,
    '{invoice_number}': data.invoice_number,
    '{amount}': data.amount,
    '{amount_raw}': data.amount_raw,
    '{currency_symbol}': data.currency_symbol,
    '{company_name}': data.company_name,
    '{company_email}': data.company_email,
    '{issue_date}': data.issue_date,
    '{due_date}': data.due_date,
    '{days_overdue}': data.days_overdue,
    '{payment_link}': data.payment_link,
    '{payment_terms_text}': data.payment_terms_text,
    '{payment_terms_days}': data.payment_terms_days,
  }

  const replace = (text: string) =>
    Object.entries(replacements).reduce(
      (acc, [key, val]) => acc.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(val)),
      text
    )

  return { subject: replace(template.subject), body: replace(template.body) }
}

// ─── CURRENCY FORMATTING HELPERS ────────────────────────────────────────────

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', CAD: 'C$', AUD: 'A$' }
  const sym = symbols[currency] ?? currency + ' '
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── REMINDER TEMPLATES ─────────────────────────────────────────────────────

export const REMINDER_TEMPLATES: Record<ReminderType, ReminderTemplate> = {
  gentle: {
    type: 'gentle',
    subject: 'Quick reminder: Invoice #{invoice_number} is due',
    body: `Hi {client_name},

Just a gentle reminder that invoice #{invoice_number} for {amount} from {company_name} is now due.

No worries if you've already paid — feel free to ignore this. If not, paying is quick and easy:

{message_action}

If you have any questions, just reply to this email — we're happy to help.

Best regards,
{company_name}
{company_email}`,
  },

  firm: {
    type: 'firm',
    subject: 'Invoice #{invoice_number} is overdue — please arrange payment',
    body: `Dear {client_name},

This is a follow-up regarding invoice #{invoice_number} for {amount} issued on {issue_date}. The payment was originally due on {due_date} and is now {days_overdue} days overdue.

Our records show this invoice remains unpaid. Please arrange payment at your earliest convenience:

{message_action}

If you believe this has been paid, or if you have a question or dispute about this invoice, please let us know by replying to this email — we aim to resolve all queries quickly.

We appreciate your prompt attention to this matter.

Kind regards,
{company_name}
{company_email}`,
  },

  final: {
    type: 'final',
    subject: 'FINAL NOTICE: Invoice #{invoice_number} overdue — action required',
    body: `Dear {client_name},

This is our final notice regarding overdue invoice #{invoice_number} ({amount}) from {company_name}.

This invoice was issued on {issue_date} with payment terms of {payment_terms_text}. Despite previous reminders, payment has not been received.

Please settle this outstanding invoice within the next 7 days:

{message_action}

If payment is not received within 7 days, we reserve the right to:
• Suspend services or future orders
• Engage a third-party collection agency
• Take legal action to recover the outstanding amount

If you are experiencing financial difficulty or believe this notice has been sent in error, please contact us immediately so we can resolve this matter.

{company_name}
{company_email}`,
  },
}

// ─── HTML EMAIL RENDERER ─────────────────────────────────────────────────────
// Produces email-safe HTML with inline styles (Gmail/Outlook/Apple Mail safe)

export type RenderEmailOptions = {
  template: ReminderTemplate
  data: ReminderData
}

export function renderReminderEmail({ template, data }: RenderEmailOptions): {
  subject: string
  html: string
} {
  const { subject, body } = replacePlaceholders(template, data)

  // Replace {message_action} placeholder with the HTML button
  const payButtonHtml = `
  <a href="${data.payment_link}"
     style="display:inline-block;background:#10b981;color:#ffffff;font-weight:700;
            padding:16px 40px;border-radius:100px;text-decoration:none;
            font-size:16px;letter-spacing:0.3px;">
    Pay Now &middot; ${data.amount}
  </a>`

  // Replace text button placeholder
  const textBody = body.replace('{message_action}', `
Click the button below to pay:
${data.payment_link}
`.trim())

  const htmlBody = body.replace('{message_action}', `
<div style="text-align:center;margin:28px 0;">
  ${payButtonHtml}
</div>
`)

  // Choose background tint by tier
  const accentBg: Record<ReminderType, string> = {
    gentle: '#f0fdf4',
    firm:   '#fef3c7',
    final:  '#fef2f2',
  }
  const accentBorder: Record<ReminderType, string> = {
    gentle: '#bbf7d0',
    firm:   '#fde68a',
    final:  '#fecaca',
  }
  const accentColor: Record<ReminderType, string> = {
    gentle: '#166534',
    firm:   '#92400e',
    final:  '#991b1b',
  }

  const bg       = accentBg[template.type]
  const border   = accentBorder[template.type]
  const textAccent = accentColor[template.type]

  const wordCount = body.split(/\s+/).filter(Boolean).length

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica Neue,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="background:#09090b;padding:24px 32px;border-radius:12px 12px 0 0;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                ${data.company_name}
              </p>
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-top:4px solid #10b981;">

              <!-- Subject / greeting -->
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;line-height:1.3;">
                ${subject}
              </h1>

              <!-- Accent box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:${bg};border-left:4px solid ${border};border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${textAccent};">
                      Invoice #${data.invoice_number}
                    </p>
                    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#09090b;">
                      ${data.amount}
                    </p>
                    <p style="margin:0;font-size:13px;color:#52525b;">
                      Due date: <strong>${data.due_date}</strong>
                      ${data.days_overdue > 0 ? ` &nbsp;|&nbsp;  <span style="color:${textAccent};font-weight:700;">${data.days_overdue} day${data.days_overdue === 1 ? '' : 's'} overdue</span>` : ''}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body text (multi-line, preserves whitespace) -->
              <div style="font-size:15px;color:#3f3f46;line-height:1.7;white-space:pre-wrap;">
${textBody.replace(/^/gm, '                ')}
              </div>

              <!-- Pay button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${data.payment_link}"
                   style="display:inline-block;background:#10b981;color:#ffffff;font-weight:700;
                          padding:16px 40px;border-radius:100px;text-decoration:none;
                          font-size:16px;letter-spacing:0.3px;">
                  Pay Now &nbsp;&middot;&nbsp; ${data.amount}
                </a>
              </div>

              <!-- Note if overdue -->
              ${data.days_overdue > 0 ? `
              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                This invoice is <strong>${data.days_overdue} day${data.days_overdue === 1 ? '' : 's'}</strong> overdue.
                ${template.type === 'final' ? ' Please resolve within 7 days to avoid further action.' : ' Please arrange payment as soon as possible.'}
              </p>` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;">
                ${data.company_name} &nbsp;&middot;&nbsp; ${data.company_email}
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Powered by InvoiceGen &nbsp;&middot;&nbsp; <a href="#" style="color:#10b981;text-decoration:none;">View invoice</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

// ─── PLAIN-TEXT FALLBACK EMAIL ───────────────────────────────────────────────

export function renderReminderText({ template, data }: RenderEmailOptions): string {
  const { subject, body } = replacePlaceholders(template, data)
  const payButtonHtml = body.replace('{message_action}', `
Pay online: ${data.payment_link}
`.trim())

  return `${subject.toUpperCase()}
${'='.repeat(subject.length)}

${payButtonHtml}

---
${data.company_name}
${data.company_email}
InvoiceGen`
}

// ─── LOAD TEMPLATE ───────────────────────────────────────────────────────────

export function getTemplate(type: ReminderType): ReminderTemplate {
  return REMINDER_TEMPLATES[type]
}