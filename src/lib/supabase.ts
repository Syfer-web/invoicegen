import { createClient } from '@supabase/supabase-js'

// Env vars — must be set in Vercel dashboard for auth to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing env vars — Supabase client will not be functional')
}

// Lazy initialization — only creates client when first used (not at import time).
// This prevents crashes during static analysis / server builds.
let _client: ReturnType<typeof createClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop: string) {
    // Guard: if env vars missing, return a no-op
    if (!supabaseUrl || !supabaseAnonKey) {
      if (prop === 'auth') {
        return new Proxy({}, {
          get(_t, p: string) {
            if (['signInWithPassword', 'signInWithOAuth', 'signInWithOtp', 'getUser', 'getSession'].includes(p)) {
              return async () => {
                throw new Error(
                  'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.'
                )
              }
            }
            return async () => ({ data: null, error: new Error('Supabase not configured') })
          }
        })
      }
      return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    }

    // Lazy init
    if (!_client) {
      _client = createClient(supabaseUrl, supabaseAnonKey)
    }
    return (_client as any)[prop]
  },
})