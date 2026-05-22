import { createBrowserClient } from '@supabase/ssr'

// Env vars — must be set in Vercel dashboard for auth to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing env vars — Supabase client will not be functional')
}

// createBrowserClient reads HTTP-only cookies automatically and has access
// to localStorage (PKCE verifier). Use this for all client-side auth flows.
export const supabase = createBrowserClient(supabaseUrl || '__placeholder__', supabaseAnonKey || '__placeholder__')