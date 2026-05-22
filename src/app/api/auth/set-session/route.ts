import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { access_token, refresh_token } = body

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
  }

  const origin = new URL(request.url).origin

  const supabaseResponse = NextResponse.redirect(`${origin}/dashboard`)

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
              path: '/',
            })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return supabaseResponse
}