// =============================================
// INVOICEGEN DESIGN TOKENS
// Based on research: Linear, Stripe, FreshBooks, HoneyBook, Vercel
// =============================================

export const tokens = {
  // Backgrounds
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#09090b',
    darkCard: '#18181b',
    darkHover: '#27272a',
  },
  // Borders
  border: {
    default: '#e5e7eb',
    hover: '#d1d5db',
    dark: '#27272a',
    darkHover: '#3f3f46',
  },
  // Text
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    onDark: '#fafafa',
    onDarkMuted: '#71717a',
  },
  // Brand / Primary
  brand: {
    accent: '#10b981',    // emerald — current
    accentHover: '#059669',
    accentMuted: 'rgba(16,185,129,0.12)',
    blue: '#3b82f6',
    blueHover: '#2563eb',
    purple: '#8b5cf6',
    purpleMuted: 'rgba(139,92,246,0.12)',
  },
  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  // Status
  status: {
    draft: { bg: '#f1f5f9', text: '#6b7280', border: '#e5e7eb' },
    sent: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' },
    paid: { bg: '#ecfdf5', text: '#10b981', border: '#a7f3d0' },
    overdue: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca' },
    cancelled: { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
  },
  // Typography
  font: {
    family: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    size: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
      '5xl': '32px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  // Spacing (8px base)
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  // Radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    lg: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
    xl: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
    card: '0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)',
    dark: '0 4px 24px rgba(0,0,0,0.3)',
  },
  // Transitions
  transition: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
}

// =============================================
// SHARED COMPONENT STYLES
// =============================================

// Stat card — based on Linear/Stripe/Vercel pattern
export const statCardLight = {
  bg: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
}

export const statCardDark = {
  bg: '#18181b',
  borderRadius: '12px',
  border: '1px solid #27272a',
  padding: '20px 24px',
  transition: 'border-color 0.15s ease',
}

// Button styles
export const btnPrimary = {
  height: '40px',
  padding: '0 20px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}

export const btnSecondary = {
  height: '40px',
  padding: '0 20px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

// Input styles
export const inputStyle = {
  height: '40px',
  padding: '0 14px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#111827',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box' as const,
}

// Dark mode input
export const inputDarkStyle = {
  height: '40px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fafafa',
  fontSize: '13px',
  outline: 'none',
  fontFamily: "'Inter', system-ui, sans-serif",
  boxSizing: 'border-box' as const,
}

// Card (light)
export const cardLight = {
  bg: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

// Card (dark)
export const cardDark = {
  bg: '#18181b',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '20px 24px',
}

// Nav item
export const navItemStyle = {
  height: '36px',
  padding: '0 12px',
  borderRadius: '8px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  border: 'none',
  background: 'transparent',
  width: '100%',
  textAlign: 'left' as const,
}

// Status badge
export const statusBadge = (status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
  const colors = tokens.status[status]
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

export function createButtonVariant(
  bg: string,
  hoverBg: string,
  textColor = '#fff'
) {
  return {
    ...btnPrimary,
    background: bg,
    color: textColor,
    '&:hover': { background: hoverBg },
  }
}