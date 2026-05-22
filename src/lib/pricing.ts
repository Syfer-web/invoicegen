export type Region = 'EU' | 'UK' | 'USA'

export type PricingPlan = {
  monthly: number
  currency: string
  symbol: string
}

export const PRICING: Record<Region, { free: number; pro: number; scale: number }> = {
  EU: { free: 0, pro: 9, scale: 19 },
  UK: { free: 0, pro: 8, scale: 16 },
  USA: { free: 0, pro: 10, scale: 22 },
}

export const CURRENCY: Record<Region, { symbol: string; code: string }> = {
  EU: { symbol: '€', code: 'EUR' },
  UK: { symbol: '£', code: 'GBP' },
  USA: { symbol: '$', code: 'USD' },
}

export async function detectRegion(ip: string): Promise<Region> {
  // Default to EU
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'EU'
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await res.json()
    const country = data.country_code

    if (country === 'GB') return 'UK'
    if (country === 'US') return 'USA'
    return 'EU'
  } catch {
    return 'EU'
  }
}