/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only instantiated when first accessed at runtime.
// Safe to import at module level because createBrowserClient is called
// inside useEffect/callback (browser context), not at module evaluation.
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set these in .env.local (local) or Vercel project Environment Variables (production).'
    )
  }

  _client = createBrowserClient(url, key, {
    auth: {
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  return _client
}

// Named export for existing import pattern.
// Only throws at runtime when env vars are missing (never at build time).
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})