import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const hash = request.url.split('#')[1] || '' // Google sends token via hash fragment
  const code = searchParams.get('code')

  // Build a URLSearchParams from the hash fragment
  // Google sends: #access_token=...&expires_in=...&refresh_token=...&sb=...
  // Supabase wants them as query params to exchangeCodeForSession
  let redirectUrl = new URL(`${origin}/auth/callback`)
  if (hash) {
    new URLSearchParams(hash).forEach((value, key) => {
      if (value) redirectUrl.searchParams.set(key, value)
    })
  }
  if (code) redirectUrl.searchParams.set('code', code)

  // If we have an access_token in the hash, use Supabase's token exchange
  // Otherwise fall back to code exchange
  const hasToken = redirectUrl.searchParams.has('access_token')
  const next = searchParams.get('next') ?? '/dashboard'

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (hasToken) {
    // Google OAuth with PKCE returns token in hash — set session from hash params
    const accessToken = redirectUrl.searchParams.get('access_token')
    const expiresIn = parseInt(redirectUrl.searchParams.get('expires_in') || '3600')
    const refreshToken = redirectUrl.searchParams.get('refresh_token') || ''
    const providerToken = redirectUrl.searchParams.get('provider_token') || ''

    const { error } = await supabase.auth.setSession({
      access_token: accessToken!,
      refresh_token: refreshToken || 'dummy_refresh_token',
    })

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  } else if (code) {
    // Magic link or OAuth with code exchange
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}