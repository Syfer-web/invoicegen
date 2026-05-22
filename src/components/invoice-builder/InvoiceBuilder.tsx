'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Invoice, Company, Client, LineItem, BankAccount, Currency, InvoiceType } from '@/types/invoice'
import type { TemplateId } from '@/types/template'
import { createEmptyLineItem, createEmptyClient, calculateInvoiceTotals, CURRENCY_SYMBOLS } from '@/types/invoice'
import CompanySelector from '@/components/invoice-builder/CompanySelector'
import ClientSection from '@/components/invoice-builder/ClientSection'
import LineItemsSection from '@/components/invoice-builder/LineItemsSection'
import TaxDiscountsSection from '@/components/invoice-builder/TaxDiscountsSection'
import PaymentSection from '@/components/invoice-builder/PaymentSection'
import DatesRefsSection from '@/components/invoice-builder/DatesRefsSection'
import NotesBrandingSection from '@/components/invoice-builder/NotesBrandingSection'
import LivePreview from '@/components/invoice-builder/LivePreview'
import { TemplateGallery } from '@/components/invoice-templates/TemplateGallery'
import { INVOICE_TEMPLATES } from '@/types/template'

// Supabase client
function createClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface SavedClient { id: string; name: string; company: string; email: string }
interface SavedProduct { id: string; name: string; unit_price: number; unit: string; vat_rate: number }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function InvoiceBuilder() {
  // Data
  const [companies, setCompanies] = useState<Company[]>([])
  const [savedClients, setSavedClients] = useState<SavedClient[]>([])
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)

  // Invoice state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    type: 'standard',
    invoice_number: '',
    status: 'draft',
    client: createEmptyClient(),
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 30,
    currency: 'EUR',
    items: [createEmptyLineItem(21)],
    discount_amount: 0,
    discount_percent: 0,
    subtotal: 0,
    vat_total: 0,
    total: 0,
    project_ref: '',
    order_number: '',
    notes: '',
    internal_notes: '',
    payment_terms_text: '',
    stripe_payment_link_id: '',
    stripe_payment_link_url: '',
    allow_partial_payment: false,
    partial_payment_schedule: [],
    early_payment_discount_percent: 0,
    early_payment_days: 0,
    accent_color: '#10b981',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('modern')
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)

  // ── NEW UX STATE ────────────────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const unsavedChangesRef = useRef(false)
  // ─────────────────────────────────────────────────────────────────────────────

  // Track unsaved changes
  useEffect(() => {
    unsavedChangesRef.current = true
  }, [invoice])

  // Auto-save every 30s when there are unsaved changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!unsavedChangesRef.current) return
      if (!selectedCompanyId) return
      await performSave(true /* silent */)
    }, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId])

  // Keyboard shortcuts: ⌘S to save, ⌘↵ to send
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modKey = isMac ? e.metaKey : e.ctrlKey
      if (modKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (modKey && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, invoice])

  // Computed totals
  const { subtotal, discount_amount, vat_total, total, vat_breakdown } = calculateInvoiceTotals(
    invoice.items || [],
    invoice.discount_amount || 0
  )

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const symbol = CURRENCY_SYMBOLS[invoice.currency as Currency] || '€'

  // Load initial data
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        if (!user) {
          if (!cancelled) setLoading(false)
          return
        }

        // Load companies
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at')

        if (cancelled) return

        if (companiesData && companiesData.length > 0) {
          const firstId = companiesData[0].id
          if (!cancelled) {
            setCompanies(companiesData)
            setSelectedCompanyId(firstId)
          }

          // Load bank account
          const { data: bank } = await supabase
            .from('bank_details')
            .select('*')
            .eq('company_id', firstId)
            .eq('is_default', true)
            .single()
          if (!cancelled && bank) setBankAccount(bank)

          // Load clients for this company
          const { data: clientsData } = await supabase
            .from('clients')
            .select('id, name, company, email')
            .eq('company_id', firstId)
            .order('name')
          if (!cancelled && clientsData) setSavedClients(clientsData)

          // Load products for this company
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, unit_price, unit, vat_rate')
            .eq('company_id', firstId)
            .eq('is_active', true)
            .order('name')
          if (!cancelled && productsData) setSavedProducts(productsData)

          // Set currency and default VAT from company
          const firstCompany = companiesData[0]
          if (!cancelled) {
            setInvoice(prev => ({
              ...prev,
              company_id: firstId,
              currency: (firstCompany.default_currency || 'EUR') as Currency,
              items: [createEmptyLineItem(firstCompany.default_vat_rate || 21)],
              payment_terms: firstCompany.default_payment_terms || 30,
            }))
          }
        } else {
          // User has no companies — still load, just no pre-selection
          if (!cancelled) {
            setCompanies([])
            setSelectedCompanyId('')
          }
        }
      } catch (err) {
        console.error('InvoiceBuilder loadData error:', err)
      }

      if (!cancelled) setLoading(false)
    }

    loadData()

    // Safety timeout — never leave loading stuck
    const timeout = setTimeout(() => {
      cancelled = true
      setLoading(false)
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  // When company changes, reload clients + products + bank
  const handleCompanyChange = useCallback(async (companyId: string) => {
    setSelectedCompanyId(companyId)
    const company = companies.find(c => c.id === companyId)
    if (!company) return

    setBankAccount(null)
    setSavedClients([])
    setSavedProducts([])

    const supabase = createClient()

    const { data: bank } = await supabase
      .from('bank_details')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_default', true)
      .single()
    if (bank) setBankAccount(bank)

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, name, company, email')
      .eq('company_id', companyId)
      .order('name')
    if (clientsData) setSavedClients(clientsData)

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, unit_price, unit, vat_rate')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')
    if (productsData) setSavedProducts(productsData)

    setInvoice(prev => ({
      ...prev,
      company_id: companyId,
      currency: (company.default_currency || 'EUR') as Currency,
      items: [createEmptyLineItem(company.default_vat_rate || 21)],
    }))
  }, [companies])

  // Auto-calculate due date when payment terms changes
  const handlePaymentTermsChange = (days: number) => {
    const issue = invoice.issue_date ? new Date(invoice.issue_date) : new Date()
    const due = new Date(issue.getTime() + days * 24 * 60 * 60 * 1000)
    setInvoice(prev => ({ ...prev, payment_terms: days, due_date: due.toISOString().split('T')[0] }))
  }

  // Shared save logic (used by both manual and auto-save)
  const performSave = async (silent = false) => {
    if (!selectedCompanyId) return
    if (!silent) setSaveStatus('saving')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate invoice number
      const { data: companyData } = await supabase.rpc('generate_invoice_number', { p_company_id: selectedCompanyId })
      const invoiceNumber = companyData || `INV-${Date.now().toString().slice(-6)}`

      // Upsert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .upsert({
          company_id: selectedCompanyId,
          client_id: invoice.client?.id,
          invoice_number: invoiceNumber,
          type: invoice.type,
          status: 'draft',
          issue_date: invoice.issue_date,
          due_date: invoice.due_date || null,
          payment_terms: invoice.payment_terms,
          currency: invoice.currency,
          subtotal,
          discount_amount: invoice.discount_amount,
          discount_percent: invoice.discount_percent,
          vat_total,
          total,
          project_ref: invoice.project_ref,
          order_number: invoice.order_number,
          notes: invoice.notes,
          internal_notes: invoice.internal_notes,
          payment_terms_text: invoice.payment_terms_text,
          allow_partial_payment: invoice.allow_partial_payment,
          early_payment_discount_percent: invoice.early_payment_discount_percent,
          early_payment_days: invoice.early_payment_days,
        }, { onConflict: 'company_id' })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Upsert client
      if (invoice.client?.name && invoice.client?.email) {
        const clientData = {
          company_id: selectedCompanyId,
          name: invoice.client!.name,
          company: invoice.client!.company || null,
          email: invoice.client!.email,
          address: invoice.client!.address || null,
          city: invoice.client!.city || null,
          postcode: invoice.client!.postcode || null,
          country: invoice.client!.country || null,
          vat_number: invoice.client!.vat_number || null,
          phone: invoice.client!.phone || null,
        }
        await supabase.from('clients').upsert(clientData, { onConflict: 'company_id,email' })
      }

      // Upsert invoice items
      const validItems = (invoice.items || []).filter(i => i.description)
      if (validItems.length > 0) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceData.id)
        await supabase.from('invoice_items').insert(
          validItems.map((item, idx) => ({
            invoice_id: invoiceData.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            discount_percent: item.discount_percent,
            sort_order: idx,
          }))
        )
      }

      unsavedChangesRef.current = false
      setLastSaved(new Date())
      if (!silent) {
        setSaveStatus('saved')
        setSuccess(true)
        setTimeout(() => { setSaveStatus('idle'); setSuccess(false) }, 3000)
      }
    } catch (err: any) {
      if (!silent) {
        setSaveStatus('error')
        setError(err.message || 'Failed to save')
        setTimeout(() => setSaveStatus('idle'), 4000)
      }
    }
  }

  // Handle save (manual)
  const handleSave = useCallback(() => {
    performSave(false)
  }, [selectedCompanyId, invoice, subtotal, vat_total, total])

  // Handle send
  const handleSend = async () => {
    if (!invoice.client?.email || !invoice.client?.name) {
      setError('Please add client details before sending')
      return
    }
    if (!(invoice.items || []).some(i => i.description)) {
      setError('Please add at least one line item')
      return
    }

    setSending(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', { p_company_id: selectedCompanyId })

      // Create Stripe payment link
      let paymentLinkUrl = ''
      if (selectedCompany?.stripe_onboarding_complete) {
        const stripeRes = await fetch('/api/invoices/create-payment-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: (invoice.currency || 'EUR').toLowerCase(),
            invoiceNumber: invoiceNumber || invoice.invoice_number,
            clientEmail: invoice.client!.email,
            description: (invoice.items || []).filter(i => i.description).map(i => i.description).join(', '),
          }),
        })
        if (stripeRes.ok) {
          const { paymentLinkUrl: url } = await stripeRes.json()
          paymentLinkUrl = url
        }
      }

      // Upsert invoice as sent
      const { data: invoiceData } = await supabase
        .from('invoices')
        .upsert({
          company_id: selectedCompanyId,
          invoice_number: invoiceNumber,
          type: invoice.type,
          status: 'sent',
          sent_at: new Date().toISOString(),
          issue_date: invoice.issue_date,
          due_date: invoice.due_date || null,
          payment_terms: invoice.payment_terms,
          currency: invoice.currency,
          subtotal,
          discount_amount: invoice.discount_amount,
          discount_percent: invoice.discount_percent,
          vat_total,
          total,
          project_ref: invoice.project_ref,
          order_number: invoice.order_number,
          notes: invoice.notes,
          internal_notes: invoice.internal_notes,
          payment_terms_text: invoice.payment_terms_text,
          stripe_payment_link_url: paymentLinkUrl,
          allow_partial_payment: invoice.allow_partial_payment,
          early_payment_discount_percent: invoice.early_payment_discount_percent,
          early_payment_days: invoice.early_payment_days,
        }, { onConflict: 'company_id,invoice_number' })
        .select()
        .single()

      // Upsert client
      if (invoice.client) {
        await supabase.from('clients').upsert({
          company_id: selectedCompanyId,
          name: invoice.client!.name,
          company: invoice.client!.company || null,
          email: invoice.client!.email,
          address: invoice.client!.address || null,
          city: invoice.client!.city || null,
          postcode: invoice.client!.postcode || null,
          country: invoice.client!.country || null,
          vat_number: invoice.client!.vat_number || null,
          phone: invoice.client!.phone || null,
        }, { onConflict: 'company_id,email' })
      }

      // Upsert items
      const validItems = (invoice.items || []).filter(i => i.description)
      if (validItems.length > 0 && invoiceData) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceData.id)
        await supabase.from('invoice_items').insert(
          validItems.map((item, idx) => ({
            invoice_id: invoiceData.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            discount_percent: item.discount_percent,
            sort_order: idx,
          }))
        )
      }

      // Send email
      await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: { ...invoice, invoice_number: invoiceNumber, subtotal, vat_total, total },
          paymentLinkUrl,
          clientEmail: invoice.client!.email,
          clientName: invoice.client!.name,
          companyName: selectedCompany?.name || 'Your Company',
          currencySymbol: symbol,
        }),
      })

      setSuccess(true)
      setTimeout(() => { window.location.href = '/invoices' }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send invoice')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: '14px', color: '#71717A' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const previewInvoice: Invoice = {
    ...invoice as Invoice,
    company: selectedCompany,
  }

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', margin: 0 }}>New Invoice</h1>
              {/* ── Auto-save status indicator ── */}
              {saveStatus === 'saving' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717A' }}>
                  <div style={{ width: '12px', height: '12px', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  Saving…
                </div>
              )}
              {saveStatus === 'saved' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                  {lastSaved && <span style={{ color: '#52525B', fontWeight: 400 }}>· {formatLastSaved(lastSaved)}</span>}
                </div>
              )}
              {saveStatus === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#f87171' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Save failed
                </div>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#71717A', margin: '4px 0 0' }}>
              {invoice.invoice_number || 'Draft'}
              {invoice.client?.name && <> — {invoice.client.name}</>}
            </p>
          </div>

          {/* Manual success toast */}
          {success && saveStatus !== 'saved' && (
            <div style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981',
              fontSize: '13px', fontWeight: 500,
            }}>
              Saved successfully
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.15)',
          color: '#f87171',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* 2-column layout — form + preview */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        paddingBottom: showPreview ? '0' : '0',
      }}>
        {/* Left: form sections */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Company selector */}
          {companies.length > 0 && (
            <CompanySelector
              companies={companies}
              selectedId={selectedCompanyId}
              onChange={handleCompanyChange}
            />
          )}

          {/* Currency selector */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Currency:</span>
            <select
              value={invoice.currency}
              onChange={e => setInvoice(prev => ({ ...prev, currency: e.target.value as Currency }))}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: '#FAFAFA',
                fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', outline: 'none',
              }}
            >
              {(['EUR', 'GBP', 'USD', 'CAD', 'AUD'] as Currency[]).map(c => (
                <option key={c} value={c} style={{ background: '#18181B' }}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sections */}
          <ClientSection
            client={invoice.client || createEmptyClient()}
            onChange={client => setInvoice(prev => ({ ...prev, client }))}
            savedClients={savedClients}
            onClientSaved={(saved) => {
              setSavedClients(prev => {
                const exists = prev.find(c => c.id === saved.id)
                if (exists) return prev.map(c => c.id === saved.id ? saved : c)
                return [...prev, saved]
              })
            }}
          />

          <LineItemsSection
            items={invoice.items || []}
            onChange={items => setInvoice(prev => ({ ...prev, items }))}
            currency={invoice.currency as Currency || 'EUR'}
            defaultVatRate={selectedCompany?.default_vat_rate || 21}
            savedProducts={savedProducts}
            onProductSaved={(saved) => {
              setSavedProducts(prev => {
                const exists = prev.find(p => p.id === saved.id)
                if (exists) return prev.map(p => p.id === saved.id ? saved : p)
                return [...prev, saved]
              })
            }}
          />

          <TaxDiscountsSection
            items={invoice.items || []}
            discountAmount={invoice.discount_amount || 0}
            discountPercent={invoice.discount_percent || 0}
            onChangeDiscountAmount={v => setInvoice(prev => ({ ...prev, discount_amount: v }))}
            onChangeDiscountPercent={v => setInvoice(prev => ({ ...prev, discount_percent: v }))}
            currency={invoice.currency as Currency || 'EUR'}
          />

          <PaymentSection
            paymentTerms={invoice.payment_terms || 30}
            onChangePaymentTerms={handlePaymentTermsChange}
            bankAccount={bankAccount}
            currency={invoice.currency as Currency || 'EUR'}
            allowPartialPayment={invoice.allow_partial_payment || false}
            onChangeAllowPartialPayment={v => setInvoice(prev => ({ ...prev, allow_partial_payment: v }))}
            earlyPaymentDiscountPercent={invoice.early_payment_discount_percent || 0}
            earlyPaymentDays={invoice.early_payment_days || 0}
            onChangeEarlyPaymentDiscount={(p, d) => setInvoice(prev => ({ ...prev, early_payment_discount_percent: p, early_payment_days: d }))}
            stripeEnabled={!!selectedCompany?.stripe_onboarding_complete}
          />

          <DatesRefsSection
            type={invoice.type as InvoiceType || 'standard'}
            onChangeType={t => setInvoice(prev => ({ ...prev, type: t }))}
            issueDate={invoice.issue_date || ''}
            onChangeIssueDate={v => setInvoice(prev => ({ ...prev, issue_date: v }))}
            dueDate={invoice.due_date || ''}
            onChangeDueDate={v => setInvoice(prev => ({ ...prev, due_date: v }))}
            projectRef={invoice.project_ref || ''}
            onChangeProjectRef={v => setInvoice(prev => ({ ...prev, project_ref: v }))}
            orderNumber={invoice.order_number || ''}
            onChangeOrderNumber={v => setInvoice(prev => ({ ...prev, order_number: v }))}
          />

          <NotesBrandingSection
            notes={invoice.notes || ''}
            onChangeNotes={v => setInvoice(prev => ({ ...prev, notes: v }))}
            internalNotes={invoice.internal_notes || ''}
            onChangeInternalNotes={v => setInvoice(prev => ({ ...prev, internal_notes: v }))}
            paymentTermsText={invoice.payment_terms_text || ''}
            onChangePaymentTermsText={v => setInvoice(prev => ({ ...prev, payment_terms_text: v }))}
            accentColor={invoice.accent_color || '#10b981'}
            onChangeAccentColor={v => setInvoice(prev => ({ ...prev, accent_color: v }))}
          />

          {/* Template selector */}
          <div style={{
            background: '#18181B',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: showTemplateGallery ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>7</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>Invoice Template</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  fontSize: '12px',
                  color: '#A1A1AA',
                }}>
                  {INVOICE_TEMPLATES.find(t => t.id === selectedTemplateId)?.name || 'Modern'}
                </div>
                <button
                  onClick={() => setShowTemplateGallery(!showTemplateGallery)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: showTemplateGallery ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    color: showTemplateGallery ? '#10b981' : '#A1A1AA',
                    fontSize: '12px', fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {showTemplateGallery ? 'Hide templates' : 'Choose template'}
                </button>
              </div>
            </div>

            {showTemplateGallery && (
              <div style={{ padding: '20px' }}>
                <TemplateGallery
                  selectedId={selectedTemplateId}
                  onSelect={(id) => {
                    setSelectedTemplateId(id)
                    const template = INVOICE_TEMPLATES.find(t => t.id === id)
                    if (template) setInvoice(prev => ({ ...prev, accent_color: template.accent }))
                  }}
                />
              </div>
            )}
          </div>

          {/* Spacer to prevent sticky bar from covering last content */}
          <div style={{ height: '100px' }} />
        </div>

        {/* Right: live preview */}
        {showPreview && (
          <div style={{
            width: '380px',
            flexShrink: 0,
          }}>
            <div style={{ position: 'sticky', top: '96px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Live preview — {INVOICE_TEMPLATES.find(t => t.id === selectedTemplateId)?.name}
                </div>
                {/* Eye toggle button */}
                <button
                  onClick={() => setShowPreview(false)}
                  title="Hide preview (Focus mode)"
                  style={{
                    width: '28px', height: '28px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#71717A',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <LivePreview invoice={previewInvoice} templateId={selectedTemplateId} />
            </div>
          </div>
        )}
      </div>

      {/* Focus mode banner when preview is hidden */}
      {!showPreview && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '24px',
          zIndex: 50,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: '#18181B',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 500 }}>Focus mode</span>
          <button
            onClick={() => setShowPreview(true)}
            title="Show preview"
            style={{
              width: '24px', height: '24px',
              borderRadius: '5px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#A1A1AA',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Sticky bottom action bar ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '12px 24px',
        background: '#09090B',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {/* Total */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: invoice.accent_color || '#10b981' }}>
              {symbol}{total.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#71717A' }}>Total</div>
          </div>

          {/* Save draft */}
          <button
            onClick={handleSave}
            disabled={saving || saveStatus === 'saving'}
            title="Save draft (⌘S)"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#A1A1AA',
              fontSize: '13px', fontWeight: 500,
              cursor: (saving || saveStatus === 'saving') ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              minWidth: '120px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {(saving || saveStatus === 'saving') ? (
              <>
                <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#A1A1AA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Saving…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save draft
                <kbd style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  fontSize: '11px',
                  color: '#71717A',
                  fontFamily: 'inherit',
                }}>⌘S</kbd>
              </>
            )}
          </button>

          {/* Send invoice */}
          <button
            onClick={handleSend}
            disabled={sending}
            title="Send invoice (⌘↵)"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: invoice.accent_color || '#10b981',
              color: '#fff',
              fontSize: '13px', fontWeight: 600,
              cursor: sending ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {sending ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Sending…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Send invoice
                <kbd style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.15)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'inherit',
                }}>⌘↵</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
