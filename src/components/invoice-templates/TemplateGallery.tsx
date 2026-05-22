'use client'

import { useState, useEffect } from 'react'
import { INVOICE_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory, type TemplateId } from '@/types/template'
import { getSupabase } from '@/lib/supabase'
import { ClassicTemplate } from './Classic'
import { ModernTemplate } from './Modern'
import { MinimalTemplate } from './Minimal'
import { ProfessionalTemplate } from './Professional'
import { ElegantTemplate } from './Elegant'
import { TechTemplate } from './Tech'
import { BoldTemplate } from './Bold'
import { CreativeTemplate } from './Creative'
import { PlayfulTemplate } from './Playful'
import { EditorialTemplate } from './Editorial'
import { createEmptyClient, createEmptyLineItem } from '@/types/invoice'

// Lazy-load templates by name
const TEMPLATE_COMPONENTS: Record<TemplateId, React.ComponentType<{ invoice: any }>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  elegant: ElegantTemplate,
  tech: TechTemplate,
  bold: BoldTemplate,
  creative: CreativeTemplate,
  playful: PlayfulTemplate,
  editorial: EditorialTemplate,
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  clean: 'Clean & Corporate',
  creative: 'Creative',
  favorites: 'Favorites',
}

export function TemplateGallery({
  selectedId,
  onSelect,
}: {
  selectedId: TemplateId
  onSelect: (id: TemplateId) => void
}) {
  const [favorites, setFavorites] = useState<TemplateId[]>([])
  const [category, setCategory] = useState<TemplateCategory | 'all' | 'favorites'>('all')
  const [starred, setStarred] = useState<Set<TemplateId>>(new Set())

  useEffect(() => {
    // Load favorites from Supabase profile
    const loadFavorites = async () => {
      const sb = getSupabase()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb
        .from('profiles')
        .select('template_favorites')
        .eq('id', user.id)
        .single()
      if (data?.template_favorites) {
        setFavorites(data.template_favorites as TemplateId[])
        setStarred(new Set(data.template_favorites as TemplateId[]))
      }
    }
    loadFavorites()
  }, [])

  const toggleFavorite = async (id: TemplateId, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStarred = new Set(starred)
    if (newStarred.has(id)) {
      newStarred.delete(id)
    } else {
      newStarred.add(id)
    }
    setStarred(newStarred)
    setFavorites([...newStarred])

    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb
      .from('profiles')
      .update({ template_favorites: [...newStarred] })
      .eq('id', user.id)
  }

  const filtered = INVOICE_TEMPLATES.filter(t => {
    if (category === 'all') return true
    if (category === 'favorites') return starred.has(t.id)
    return t.category === category
  })

  // Dummy invoice for preview
  const previewInvoice = {
    id: 'preview',
    invoice_number: 'INV-202506-0001',
    type: 'standard' as const,
    status: 'draft' as const,
    issue_date: '2025-06-01',
    due_date: '2025-07-01',
    payment_terms: 30,
    currency: 'EUR' as const,
    subtotal: 10300,
    vat_total: 2060,
    total: 12360,
    notes: 'Payment due within 30 days. Thank you for your business.',
    accent_color: '#10b981',
    client: {
      ...createEmptyClient(),
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      company: 'Acme Corp',
      address: '123 Business Ave',
      city: 'London, UK',
    },
    items: [
      { ...createEmptyLineItem(20), id: '1', description: 'Web Development', quantity: 40, unit_price: 120, vat_rate: 20 },
      { ...createEmptyLineItem(20), id: '2', description: 'UI/UX Design', quantity: 20, unit_price: 95, vat_rate: 20 },
      { ...createEmptyLineItem(20), id: '3', description: 'Hosting (12 months)', quantity: 1, unit_price: 480, vat_rate: 20 },
    ],
  }

  return (
    <div>
      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as typeof category)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: category === cat.id ? '#10b981' : '#2a2a2e',
              background: category === cat.id ? '#10b981' : 'transparent',
              color: category === cat.id ? '#000' : '#888',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat.id === 'favorites' ? '★ ' : ''}{CATEGORY_LABELS[cat.id] || cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map(template => {
          const isSelected = template.id === selectedId
          const PreviewComp = TEMPLATE_COMPONENTS[template.id]

          return (
            <div
              key={template.id}
              onClick={() => onSelect(template.id)}
              style={{
                borderRadius: '12px',
                border: isSelected ? '2px solid #10b981' : '1px solid #2a2a2e',
                background: '#111113',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Preview pane */}
              <div style={{
                background: template.previewBg,
                height: '220px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: '200%',
                  pointerEvents: 'none',
                }}>
                  <PreviewComp invoice={previewInvoice} />
                </div>

                {/* Star button */}
                <button
                  onClick={(e) => toggleFavorite(template.id, e)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: starred.has(template.id) ? '#f59e0b' : '#666',
                    transition: 'color 0.15s',
                  }}
                >
                  {starred.has(template.id) ? '★' : '☆'}
                </button>

                {/* Selected badge */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: '#10b981',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}>
                    Selected
                  </div>
                )}
              </div>

              {/* Template info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                  {template.name}
                </div>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                  {template.description}
                </div>
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: template.category === 'clean' ? '#10b981' : '#f59e0b',
                    background: template.category === 'clean' ? '#10b98122' : '#f59e0b22',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}>
                    {template.category === 'clean' ? 'Clean' : 'Creative'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#555' }}>
            <div style={{ fontSize: '14px' }}>No templates in this category yet.</div>
            <div style={{ fontSize: '12px', color: '#444', marginTop: '8px' }}>Star some templates to add them to Favorites.</div>
          </div>
        )}
      </div>
    </div>
  )
}
