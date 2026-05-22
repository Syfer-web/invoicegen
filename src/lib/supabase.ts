import { createClient, type User } from '@supabase/supabase-js'

// Env vars — must be set in Vercel dashboard for auth to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing env vars')
}

// Plain browser client — no SSR cookie handling.
// Auth state lives in localStorage; cookies are set manually by the server callback.
export const supabase = createClient(supabaseUrl || '__placeholder__', supabaseAnonKey || '__placeholder__')

export type { User }