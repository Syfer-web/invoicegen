'use client'

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS } from '@/types/invoice'
import type { TemplateId } from '@/types/template'
import {
  ClassicTemplate, ModernTemplate, MinimalTemplate,
  ProfessionalTemplate, ElegantTemplate, TechTemplate,
  BoldTemplate, CreativeTemplate, PlayfulTemplate, EditorialTemplate,
} from '@/components/invoice-templates'

const TEMPLATE_MAP: Record<TemplateId, React.ComponentType<{ invoice: Invoice }>> = {
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

interface Props {
  invoice: Invoice
  templateId?: TemplateId
}

export default function LivePreview({ invoice, templateId = 'modern' }: Props) {
  const PreviewComp = TEMPLATE_MAP[templateId] || ModernTemplate

  return (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 2px 16px rgba(0,0,0,0.08)',
    }}>
      {/* Invoice rendered inside a scrollable container if needed */}
      <div style={{ overflow: 'auto', maxHeight: '560px' }}>
        <PreviewComp invoice={invoice} />
      </div>
    </div>
  )
}