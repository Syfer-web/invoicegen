import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing env vars — Supabase client will not be functional')
}

let _client: ReturnType<typeof createClient> | null = null

// Lazy-initialization client that defers createClient() until first use.
// Avoids throwing at module-eval time during static prerendering (Vercel builds).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = new Proxy({}, {
  get(_target, prop) {
    if (!_client) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase env vars not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        )
      }
      _client = createClient(supabaseUrl, supabaseAnonKey)
    }
    return (_client as any)[prop]
  },
})