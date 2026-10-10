import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  const protectedRoutes = ['/customer', '/bengkel', '/mekanik', '/admin']
  const isProtectedRoute = protectedRoutes.some((route) => url.pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Mendukung role 'bengkel' maupun 'pemilik_bengkel'
    let role = profile?.role || 'customer'
    if (role === 'pemilik_bengkel') {
      role = 'bengkel'
    }

    // Proteksi Hak Akses
    if (url.pathname.startsWith('/customer') && role !== 'customer') {
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
    if (url.pathname.startsWith('/bengkel') && role !== 'bengkel') {
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
    if (url.pathname.startsWith('/mekanik') && role !== 'mekanik') {
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/customer/:path*', '/bengkel/:path*', '/mekanik/:path*', '/admin/:path*'],
}