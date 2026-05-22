'use client'

interface Props {
  notes: string
  onChangeNotes: (v: string) => void
  internalNotes: string
  onChangeInternalNotes: (v: string) => void
  paymentTermsText: string
  onChangePaymentTermsText: (v: string) => void
  accentColor: string
  onChangeAccentColor: (v: string) => void
}

const ACCENT_COLORS = [
  { value: '#10b981', name: 'Emerald' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EF4444', name: 'Red' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#000000', name: 'Black' },
]

export default function NotesBrandingSection({
  notes, onChangeNotes,
  internalNotes, onChangeInternalNotes,
  paymentTermsText, onChangePaymentTermsText,
  accentColor, onChangeAccentColor,
}: Props) {
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#FAFAFA',
    fontSize: '13px',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  }

  return (
    <div style={{
      background: '#18181B',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>6</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', marginLeft: '10px' }}>Notes & Branding</span>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Notes */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes to client
            <span style={{ fontWeight: 400, marginLeft: '6px', textTransform: 'none', letterSpacing: 0, color: '#52525B' }}>(appears on invoice)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => onChangeNotes(e.target.value)}
            placeholder="Thank you for your business. Payment details below. For any questions contact us at billing@example.com"
            rows={3}
            style={textareaStyle}
          />
        </div>

        {/* Internal notes */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Internal notes
            <span style={{ fontWeight: 400, marginLeft: '6px', textTransform: 'none', letterSpacing: 0, color: '#52525B' }}>(not on PDF)</span>
          </label>
          <textarea
            value={internalNotes}
            onChange={e => onChangeInternalNotes(e.target.value)}
            placeholder="Follow up if not paid within 14 days. Check with Sarah before sending."
            rows={3}
            style={{ ...textareaStyle, background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.1)' }}
          />
        </div>

        {/* Payment terms text */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payment terms text
            <span style={{ fontWeight: 400, marginLeft: '6px', textTransform: 'none', letterSpacing: 0, color: '#52525B' }}>(legal note)</span>
          </label>
          <textarea
            value={paymentTermsText}
            onChange={e => onChangePaymentTermsText(e.target.value)}
            placeholder="Payment due within 30 days. Bank details on invoice. Late payments subject to 2% monthly interest."
            rows={3}
            style={textareaStyle}
          />
        </div>

        {/* Accent color */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Invoice accent color
            <span style={{ fontWeight: 400, marginLeft: '6px', textTransform: 'none', letterSpacing: 0, color: '#52525B' }}>(shown on PDF)</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => onChangeAccentColor(color.value)}
                title={color.name}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  background: color.value,
                  border: accentColor === color.value ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  transform: accentColor === color.value ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
            <input
              type="color"
              value={accentColor}
              onChange={e => onChangeAccentColor(e.target.value)}
              style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                background: 'transparent',
                padding: '2px',
              }}
              title="Custom color"
            />
          </div>
        </div>
      </div>
    </div>
  )
}