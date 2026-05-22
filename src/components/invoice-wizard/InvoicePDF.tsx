'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Invoice } from '@/types/invoice'

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJipxhiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA-exGYl9w.woff2', fontWeight: 700 },
  ],
})

const COLORS = {
  accent: '#10b981',
  black: '#000000',
  white: '#ffffff',
  gray100: '#f5f5f5',
  gray200: '#e0e0e0',
  gray400: '#a0a0a0',
  gray500: '#666666',
  gray600: '#404040',
  gray700: '#1a1a1a',
  border: '#e5e5e5',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    backgroundColor: COLORS.white,
    color: COLORS.black,
    padding: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.black,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  invoiceMeta: {
    textAlign: 'right',
  },
  invoiceType: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.black,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  block: {
    width: '45%',
  },
  blockLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.gray400,
    marginBottom: 6,
  },
  blockValue: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.black,
    marginBottom: 2,
  },
  blockSub: {
    fontSize: 9,
    color: COLORS.gray500,
    marginBottom: 1,
  },
  dates: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 24,
  },
  dateBlock: {
    width: 100,
  },
  dateLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.gray400,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 10,
    color: COLORS.black,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    padding: '8 12',
    marginBottom: 2,
  },
  colDesc: { flex: 1, fontSize: 8, fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  colQty: { width: 50, fontSize: 8, fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  colPrice: { width: 70, fontSize: 8, fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  colVat: { width: 40, fontSize: 8, fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  colTotal: { width: 70, fontSize: 8, fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    padding: '10 12',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowDesc: { flex: 1, fontSize: 9, color: COLORS.black },
  rowQty: { width: 50, fontSize: 9, color: COLORS.black, textAlign: 'right' },
  rowPrice: { width: 70, fontSize: 9, color: COLORS.black, textAlign: 'right' },
  rowVat: { width: 40, fontSize: 9, color: COLORS.black, textAlign: 'right' },
  rowTotal: { width: 70, fontSize: 9, fontWeight: 600, color: COLORS.black, textAlign: 'right' },
  totals: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 5,
    width: 220,
  },
  totalLabel: { flex: 1, fontSize: 9, color: COLORS.gray500, textAlign: 'right', paddingRight: 12 },
  totalValue: { width: 80, fontSize: 9, color: COLORS.black, textAlign: 'right' },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    width: 220,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.black,
    marginTop: 4,
  },
  totalLabelBold: { flex: 1, fontSize: 11, fontWeight: 700, color: COLORS.black, textAlign: 'right', paddingRight: 12 },
  totalValueBold: { width: 80, fontSize: 11, fontWeight: 700, color: COLORS.black, textAlign: 'right' },
  notes: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.gray400,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.gray600,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.gray400,
  },
  vatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatCurrency(amount: number, symbol: string = '€'): string {
  return `${symbol}${amount.toFixed(2)}`
}

interface Props {
  invoice: Invoice
  companyName?: string
  companyAddress?: string
  companyEmail?: string
  companyVat?: string
  currencySymbol?: string
}

export default function InvoicePDF({ invoice, companyName, companyAddress, companyEmail, companyVat, currencySymbol = '€' }: Props) {
  const typeLabel = invoice.type === 'proforma' ? 'PROFORMA' : invoice.type === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>
              {companyName || 'InvoiceGen'}
              <Text style={s.logoAccent}>.</Text>
            </Text>
          </View>
          <View style={s.invoiceMeta}>
            <Text style={s.invoiceType}>{typeLabel}</Text>
            <Text style={s.invoiceNumber}>#{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={s.body}>
          <View style={s.block}>
            <Text style={s.blockLabel}>From</Text>
            <Text style={s.blockValue}>{companyName || 'Your Company'}</Text>
            {companyAddress && <Text style={s.blockSub}>{companyAddress}</Text>}
            {companyEmail && <Text style={s.blockSub}>{companyEmail}</Text>}
            {companyVat && <Text style={s.blockSub}>VAT: {companyVat}</Text>}
          </View>
          <View style={s.block}>
            <Text style={s.blockLabel}>Bill to</Text>
            <Text style={s.blockValue}>{invoice.client.name}</Text>
            {invoice.client.company && <Text style={s.blockSub}>{invoice.client.company}</Text>}
            <Text style={s.blockSub}>{invoice.client.email}</Text>
            {invoice.client.address && <Text style={s.blockSub}>{invoice.client.address}</Text>}
            {invoice.client.vat_number && <Text style={s.blockSub}>VAT: {invoice.client.vat_number}</Text>}
          </View>
        </View>

        {/* Dates */}
        <View style={s.dates}>
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Issue date</Text>
            <Text style={s.dateValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Due date</Text>
            <Text style={s.dateValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Payment terms</Text>
            <Text style={s.dateValue}>{invoice.payment_terms || 30} days</Text>
          </View>
        </View>

        {/* Line items */}
        <View>
          <View style={s.tableHeader}>
            <Text style={s.colDesc}>Description</Text>
            <Text style={s.colQty}>Qty</Text>
            <Text style={s.colPrice}>Unit price</Text>
            <Text style={s.colVat}>VAT</Text>
            <Text style={s.colTotal}>Total</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={s.tableRow}>
              <Text style={s.rowDesc}>{item.description || '—'}</Text>
              <Text style={s.rowQty}>{item.quantity}</Text>
              <Text style={s.rowPrice}>{formatCurrency(item.unit_price, currencySymbol)}</Text>
              <Text style={s.rowVat}>{item.vat_rate}%</Text>
              <Text style={s.rowTotal}>{formatCurrency(item.quantity * item.unit_price, currencySymbol)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{formatCurrency(invoice.subtotal || 0, currencySymbol)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>VAT/BTW</Text>
            <Text style={s.totalValue}>{formatCurrency(invoice.vat_total || 0, currencySymbol)}</Text>
          </View>
          <View style={s.totalRowBold}>
            <Text style={s.totalLabelBold}>Total</Text>
            <Text style={s.totalValueBold}>{formatCurrency(invoice.total || 0, currencySymbol)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{companyName || 'InvoiceGen'} · {companyEmail || ''}</Text>
          <Text style={s.footerText}>Generated with InvoiceGen</Text>
        </View>
      </Page>
    </Document>
  )
}