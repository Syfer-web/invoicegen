import { createBrowserClient } from '@supabase/ssr'

// Env vars — must be set in Vercel dashboard for auth to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing env vars — Supabase client will not be functional')
}

// Use createBrowserClient so HTTP-only cookies set by the server callback are
// automatically read and refreshed by the browser Supabase client.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createBrowserClient('__placeholder__', '__placeholder__')
