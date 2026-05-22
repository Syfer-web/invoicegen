'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type BankAccount = {
  id: string;
  company_id: string;
  account_holder: string;
  bank_name: string;
  iban: string | null;
  swift_bic: string | null;
  account_number: string | null;
  sort_code: string | null;
  currency: 'EUR' | 'GBP' | 'USD';
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  account_holder: string;
  bank_name: string;
  currency: 'EUR' | 'GBP' | 'USD';
  iban: string;
  account_number: string;
  sort_code: string;
  swift_bic: string;
  is_default: boolean;
};

const CURRENCIES = ['EUR', 'GBP', 'USD'] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function maskValue(val: string | null, visible = 4) {
  if (!val) return '—';
  if (val.length <= visible) return val;
  return '•••• ' + val.slice(-visible);
}

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm: FormState = {
    account_holder: '',
    bank_name: '',
    currency: 'EUR',
    iban: '',
    account_number: '',
    sort_code: '',
    swift_bic: '',
    is_default: false,
  };

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get company first
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!company) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('bank_details')
      .select('*')
      .eq('company_id', company.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  }

  function handleCurrencyChange(currency: 'EUR' | 'GBP' | 'USD') {
    setForm(prev => ({ ...prev, currency, is_default: prev.is_default }));
  }

  function handleFieldChange(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in.' });
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      company_id: (await supabase.from('companies').select('id').eq('user_id', user.id).single()).data?.id,
      account_holder: form.account_holder.trim(),
      bank_name: form.bank_name.trim(),
      currency: form.currency,
      swift_bic: form.swift_bic.trim() || null,
      is_default: form.is_default,
    };

    if (form.currency === 'EUR') {
      payload.iban = form.iban.trim() || null;
      payload.account_number = null;
      payload.sort_code = null;
    } else if (form.currency === 'GBP') {
      payload.account_number = form.account_number.trim() || null;
      payload.sort_code = form.sort_code.trim() || null;
      payload.iban = null;
    } else {
      payload.iban = null;
      payload.account_number = null;
      payload.sort_code = null;
    }

    if (editingId) {
      // Update existing
      if (payload.is_default) {
        await supabase
          .from('bank_details')
          .update({ is_default: false })
          .eq('company_id', payload.company_id);
      }
      const { error } = await supabase
        .from('bank_details')
        .update(payload)
        .eq('id', editingId)
        .eq('company_id', payload.company_id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Bank account updated.' });
        setForm(emptyForm);
        setEditingId(null);
      }
    } else {
      // Insert new
      if (payload.is_default) {
        await supabase
          .from('bank_details')
          .update({ is_default: false })
          .eq('company_id', payload.company_id);
      }
      const { error } = await supabase
        .from('bank_details')
        .insert(payload);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Bank account saved.' });
        setForm(emptyForm);
      }
    }

    await fetchAccounts();
    setSaving(false);
  }

  function startEdit(account: BankAccount) {
    setEditingId(account.id);
    setForm({
      account_holder: account.account_holder,
      bank_name: account.bank_name,
      currency: account.currency,
      iban: account.iban ?? '',
      account_number: account.account_number ?? '',
      sort_code: account.sort_code ?? '',
      swift_bic: account.swift_bic ?? '',
      is_default: account.is_default,
    });
    setMessage(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bank account?')) return;
    const { error } = await supabase
      .from('bank_details')
      .delete()
      .eq('id', id);

    if (!error) {
      setMessage({ type: 'success', text: 'Bank account deleted.' });
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await fetchAccounts();
    } else {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleSetDefault(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single();
    if (!company) return;

    await supabase
      .from('bank_details')
      .update({ is_default: false })
      .eq('company_id', company.id);

    await supabase
      .from('bank_details')
      .update({ is_default: true })
      .eq('id', id);

    await fetchAccounts();
    setMessage({ type: 'success', text: 'Default bank account updated.' });
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bank Details</h1>
          <p className="mt-1 text-zinc-400 text-sm">
            Your payment details — auto-populated on every invoice
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-emerald-300/80 leading-relaxed">
            These details appear on all your invoices automatically
          </p>
        </div>

        {/* Existing accounts */}
        {!loading && accounts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Saved Accounts ({accounts.length})
            </h2>
            <div className="space-y-3">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className={`rounded-xl border p-5 transition-all duration-200 ${
                    editingId === account.id
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {account.account_holder}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {account.currency}
                        </span>
                        {account.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{account.bank_name}</p>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 font-mono">
                        {account.iban && <span>IBAN {maskValue(account.iban)}</span>}
                        {account.account_number && <span>Acct {maskValue(account.account_number)}</span>}
                        {account.sort_code && <span>Sort {account.sort_code}</span>}
                        {account.swift_bic && <span>SWIFT {account.swift_bic}</span>}
                      </div>
                      <p className="mt-2 text-xs text-zinc-600">
                        Added {formatDate(account.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!account.is_default && (
                        <button
                          onClick={() => handleSetDefault(account.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all duration-150"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(account)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">
              {editingId ? 'Edit Bank Account' : 'Add New Account'}
            </h2>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Holder + Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={form.account_holder}
                  onChange={e => handleFieldChange('account_holder', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={form.bank_name}
                  onChange={e => handleFieldChange('bank_name', e.target.value)}
                  placeholder="Monzo, Barclays, N26…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Currency
              </label>
              <div className="flex gap-2">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyChange(c)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      form.currency === c
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency-specific fields */}
            {form.currency === 'EUR' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  IBAN
                </label>
                <input
                  type="text"
                  required
                  value={form.iban}
                  onChange={e => handleFieldChange('iban', e.target.value.toUpperCase())}
                  placeholder="GB82WEST12345698765432"
                  maxLength={34}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
                />
              </div>
            )}

            {form.currency === 'GBP' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={form.account_number}
                    onChange={e => handleFieldChange('account_number', e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    maxLength={8}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Sort Code
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sort_code}
                    onChange={e => handleFieldChange('sort_code', e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
                  />
                </div>
              </div>
            )}

            {form.currency === 'USD' && (
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/20 px-4 py-3">
                <p className="text-sm text-zinc-400">
                  For USD payments, use your routing number and account number via your bank&apos;s wire or ACH details.
                  Add your SWIFT/BIC below for international transfers.
                </p>
              </div>
            )}

            {/* SWIFT/BIC — shown for all */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                SWIFT / BIC
                <span className="ml-2 normal-case font-normal text-zinc-600">(optional)</span>
              </label>
              <input
                type="text"
                value={form.swift_bic}
                onChange={e => handleFieldChange('swift_bic', e.target.value.toUpperCase())}
                placeholder="NWBKGB2L"
                maxLength={11}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-150"
              />
            </div>

            {/* Set as default */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">Set as default</p>
                <p className="text-xs text-zinc-500 mt-0.5">Use this account by default on new invoices</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_default}
                onClick={() => handleFieldChange('is_default', !form.is_default)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-[#09090B] ${
                  form.is_default ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    form.is_default ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.text}
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : editingId ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Update Account
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Save Bank Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Empty state */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">No bank accounts saved yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
