import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Primary purpose: refresh the session so Server Components can read auth state.
  // IMPORTANT: nothing between createServerClient and getUser() — see Supabase SSR docs.
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute    = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute  = request.nextUrl.pathname === '/'

  // Only redirect unauthenticated users away from protected routes.
  // Authenticated-user redirects (e.g. /login → /dashboard) are handled
  // by Server Components and client-side useEffect to avoid cookie-forwarding
  // issues that create redirect loops.
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // Copy any refreshed session cookies so the login page can read them
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions)
    })
    return redirectResponse
  }

  // IMPORTANT: must return supabaseResponse (not a new NextResponse) so that
  // the refreshed session cookies reach the Server Components.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
