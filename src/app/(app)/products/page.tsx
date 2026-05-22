'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: 'item' | 'hour' | 'day' | 'project';
  category: 'Services' | 'Products' | 'Custom';
  vat_rate: number;
  is_active: boolean;
  created_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  unit_price: string;
  unit: Product['unit'];
  category: Product['category'];
  vat_rate: number;
  is_active: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  unit_price: '',
  unit: 'item',
  category: 'Services',
  vat_rate: 21,
  is_active: true,
};

const UNITS = [
  { value: 'item', label: 'per item' },
  { value: 'hour', label: 'per hour' },
  { value: 'day', label: 'per day' },
  { value: 'project', label: 'per project' },
] as const;

const CATEGORIES = ['Services', 'Products', 'Custom'] as const;
const VAT_OPTIONS = [0, 20, 21, 19] as const;
const CURRENCY = '€';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return `${CURRENCY}${price.toFixed(2)}`;
}

function resetForm(): ProductForm {
  return { ...EMPTY_FORM };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-2/3 bg-zinc-800 rounded" />
        <div className="h-5 w-16 bg-zinc-800 rounded-full" />
      </div>
      <div className="h-3 w-full bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-4/5 bg-zinc-800 rounded mb-6" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 bg-zinc-800 rounded" />
        <div className="h-8 w-16 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

// ─── Toast Feedback ───────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';

function Toast({ message, kind, onDone }: { message: string; kind: ToastKind; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all duration-300 ${
        kind === 'success'
          ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
          : 'bg-red-950 border-red-800 text-red-300'
      }`}
    >
      {kind === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({
  product,
  onConfirm,
  onCancel,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">Delete product?</h3>
        <p className="text-sm text-zinc-400 mb-6">
          <span className="font-medium text-white">{product.name}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function ProductModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product;
  onSave: (data: ProductForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          unit_price: initial.unit_price.toString(),
          unit: initial.unit,
          category: initial.category,
          vat_rate: initial.vat_rate,
          is_active: initial.is_active,
        }
      : resetForm()
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});

  function validate() {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const price = parseFloat(form.unit_price);
    if (isNaN(price) || price < 0) e.unit_price = 'Enter a valid price';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      await onSave({ ...form, unit_price: form.unit_price });
    } finally {
      setSaving(false);
    }
  }

  function set(field: keyof ProductForm, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {initial ? 'Edit product' : 'Add product'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Web Development"
              className={`w-full bg-zinc-950 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:ring-2 focus:ring-emerald-500/50 ${
                errors.name ? 'border-red-500' : 'border-zinc-700 focus:border-emerald-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Price + Unit row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Unit price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{CURRENCY}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unit_price}
                  onChange={e => set('unit_price', e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-zinc-950 border rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:ring-2 focus:ring-emerald-500/50 ${
                    errors.unit_price ? 'border-red-500' : 'border-zinc-700 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.unit_price && <p className="mt-1 text-xs text-red-400">{errors.unit_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Unit</label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value as Product['unit'])}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + VAT row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value as Product['category'])}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">VAT rate</label>
              <select
                value={form.vat_rate}
                onChange={e => set('vat_rate', Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {VAT_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-zinc-300">Active</p>
              <p className="text-xs text-zinc-500">Inactive products are hidden from new invoices</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                form.is_active ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                initial ? 'Save changes' : 'Add product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | Product['category']>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  function showToast(message: string, kind: ToastKind) {
    setToast({ message, kind });
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    } else {
      showToast('Failed to load products', 'error');
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function handleSave(form: ProductForm) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit_price: parseFloat(form.unit_price),
      unit: form.unit,
      category: form.category,
      vat_rate: form.vat_rate,
      is_active: form.is_active,
    };

    let result;
    if (editingProduct) {
      result = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      showToast(result.error.message || 'Failed to save product', 'error');
      return;
    }

    await fetchProducts();
    setShowModal(false);
    setEditingProduct(null);
    showToast(editingProduct ? 'Product updated' : 'Product added', 'success');
  }

  async function handleDelete(product: Product) {
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      showToast(error.message || 'Failed to delete', 'error');
    } else {
      await fetchProducts();
      showToast('Product deleted', 'success');
    }
    setDeletingProduct(null);
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = products.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabCounts: Record<string, number> = {
    All: products.length,
    Services: products.filter(p => p.category === 'Services').length,
    Products: products.filter(p => p.category === 'Products').length,
    Custom: products.filter(p => p.category === 'Custom').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-[#09090B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

          {/* ── Header ── */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Products & Services</h1>
            <p className="mt-1 text-sm text-zinc-400">Your saved items — click to add to any invoice</p>
          </div>

          {/* ── Controls ── */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Add button */}
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>

          {/* ── Category Tabs ── */}
          <div className="flex gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800 w-fit">
            {(['All', ...CATEGORIES] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-emerald-500/30' : 'bg-zinc-800'
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-300 font-medium">No products yet</p>
                <p className="text-sm text-zinc-500 mt-1">
                  {search ? 'No results match your search.' : 'Add your first product or service to get started.'}
                </p>
              </div>
              {!search && (
                <button
                  onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(product => (
                <div
                  key={product.id}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 transition-all duration-200"
                >
                  {/* Top row: name + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-white text-base leading-snug">{product.name}</h3>
                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        product.category === 'Services'
                          ? 'bg-blue-950/60 border-blue-800/50 text-blue-300'
                          : product.category === 'Products'
                          ? 'bg-purple-950/60 border-purple-800/50 text-purple-300'
                          : 'bg-amber-950/60 border-amber-800/50 text-amber-300'
                      }`}
                    >
                      {product.category}
                    </span>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price row */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
                    <div>
                      <p className="text-xl font-bold text-white tabular-nums">
                        {formatPrice(product.unit_price)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {UNITS.find(u => u.value === product.unit)?.label}
                        {product.vat_rate > 0 && ` · incl. ${product.vat_rate}% VAT`}
                      </p>
                    </div>

                    {!product.is_active && (
                      <span className="text-xs text-zinc-600 border border-zinc-700 px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingProduct(product); setShowModal(true); }}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & Overlays ── */}
      {showModal && (
        <ProductModal
          initial={editingProduct ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
        />
      )}

      {deletingProduct && (
        <DeleteDialog
          product={deletingProduct}
          onConfirm={() => handleDelete(deletingProduct)}
          onCancel={() => setDeletingProduct(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />
      )}
    </>
  );
}
