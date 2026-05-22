// =============================================
// INVOICE TEMPLATES
// =============================================

export type TemplateId =
  | 'classic'
  | 'modern'
  | 'minimal'
  | 'professional'
  | 'elegant'
  | 'tech'
  | 'bold'
  | 'creative'
  | 'playful'
  | 'editorial'

export type TemplateCategory = 'clean' | 'creative'

export type InvoiceTemplate = {
  id: TemplateId
  name: string
  description: string
  category: TemplateCategory
  accent: string      // default accent color
  previewBg: string   // background color for preview card
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with serif fonts and formal structure',
    category: 'clean',
    accent: '#1a365d',
    previewBg: '#f8f5f0',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary with generous whitespace',
    category: 'clean',
    accent: '#2563eb',
    previewBg: '#f0f4ff',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra clean, maximum white space, essential content only',
    category: 'clean',
    accent: '#374151',
    previewBg: '#ffffff',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Balanced and corporate-friendly, builds trust',
    category: 'clean',
    accent: '#0f766e',
    previewBg: '#f0fdfb',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined and sophisticated, premium feel',
    category: 'clean',
    accent: '#7c3aed',
    previewBg: '#faf5ff',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Grid layout with monospace elements, developer aesthetic',
    category: 'clean',
    accent: '#0891b2',
    previewBg: '#f0f9fb',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong colored header, high contrast, makes a statement',
    category: 'creative',
    accent: '#dc2626',
    previewBg: '#fef2f2',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Asymmetric layout and vibrant accents for creative businesses',
    category: 'creative',
    accent: '#d97706',
    previewBg: '#fffbeb',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Friendly and approachable with rounded elements',
    category: 'creative',
    accent: '#db2777',
    previewBg: '#fdf2f8',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style layout with strong typography hierarchy',
    category: 'creative',
    accent: '#1e1e1e',
    previewBg: '#f5f5f5',
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'clean', label: 'Clean' },
  { id: 'creative', label: 'Creative' },
  { id: 'favorites', label: 'Favorites', icon: '⭐' as const },
] as const

export function getTemplate(id: TemplateId): InvoiceTemplate {
  return INVOICE_TEMPLATES.find(t => t.id === id) || INVOICE_TEMPLATES[0]
}