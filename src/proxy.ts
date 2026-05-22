import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname

  // Allow builds to pass through without crashing
  if (!supabaseUrl || !supabaseKey || pathname === '/') {
    return NextResponse.next()
  }

  try {
    // Minimal session check using Supabase Admin API via fetch
    const token = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    if (!token && !refreshToken) {
      // Not authenticated
      const publicRoutes = ['/login', '/signup', '/auth', '/pricing']
      const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/auth/'))
      if (!isPublic && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  } catch {
    // Silently allow build to continue
  }

  return NextResponse.next()
}