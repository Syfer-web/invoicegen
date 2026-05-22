'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type BankAccount = {
  id: string
  company_id: string
  account_holder: string
  bank_name: string
  iban: string | null
  swift_bic: string | null
  account_number: string | null
  sort_code: string | null
  currency: 'EUR' | 'GBP' | 'USD'
  is_default: boolean
  created_at: string
  updated_at: string
}

type FormState = {
  account_holder: string
  bank_name: string
  currency: 'EUR' | 'GBP' | 'USD'
  iban: string
  account_number: string
  sort_code: string
  swift_bic: string
  is_default: boolean
}

const CURRENCIES = ['EUR', 'GBP', 'USD'] as const

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function maskValue(val: string | null, visible = 4) {
  if (!val) return '—'
  if (val.length <= visible) return val
  return '•••• ' + val.slice(-visible)
}

export default function BankPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const emptyForm: FormState = {
    account_holder: '',
    bank_name: '',
    currency: 'EUR',
    iban: '',
    account_number: '',
    sort_code: '',
    swift_bic: '',
    is_default: false,
  }

  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) { setLoading(false); return }

    const { data, error } = await supabase
      .from('bank_details')
      .select('*')
      .eq('company_id', company.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) setAccounts(data)
    setLoading(false)
  }

  function handleCurrencyChange(currency: 'EUR' | 'GBP' | 'USD') {
    setForm(prev => ({ ...prev, currency, is_default: prev.is_default }))
  }

  function handleFieldChange(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in.' })
      setSaving(false)
      return
    }

    const companyRes = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!companyRes.data) {
      setMessage({ type: 'error', text: 'Company not found.' })
      setSaving(false)
      return
    }
    const companyId = companyRes.data.id

    const payload: Record<string, unknown> = {
      company_id: companyId,
      account_holder: form.account_holder.trim(),
      bank_name: form.bank_name.trim(),
      currency: form.currency,
      swift_bic: form.swift_bic.trim() || null,
      is_default: form.is_default,
    }

    if (form.currency === 'EUR') {
      payload.iban = form.iban.trim() || null
      payload.account_number = null
      payload.sort_code = null
    } else if (form.currency === 'GBP') {
      payload.account_number = form.account_number.trim() || null
      payload.sort_code = form.sort_code.trim() || null
      payload.iban = null
    } else {
      payload.iban = null
      payload.account_number = null
      payload.sort_code = null
    }

    if (editingId) {
      if (payload.is_default) {
        await supabase.from('bank_details').update({ is_default: false }).eq('company_id', companyId)
      }
      const { error } = await supabase.from('bank_details').update(payload).eq('id', editingId).eq('company_id', companyId)
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Bank account updated.' })
        setForm(emptyForm)
        setEditingId(null)
      }
    } else {
      if (payload.is_default) {
        await supabase.from('bank_details').update({ is_default: false }).eq('company_id', companyId)
      }
      const { error } = await supabase.from('bank_details').insert(payload)
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Bank account saved.' })
        setForm(emptyForm)
      }
    }

    await fetchAccounts()
    setSaving(false)
  }

  function startEdit(account: BankAccount) {
    setEditingId(account.id)
    setForm({
      account_holder: account.account_holder,
      bank_name: account.bank_name,
      currency: account.currency,
      iban: account.iban ?? '',
      account_number: account.account_number ?? '',
      sort_code: account.sort_code ?? '',
      swift_bic: account.swift_bic ?? '',
      is_default: account.is_default,
    })
    setMessage(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bank account?')) return
    const { error } = await supabase.from('bank_details').delete().eq('id', id)
    if (!error) {
      setMessage({ type: 'success', text: 'Bank account deleted.' })
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
      await fetchAccounts()
    } else {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function handleSetDefault(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
    if (!company) return

    await supabase.from('bank_details').update({ is_default: false }).eq('company_id', company.id)
    await supabase.from('bank_details').update({ is_default: true }).eq('id', id)

    await fetchAccounts()
    setMessage({ type: 'success', text: 'Default bank account updated.' })
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#09090B', color: '#fff', padding: '32px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Bank Details</h1>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>Your payment details — auto-populated on every invoice</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', padding: '12px 16px' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>ℹ</span>
            <p style={{ fontSize: 14, color: 'rgba(52,211,153,0.8)', lineHeight: 1.5, margin: 0 }}>These details appear on all your invoices automatically</p>
          </div>

          {!loading && accounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Saved Accounts ({accounts.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {accounts.map(account => (
                  <div
                    key={account.id}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${editingId === account.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      background: editingId === account.id ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
                      padding: 20,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{account.account_holder}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {account.currency}
                          </span>
                          {account.is_default && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                              ★ Default
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 8 }}>{account.bank_name}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 24px', fontSize: 12, color: '#52525b', fontFamily: 'monospace' }}>
                          {account.iban && <span>IBAN {maskValue(account.iban)}</span>}
                          {account.account_number && <span>Acct {maskValue(account.account_number)}</span>}
                          {account.sort_code && <span>Sort {account.sort_code}</span>}
                          {account.swift_bic && <span>SWIFT {account.swift_bic}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#52525b', marginTop: 8 }}>Added {formatDate(account.created_at)}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {!account.is_default && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#71717a', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                          >
                            Set default
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(account)}
                          style={{ padding: 8, borderRadius: 8, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 16 }}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          style={{ padding: 8, borderRadius: 8, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 16 }}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: '#fff', margin: 0 }}>
                {editingId ? 'Edit Bank Account' : 'Add New Account'}
              </h2>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setForm(emptyForm) }}
                  style={{ fontSize: 14, color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s', fontFamily: 'inherit' }}
                >
                  ✕ Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={form.account_holder}
                    onChange={e => handleFieldChange('account_holder', e.target.value)}
                    placeholder="Jane Smith"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Name</label>
                  <input
                    type="text"
                    required
                    value={form.bank_name}
                    onChange={e => handleFieldChange('bank_name', e.target.value)}
                    placeholder="Monzo, Barclays, N26…"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Currency</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {CURRENCIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCurrencyChange(c)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${form.currency === c ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        background: form.currency === c ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: form.currency === c ? '#34d399' : '#71717a',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {form.currency === 'EUR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>IBAN</label>
                  <input
                    type="text"
                    required
                    value={form.iban}
                    onChange={e => handleFieldChange('iban', e.target.value.toUpperCase())}
                    placeholder="GB82WEST12345698765432"
                    maxLength={34}
                    style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                </div>
              )}

              {form.currency === 'GBP' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Number</label>
                    <input
                      type="text"
                      required
                      value={form.account_number}
                      onChange={e => handleFieldChange('account_number', e.target.value.replace(/\D/g, ''))}
                      placeholder="12345678"
                      maxLength={8}
                      style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sort Code</label>
                    <input
                      type="text"
                      required
                      value={form.sort_code}
                      onChange={e => handleFieldChange('sort_code', e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      maxLength={6}
                      style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    />
                  </div>
                </div>
              )}

              {form.currency === 'USD' && (
                <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '12px 16px' }}>
                  <p style={{ fontSize: 14, color: '#71717a', margin: 0, lineHeight: 1.5 }}>
                    For USD payments, use your routing number and account number via your bank's wire or ACH details. Add your SWIFT/BIC below for international transfers.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  SWIFT / BIC <span style={{ fontWeight: 400, textTransform: 'none', color: '#52525b', marginLeft: 8 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.swift_bic}
                  onChange={e => handleFieldChange('swift_bic', e.target.value.toUpperCase())}
                  placeholder="NWBKGB2L"
                  maxLength={11}
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '12px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#a1a1aa', margin: 0 }}>Set as default</p>
                  <p style={{ fontSize: 12, color: '#71717a', marginTop: 2, margin: '2px 0 0' }}>Use this account by default on new invoices</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_default}
                  onClick={() => handleFieldChange('is_default', !form.is_default)}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    transition: 'background 0.2s',
                    background: form.is_default ? '#10b981' : '#3f3f46',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s',
                      transform: form.is_default ? 'translateX(23px)' : 'translateX(3px)',
                    }}
                  />
                </button>
              </div>

              {message && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 14,
                  background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: message.type === 'success' ? '#34d399' : '#f87171',
                }}>
                  <span style={{ fontSize: 16 }}>{message.type === 'success' ? '✓' : '✕'}</span>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 500,
                  fontSize: 14,
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {saving ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} />
                    Saving…
                  </>
                ) : editingId ? (
                  <>
                    <span style={{ fontSize: 14 }}>✓</span>
                    Update Account
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16 }}>+</span>
                    Save Bank Account
                  </>
                )}
              </button>
            </form>
          </div>

          {!loading && accounts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 14, color: '#71717a' }}>No bank accounts saved yet. Add one above.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}