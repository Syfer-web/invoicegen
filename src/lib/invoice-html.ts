// =============================================
// INVOICE HTML TEMPLATE GENERATORS
// Pure string HTML versions of all 10 React templates
// Use inline CSS, web-safe fonts
// =============================================

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS, Currency } from '@/types/invoice'

// =============================================
// HELPERS
// =============================================

function formatDate(d: string, long = false): string {
  if (!d) return ''
  try {
    return long
      ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

function itemRows(invoice: Invoice, s: string, extraTdAttrs = ''): string {
  return invoice.items
    .filter(i => i.description)
    .map(item => `
    <tr>
      <td style="padding:14px 20px;font-size:14px"${extraTdAttrs}>${item.description}</td>
      <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${item.quantity}</td>
      <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
      <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${item.vat_rate}%</td>
      <td style="padding:14px 20px;font-size:14px;font-weight:600;text-align:right">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
    </tr>`)
    .join('')
}

function filterBool<T>(arr: (T | null | false | undefined)[]): T[] {
  return arr.filter(Boolean) as T[]
}

// =============================================
// MODERN
// Clean, contemporary, sans-serif, generous whitespace
// =============================================

export function renderModernHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = invoice.accent_color || '#10b981'

  const typeLabel = invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'

  const metaItems = filterBool([
    { label: 'Issue Date', value: formatDate(invoice.issue_date) },
    { label: 'Due Date', value: formatDate(invoice.due_date) },
    invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
  ])

  const subtotal = `${s}${(invoice.subtotal || 0).toFixed(2)}`
  const discount = invoice.discount_amount ? `-${s}${(invoice.discount_amount || 0).toFixed(2)}` : null
  const vat = invoice.vat_total ? `${s}${(invoice.vat_total || 0).toFixed(2)}` : null

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fff;min-height:100%;padding:48px;color:#111">
  <div style="background:${accent};border-radius:16px;padding:32px;margin-bottom:40px;display:flex;justify-content:space-between;align-items:center">
    <div>
      ${invoice.company?.name ? `<div style="font-size:22px;font-weight:800;color:#fff">${invoice.company.name}</div>` : ''}
      <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px">${invoice.company?.email || ''}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-0.03em">${typeLabel}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px">#${invoice.invoice_number}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px">
    <div>
      <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Bill to</div>
      <div style="font-size:16px;font-weight:700">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:13px;color:#666">${invoice.client.company}</div>` : ''}
      <div style="font-size:12px;color:#888;margin-top:6px">${invoice.client.email}</div>
      ${invoice.client.address ? `<div style="font-size:12px;color:#888;margin-top:2px">${invoice.client.address}</div>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      ${metaItems.map(item => `<div>
        <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${item.label}</div>
        <div style="font-size:14px;color:#111">${item.value}</div>
      </div>`).join('')}
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="border-bottom:2px solid #f0f0f0">
        ${['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:0 16px 12px 0;font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr style="border-bottom:1px solid #f5f5f5">
        <td style="padding:16px 16px 16px 0;font-size:14px">${item.description}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right">${item.quantity}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right">${item.vat_rate}%</td>
        <td style="padding:16px 0;font-size:14px;font-weight:700;text-align:right">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="min-width:260px;background:#f9fafb;border-radius:12px;padding:20px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#888"><span>Subtotal</span><span>${subtotal}</span></div>
      ${discount ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:${accent}"><span>Discount</span><span>${discount}</span></div>` : ''}
      ${vat ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#888"><span>VAT</span><span>${vat}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:16px 0 0;margin-top:8px;border-top:2px solid ${accent};font-size:22px;font-weight:800;color:${accent}">
        <span>Total</span><span>${s}${(invoice.total || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:40px;padding:20px;background:#f9fafb;border-radius:12px">
    <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Notes</div>
    <div style="font-size:13px;color:#666;line-height:1.6">${invoice.notes}</div>
  </div>` : ''}
</div>`
}

// =============================================
// CLASSIC
// Traditional, formal, serif typography
// Colors: navy #1a365d, cream bg #faf8f5
// =============================================

export function renderClassicHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'

  const typeLabel = invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'

  const metaItems = filterBool([
    { label: 'Issue Date', value: formatDate(invoice.issue_date, true) },
    { label: 'Due Date', value: formatDate(invoice.due_date, true) },
    { label: 'Payment Terms', value: `${invoice.payment_terms} days` },
    invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
  ])

  const subtotal = `${s}${(invoice.subtotal || 0).toFixed(2)}`
  const discount = invoice.discount_amount ? { label: 'Discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}` } : null

  return `<div style="font-family:Georgia,serif;background:#faf8f5;min-height:100%;padding:40px 48px;color:#1a1a1a">
  <div style="border-bottom:3px solid #1a365d;padding-bottom:24px;margin-bottom:32px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        ${invoice.company?.name ? `<div style="font-size:24px;font-weight:700;color:#1a365d;letter-spacing:-0.02em">${invoice.company.name}</div>` : ''}
        <div style="font-size:12px;color:#666;margin-top:4px;line-height:1.6">
          ${invoice.company?.address ? `${invoice.company.address}<br>` : ''}
          ${invoice.company?.city ? invoice.company.city : ''}
          ${invoice.company?.email ? ` · ${invoice.company.email}` : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:28px;font-weight:700;color:#1a365d;letter-spacing:0.05em;text-transform:uppercase">${typeLabel}</div>
        <div style="font-size:13px;color:#888;margin-top:6px">#${invoice.invoice_number}</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:32px">
    <div>
      <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:4px">Bill To</div>
      <div style="font-size:14px;font-weight:600">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:13px;color:#555">${invoice.client.company}</div>` : ''}
      <div style="font-size:12px;color:#666;margin-top:4px;line-height:1.5">
        ${invoice.client.email}
        ${invoice.client.address ? `<br>${invoice.client.address}` : ''}
        ${invoice.client.city ? `<br>${invoice.client.city}` : ''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-content:start">
      ${metaItems.map(item => `<div>
        <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">${item.label}</div>
        <div style="font-size:13px;color:#333">${item.value}</div>
      </div>`).join('')}
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="background:#1a365d;color:#fff">
        ${['Description', 'Qty', 'Unit Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map((item, idx) => `<tr style="border-bottom:1px solid #e8e4df">
        <td style="padding:12px;font-size:13px">${item.description}</td>
        <td style="padding:12px;font-size:12px;color:#555;text-align:right">${item.quantity}</td>
        <td style="padding:12px;font-size:12px;color:#555;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:12px;font-size:12px;color:#555;text-align:right">${item.vat_rate}%</td>
        <td style="padding:12px;font-size:13px;font-weight:600;text-align:right">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="min-width:240px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#555"><span>Subtotal</span><span>${subtotal}</span></div>
      ${discount ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#555"><span>Discount</span><span>${discount.value}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;border-top:2px solid #1a365d;margin-top:4px;font-size:18px;font-weight:700;color:#1a365d">
        <span>Total</span><span>${s}${(invoice.total || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:40px;padding-top:24px;border-top:1px solid #ddd">
    <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Notes</div>
    <div style="font-size:12px;color:#666;line-height:1.6">${invoice.notes}</div>
  </div>` : ''}
</div>`
}

// =============================================
// PROFESSIONAL
// Balanced, corporate-friendly, trustworthy
// Teal accent #0f766e, clean light background
// =============================================

export function renderProfessionalHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'

  const typeLabel = invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'

  const metaItems = filterBool([
    { label: 'Invoice No.', value: invoice.invoice_number },
    { label: 'Date', value: formatDate(invoice.issue_date) },
    { label: 'Due Date', value: formatDate(invoice.due_date) },
    invoice.project_ref ? { label: 'Reference', value: invoice.project_ref } : null,
  ])

  const filteredItems = invoice.items.filter(i => i.description)
  const lastIdx = filteredItems.length - 1

  const subtotal = `${s}${(invoice.subtotal || 0).toFixed(2)}`
  const discount = invoice.discount_amount ? `-${s}${(invoice.discount_amount || 0).toFixed(2)}` : null
  const vat = `${s}${(invoice.vat_total || 0).toFixed(2)}`

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;min-height:100%;padding:48px;color:#111">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 24px;border-bottom:2px solid #0f766e;margin-bottom:32px">
    <div style="font-size:20px;font-weight:700;color:#0f766e">${invoice.company?.name || 'Company Name'}</div>
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:8px;height:8px;border-radius:50%;background:#0f766e"></div>
      <span style="font-size:12px;color:#0f766e;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">${typeLabel}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px">
    <div>
      <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Bill To</div>
      <div style="font-size:15px;font-weight:600">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:13px;color:#64748b">${invoice.client.company}</div>` : ''}
      <div style="font-size:12px;color:#94a3b8;margin-top:4px">${invoice.client.email}</div>
      ${invoice.client.address ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${invoice.client.address}</div>` : ''}
    </div>
    <div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${metaItems.map(item => `<div>
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${item.label}</div>
          <div style="font-size:13px;color:#334155">${item.value}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px;background:#fff;border-radius:12px;overflow:hidden">
    <thead>
      <tr style="background:#0f766e">
        ${['Description', 'Qty', 'Unit Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:14px 20px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:0.05em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${filteredItems.map((item, idx) => `<tr style="border-bottom:${idx < lastIdx ? '1px solid #f1f5f9' : 'none'}">
        <td style="padding:14px 20px;font-size:14px">${item.description}</td>
        <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${item.quantity}</td>
        <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:14px 20px;font-size:13px;color:#64748b;text-align:right">${item.vat_rate}%</td>
        <td style="padding:14px 20px;font-size:14px;font-weight:600;text-align:right">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="min-width:240px;background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>Subtotal</span><span>${subtotal}</span></div>
      ${discount ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>Discount</span><span>${discount}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>Tax (VAT)</span><span>${vat}</span></div>
      <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:6px;border-top:2px solid #0f766e;font-size:18px;font-weight:700;color:#0f766e">
        <span>Total Due</span><span>${s}${(invoice.total || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:32px;font-size:12px;color:#94a3b8;line-height:1.6">${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// MINIMAL
// Ultra clean, maximum white space, essential content only
// =============================================

export function renderMinimalHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'

  const typeLabel = invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;min-height:100%;padding:64px;color:#111">
  <div style="display:flex;justify-content:space-between;margin-bottom:64px">
    <div>
      ${invoice.company?.name ? `<div style="font-size:16px;font-weight:600">${invoice.company.name}</div>` : ''}
      <div style="font-size:12px;color:#aaa;margin-top:4px">${invoice.company?.email || ''}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#333">${typeLabel}</div>
      <div style="font-size:12px;color:#aaa;margin-top:4px">#${invoice.invoice_number}</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:48px">
    <div>
      <div style="font-size:10px;font-weight:600;color:#ccc;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">To</div>
      <div style="font-size:15px;font-weight:600">${invoice.client.name}</div>
      <div style="font-size:12px;color:#aaa;margin-top:2px">${invoice.client.email}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#666">Issued ${formatDate(invoice.issue_date)} · Due ${formatDate(invoice.due_date)}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:48px">
    <thead>
      <tr>
        ${['Description', '', 'Amount'].map((h, i) => `<th style="padding:0 0 16px;font-size:10px;font-weight:600;color:#ccc;text-transform:uppercase;letter-spacing:0.1em;text-align:${i === 2 ? 'right' : 'left'};border-bottom:1px solid #f0f0f0">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr>
        <td style="padding:16px 0;font-size:14px;border-bottom:1px solid #f5f5f5">${item.description}</td>
        <td style="padding:16px 0;border-bottom:1px solid #f5f5f5"></td>
        <td style="padding:16px 0;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f5f5f5">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="text-align:right">
      <div style="font-size:10px;font-weight:600;color:#ccc;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Amount due</div>
      <div style="font-size:28px;font-weight:300;color:#111;letter-spacing:-0.03em">${s}${(invoice.total || 0).toFixed(2)}</div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:64px;padding-top:24px;border-top:1px solid #f0f0f0">
    <div style="font-size:11px;color:#aaa;line-height:1.8">${invoice.notes}</div>
  </div>` : ''}
</div>`
}

// =============================================
// BOLD
// Strong colored header, high contrast, makes a statement
// Red accent #dc2626, dark header
// =============================================

export function renderBoldHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = '#dc2626'

  const typeLabel = invoice.type === 'quote' ? 'QUOTE' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'

  const filteredItems = invoice.items.filter(i => i.description)

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fff;min-height:100%;color:#111">
  <div style="background:${accent};padding:40px 48px;margin-bottom:40px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.02em">${invoice.company?.name || 'Company Name'}</div>
      <div style="font-size:40px;font-weight:900;color:#fff;letter-spacing:-0.03em;opacity:0.9">${typeLabel}</div>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:16px">#${invoice.invoice_number} · Issued ${formatDate(invoice.issue_date)} · Due ${formatDate(invoice.due_date)}</div>
  </div>
  <div style="padding:0 48px 40px">
    <div style="margin-bottom:40px">
      <div style="font-size:10px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px">Bill To</div>
      <div style="font-size:22px;font-weight:800;color:#111">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:14px;color:#666;margin-top:2px">${invoice.client.company}</div>` : ''}
      <div style="font-size:13px;color:#888;margin-top:4px">${invoice.client.email}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
      <thead>
        <tr>
          ${['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:12px 16px;font-size:10px;font-weight:800;color:#fff;background:#111;text-transform:uppercase;letter-spacing:0.08em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${filteredItems.map((item, idx) => `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'}">
          <td style="padding:14px 16px;font-size:14px;font-weight:600">${item.description}</td>
          <td style="padding:14px 16px;font-size:13px;color:#666;text-align:right">${item.quantity}</td>
          <td style="padding:14px 16px;font-size:13px;color:#666;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
          <td style="padding:14px 16px;font-size:13px;color:#666;text-align:right">${item.vat_rate}%</td>
          <td style="padding:14px 16px;font-size:14px;font-weight:800;text-align:right">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end">
      <div style="min-width:240px;background:#111;border-radius:12px;padding:24px;text-align:right">
        <div style="font-size:11px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Total Due</div>
        <div style="font-size:36px;font-weight:900;color:${accent};letter-spacing:-0.03em">${s}${(invoice.total || 0).toFixed(2)}</div>
      </div>
    </div>
  </div>
  ${invoice.notes ? `<div style="padding:0 48px 40px">
    <div style="font-size:12px;color:#888;line-height:1.6">${invoice.notes}</div>
  </div>` : ''}
</div>`
}

// =============================================
// ELEGANT
// Refined and sophisticated, premium feel
// Purple accent #7c3aed, light lavender bg
// =============================================

export function renderElegantHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = '#7c3aed'

  const typeLabel = invoice.type === 'quote' ? 'Quote' : invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'

  return `<div style="font-family:Georgia,serif;background:#faf5ff;min-height:100%;padding:48px;color:#1a1a2e">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:24px;border-bottom:1px solid ${accent}33">
    <div>
      ${invoice.company?.name ? `<div style="font-size:20px;font-weight:400;color:#1a1a2e;font-style:italic">${invoice.company.name}</div>` : ''}
      <div style="font-size:11px;color:#888;margin-top:6px;letter-spacing:0.02em">${invoice.company?.email || ''}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:26px;font-weight:400;color:${accent};letter-spacing:0.08em;text-transform:uppercase">${typeLabel}</div>
      <div style="font-size:12px;color:#aaa;margin-top:6px">#${invoice.invoice_number}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px">
    <div>
      <div style="font-size:10px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px">Prepared for</div>
      <div style="font-size:16px;font-weight:400">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:13px;color:#888">${invoice.client.company}</div>` : ''}
      <div style="font-size:12px;color:#aaa;margin-top:6px">${invoice.client.email}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#888;line-height:2">
        <div>Issued: ${formatDate(invoice.issue_date, true)}</div>
        <div>Due: ${formatDate(invoice.due_date, true)}</div>
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr>
        ${['Description', 'Qty', 'Price', 'VAT', 'Amount'].map((h, i) => `<th style="padding:0 16px 12px 0;font-size:10px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.1em;text-align:${i >= 1 ? 'right' : 'left'};border-bottom:1px solid ${accent}22">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr style="border-bottom:1px solid ${accent}11">
        <td style="padding:16px 16px 16px 0;font-size:13px;font-style:italic">${item.description}</td>
        <td style="padding:16px 0;font-size:12px;color:#888;text-align:right">${item.quantity}</td>
        <td style="padding:16px 0;font-size:12px;color:#888;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:16px 0;font-size:12px;color:#888;text-align:right">${item.vat_rate}%</td>
        <td style="padding:16px 0;font-size:13px;text-align:right;font-style:italic">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="text-align:right;min-width:220px;padding:20px;background:${accent}0a;border-left:3px solid ${accent};border-radius:0 8px 8px 0">
      <div style="font-size:10px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Total Due</div>
      <div style="font-size:26px;font-weight:400;color:${accent}">${s}${(invoice.total || 0).toFixed(2)}</div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:48px;font-size:12px;color:#aaa;line-height:1.8;font-style:italic;border-top:1px solid ${accent}22;padding-top:20px">${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// TECH
// Grid layout, monospace elements, developer aesthetic
// Cyan accent #0891b2, dark background
// =============================================

export function renderTechHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = '#0891b2'

  const typeLabel = invoice.type === 'quote' ? '[QUOTE]' : invoice.type === 'credit_note' ? '[CREDIT_NOTE]' : '[INVOICE]'

  const metaItems = filterBool([
    { label: 'issue_date', value: formatDate(invoice.issue_date) },
    { label: 'due_date', value: formatDate(invoice.due_date) },
    { label: 'currency', value: invoice.currency },
    invoice.project_ref ? { label: 'ref', value: invoice.project_ref } : null,
  ])

  const subtotal = `${s}${(invoice.subtotal || 0).toFixed(2)}`
  const discount = invoice.discount_amount ? { label: 'discount', value: `-${s}${(invoice.discount_amount || 0).toFixed(2)}` } : null
  const vat = `${s}${(invoice.vat_total || 0).toFixed(2)}`

  return `<div style="font-family:monospace;background:#0d1117;min-height:100%;padding:40px;color:#c9d1d9">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid #30363d">
    <div>
      <div style="font-size:18px;font-weight:700;color:#58a6ff;letter-spacing:-0.01em">${invoice.company?.name || '// company'}</div>
      <div style="font-size:11px;color:#484f58;margin-top:4px">${invoice.company?.email || ''}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#484f58;margin-bottom:4px"><span style="color:${accent}">#</span>${invoice.invoice_number}</div>
      <div style="font-size:11px;color:#484f58">${typeLabel}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px">
    <div>
      <div style="font-size:10px;color:#484f58;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px"><span style="color:${accent}">$</span> bill_to</div>
      <div style="font-size:13px;color:#e6edf3">${invoice.client.name}</div>
      <div style="font-size:11px;color:#484f58">${invoice.client.company || invoice.client.email}</div>
    </div>
    <div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${metaItems.map(item => `<div>
          <div style="font-size:9px;color:#484f58;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">${item.label}</div>
          <div style="font-size:11px;color:#79c0ff">${item.value}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="border-bottom:1px solid #30363d">
        ${['description', 'qty', 'unit_price', 'vat', 'total'].map((h, i) => `<th style="padding:0 16px 10px 0;font-size:9px;font-weight:400;color:#484f58;text-transform:lowercase;letter-spacing:0.05em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr style="border-bottom:1px solid #21262d">
        <td style="padding:12px 16px 12px 0;font-size:12px;color:#c9d1d9">${item.description}</td>
        <td style="padding:12px 0;font-size:11px;color:#8b949e;text-align:right">${item.quantity}</td>
        <td style="padding:12px 0;font-size:11px;color:#8b949e;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:12px 0;font-size:11px;color:#8b949e;text-align:right">${item.vat_rate}%</td>
        <td style="padding:12px 0;font-size:11px;color:#e6edf3;text-align:right;font-weight:600">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="min-width:240px;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:16px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#8b949e"><span>subtotal</span><span>${subtotal}</span></div>
      ${discount ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#8b949e"><span>discount</span><span>${discount.value}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#8b949e"><span>vat</span><span>${vat}</span></div>
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;margin-top:8px;border-top:1px solid ${accent};font-size:16px;font-weight:700;color:${accent}">
        <span>total</span><span>${s}${(invoice.total || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:32px;font-size:11px;color:#484f58;line-height:1.8;padding-top:20px;border-top:1px solid #21262d">// ${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// PLAYFUL
// Friendly, approachable, rounded elements
// Pink accent #db2777
// =============================================

export function renderPlayfulHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = '#db2777'

  const typeLabel = invoice.type === 'quote' ? 'QUOTE ✨' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE 🎉'

  const filteredItems = invoice.items.filter(i => i.description)
  const lastIdx = filteredItems.length - 1

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fff0f8;min-height:100%;padding:40px;color:#111">
  <div style="background:#fff;border-radius:24px;padding:32px 40px;margin-bottom:32px;box-shadow:0 4px 24px rgba(219,39,119,0.08)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:22px;font-weight:800;color:${accent}">${invoice.company?.name || 'Company'}</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px">${invoice.company?.email || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="display:inline-block;background:${accent};color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;letter-spacing:0.05em">${typeLabel}</div>
        <div style="font-size:12px;color:#aaa;margin-top:6px">#${invoice.invoice_number}</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
    <div style="background:#fff;border-radius:16px;padding:20px 24px">
      <div style="font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Bill To 👋</div>
      <div style="font-size:16px;font-weight:700">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:13px;color:#888">${invoice.client.company}</div>` : ''}
      <div style="font-size:12px;color:#aaa;margin-top:4px">${invoice.client.email}</div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:20px 24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${[{ label: 'Issued', value: formatDate(invoice.issue_date) }, { label: 'Due', value: formatDate(invoice.due_date) }].map(item => `<div>
          <div style="font-size:10px;font-weight:700;color:#ccc;text-transform:uppercase;letter-spacing:0.08em">${item.label}</div>
          <div style="font-size:13px;font-weight:600;color:#333;margin-top:2px">${item.value}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <div style="background:#fff;border-radius:20px;overflow:hidden;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:${accent}15">
          ${['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:14px 20px;font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.08em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${filteredItems.map((item, idx) => `<tr style="border-bottom:${idx < lastIdx ? '1px solid #fdf2f8' : 'none'}">
          <td style="padding:16px 20px;font-size:14px;font-weight:600">${item.description}</td>
          <td style="padding:16px 20px;font-size:13px;color:#888;text-align:right">${item.quantity}</td>
          <td style="padding:16px 20px;font-size:13px;color:#888;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
          <td style="padding:16px 20px;font-size:13px;color:#888;text-align:right">${item.vat_rate}%</td>
          <td style="padding:16px 20px;font-size:14px;font-weight:800;text-align:right;color:${accent}">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div style="display:flex;justify-content:flex-end">
    <div style="background:${accent};border-radius:20px;padding:20px 32px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.08em">Total Due</div>
      <div style="font-size:28px;font-weight:900;color:#fff;margin-top:4px">${s}${(invoice.total || 0).toFixed(2)} 💸</div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:32px;background:#fff;border-radius:16px;padding:16px 20px;font-size:12px;color:#888;line-height:1.6">${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// EDITORIAL
// Magazine-style layout, strong typography hierarchy
// Dark accent #1e1e1e, off-white bg
// =============================================

export function renderEditorialHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'

  const bigLetter = invoice.type === 'quote' ? 'Q' : invoice.type === 'credit_note' ? 'CN' : 'I'
  const companyName = invoice.company?.name || 'Company Name'

  return `<div style="font-family:Georgia,serif;background:#f5f0eb;min-height:100%;padding:56px;color:#1e1e1e">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:56px;padding-bottom:32px;border-bottom:1px solid #1e1e1e">
    <div>
      <div style="font-size:13px;font-weight:400;color:#666;letter-spacing:0.02em;font-family:Arial,sans-serif;margin-bottom:8px">Invoice · ${companyName}</div>
      <div style="font-size:32px;font-weight:700;line-height:1.1;letter-spacing:-0.02em">${companyName}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:48px;font-weight:900;letter-spacing:-0.04em;line-height:1;color:#1e1e1e">${bigLetter}</div>
      <div style="font-size:12px;color:#888;font-family:Arial,sans-serif;margin-top:8px">${invoice.invoice_number}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:48px">
    <div>
      <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;margin-bottom:10px">Prepared for</div>
      <div style="font-size:22px;font-weight:700;line-height:1.2">${invoice.client.name}</div>
      ${invoice.client.company ? `<div style="font-size:15px;font-weight:400;color:#666;margin-top:2px">${invoice.client.company}</div>` : ''}
      <div style="font-size:13px;color:#999;margin-top:8px;font-family:Arial,sans-serif">${invoice.client.email}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#888;line-height:2.2;font-family:Arial,sans-serif">
        <div>Issued: <strong>${formatDate(invoice.issue_date, true)}</strong></div>
        <div>Due: <strong>${formatDate(invoice.due_date, true)}</strong></div>
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:40px">
    <thead>
      <tr style="border-bottom:2px solid #1e1e1e">
        ${['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:0 16px 12px 0;font-size:9px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.12em;text-align:${i >= 1 ? 'right' : 'left'};font-family:Arial,sans-serif">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr style="border-bottom:1px solid #ddd">
        <td style="padding:16px 16px 16px 0;font-size:15px;font-weight:400">${item.description}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right;font-family:Arial,sans-serif">${item.quantity}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right;font-family:Arial,sans-serif">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:16px 0;font-size:13px;color:#888;text-align:right;font-family:Arial,sans-serif">${item.vat_rate}%</td>
        <td style="padding:16px 0;font-size:14px;font-weight:600;text-align:right;font-family:Arial,sans-serif">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-bottom:48px">
    <div style="text-align:right;border-top:3px solid #1e1e1e;padding-top:16px;min-width:200px">
      <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif">Amount Due</div>
      <div style="font-size:36px;font-weight:900;letter-spacing:-0.03em;margin-top:4px">${s}${(invoice.total || 0).toFixed(2)}</div>
    </div>
  </div>
  ${invoice.notes ? `<div style="border-top:1px solid #ddd;padding-top:32px;font-size:13px;color:#888;line-height:1.8;font-family:Arial,sans-serif">${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// CREATIVE
// Asymmetric layout, vibrant accents
// Amber accent #d97706
// =============================================

export function renderCreativeHTML(invoice: Invoice): string {
  const s = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'
  const accent = '#d97706'

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fffbf0;min-height:100%;padding:40px;color:#111">
  <div style="display:grid;grid-template-columns:1fr auto;gap:24px;margin-bottom:48px">
    <div>
      <div style="font-size:72px;font-weight:900;color:${accent};line-height:1;letter-spacing:-0.04em">INV</div>
      <div style="font-size:13px;color:#888;margin-top:8px">No. #${invoice.invoice_number}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800;color:#111">${invoice.company?.name || 'Company'}</div>
      <div style="font-size:12px;color:#888;margin-top:6px">${invoice.company?.email || ''}</div>
      <div style="margin-top:16px;display:flex;gap:16px;justify-content:flex-end">
        ${[{ label: 'Issued', value: formatDate(invoice.issue_date) }, { label: 'Due', value: formatDate(invoice.due_date) }].map(item => `<div style="text-align:center">
          <div style="font-size:9px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.1em">${item.label}</div>
          <div style="font-size:12px;font-weight:600;color:#333;margin-top:2px">${item.value}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <div style="background:#fff;border-left:4px solid ${accent};padding:20px 24px;margin-bottom:40px;border-radius:0 12px 12px 0">
    <div style="font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Bill To</div>
    <div style="font-size:18px;font-weight:800">${invoice.client.name}</div>
    ${invoice.client.company ? `<div style="font-size:13px;color:#666">${invoice.client.company}</div>` : ''}
    <div style="font-size:12px;color:#888;margin-top:4px">${invoice.client.email}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="border-bottom:3px solid ${accent}">
        ${['Description', 'Qty', 'Price', 'VAT', 'Total'].map((h, i) => `<th style="padding:0 12px 10px 0;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:${i >= 1 ? 'right' : 'left'}">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${invoice.items.filter(i => i.description).map(item => `<tr style="border-bottom:1px solid #f0e8d8">
        <td style="padding:14px 12px 14px 0;font-size:14px">${item.description}</td>
        <td style="padding:14px 0;font-size:13px;color:#888;text-align:right">${item.quantity}</td>
        <td style="padding:14px 0;font-size:13px;color:#888;text-align:right">${s}${item.unit_price.toFixed(2)}</td>
        <td style="padding:14px 0;font-size:13px;color:#888;text-align:right">${item.vat_rate}%</td>
        <td style="padding:14px 0;font-size:14px;font-weight:800;text-align:right;color:${accent}">${s}${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="min-width:220px;background:${accent};border-radius:16px;padding:24px;text-align:right">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.1em">Total</div>
      <div style="font-size:32px;font-weight:900;color:#fff;margin-top:4px">${s}${(invoice.total || 0).toFixed(2)}</div>
    </div>
  </div>
  ${invoice.notes ? `<div style="margin-top:40px;font-size:12px;color:#888;line-height:1.6">${invoice.notes}</div>` : ''}
</div>`
}

// =============================================
// ROUTER
// =============================================

export function getTemplateHTML(templateId: string, invoice: Invoice): string {
  switch (templateId) {
    case 'modern': return renderModernHTML(invoice)
    case 'classic': return renderClassicHTML(invoice)
    case 'professional': return renderProfessionalHTML(invoice)
    case 'minimal': return renderMinimalHTML(invoice)
    case 'bold': return renderBoldHTML(invoice)
    case 'elegant': return renderElegantHTML(invoice)
    case 'tech': return renderTechHTML(invoice)
    case 'playful': return renderPlayfulHTML(invoice)
    case 'editorial': return renderEditorialHTML(invoice)
    case 'creative': return renderCreativeHTML(invoice)
    default: return renderModernHTML(invoice)
  }
}