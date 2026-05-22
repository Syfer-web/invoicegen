'use client'

import type { Invoice } from '@/types/invoice'
import { CURRENCY_SYMBOLS, InvoiceType } from '@/types/invoice'
import { calculateInvoiceTotals } from '@/types/invoice'
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
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.12)',
      position: 'sticky',
      top: '96px',
    }}>
      {/* Render selected template in a scrollable container */}
      <div style={{ maxHeight: '700px', overflow: 'auto' }}>
        <PreviewComp invoice={invoice} />
      </div>
    </div>
  )
}