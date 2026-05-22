import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const accessToken = searchParams.get('access_token')
  const next = searchParams.get('next') || '/dashboard'
  const errorParam = searchParams.get('error')

  // Log what we received for debugging
  console.log('=== AUTH CALLBACK ===')
  console.log('URL:', request.url)
  console.log('code:', code)
  console.log('access_token:', accessToken ? '(present)' : '(missing)')
  console.log('next:', next)
  console.log('error:', errorParam)
  console.log('cookies:', request.cookies.getAll().map(c => c.name))

  // Handle Supabase error params (e.g. ?error=...)
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`)
  }

  // Must have either code or access_token
  if (!code && !accessToken) {
    return NextResponse.redirect(`${origin}/login?error=no_code_or_token`)
  }

  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  if (code) {
    console.log('Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Session error:', error?.message)
    console.log('User:', data.user?.email)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  } else if (accessToken) {
    console.log('Setting session from access_token...')
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: searchParams.get('refresh_token') || 'placeholder',
    })
    console.log('setSession error:', error?.message)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}