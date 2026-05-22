import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow these paths without auth
  const publicPaths = ['/auth', '/demo', '/api/health', '/_next', '/favicon.ico']
  if (publicPaths.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next()
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    // Not configured — redirect protected routes to demo
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/design')) {
      return NextResponse.redirect(new URL('/demo', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
