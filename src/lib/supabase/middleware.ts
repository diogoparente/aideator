import { createServerClient } from '@supabase/ssr'
import { AuthError } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/en',
  '/de',
  '/auth',
  '/login',
  // Add any other public routes here
]

// Check if the current path matches any of the public routes
const isPublicRoute = (path: string) => {
  return publicRoutes.some(route => {
    // Exact match
    if (route === path) return true
    // Path starts with route + '/'
    if (path.startsWith(`${route}/`)) return true
    // Special case for auth and login routes
    if (route === '/auth' && path.startsWith('/auth')) return true
    if (route === '/login' && path.startsWith('/login')) return true
    return false
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Check if the current path is a public route
    const isPublic = isPublicRoute(request.nextUrl.pathname)

    // If there's an authentication error and user is trying to access a protected route
    if (
      error &&
      error instanceof AuthError &&
      error.name === "AuthSessionMissingError" &&
      !isPublic
    ) {
      // Clear any invalid sessions by redirecting to login page
      const url = request.nextUrl.clone()
      url.pathname = '/login'

      // Create a response with redirected URL
      const response = NextResponse.redirect(url)

      // Get all cookies and remove session cookies
      const cookies = request.cookies.getAll()
      cookies.forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
          response.cookies.delete(cookie.name)
        }
      })

      return response
    }

    if (
      !user &&
      !isPublic
    ) {
      // no user and not a public route, redirect to login page
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

  } catch (error: unknown) {
    console.error('Middleware error:', error)

    // If we get an auth error and it's not a public route, redirect to login and clear cookies
    if (error instanceof AuthError && error.name === "AuthSessionMissingError" && !isPublicRoute(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'

      // Create a response with redirected URL
      const response = NextResponse.redirect(url)

      // Get all cookies and remove session cookies
      const cookies = request.cookies.getAll()
      cookies.forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
          response.cookies.delete(cookie.name)
        }
      })

      return response
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}