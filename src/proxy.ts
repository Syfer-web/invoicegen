import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname

  // Allow builds to pass through without crashing
  if (!supabaseUrl || !supabaseKey || pathname === '/') {
    return NextResponse.next()
  }

  // Public routes that don't need auth
  const publicRoutes = [
    '/login', '/signup', '/auth', '/pricing',
    '/callback',   // OAuth PKCE callback — receives tokens via URL fragment
    '/auth/confirm',
  ]
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/auth/'))

  if (isPublic) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookies
  const token = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  if (!token && !refreshToken) {
    // Check if this is a protected app route
    if (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/invoices') ||
        pathname.startsWith('/clients') ||
        pathname.startsWith('/products') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/recurring')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}