import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CookieOptions } from '@supabase/ssr'

// Config object for environment settings
const config = {
  isProduction: process.env.NODE_ENV === 'production',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

// Auth configuration function
function getAuthConfig() {
  return {
    cookieDomain: process.env.COOKIE_DOMAIN || undefined
  }
}

export async function createClient() {
  const cookieStore = cookies()
  const authConfig = getAuthConfig()
  const cookieDomain = config.isProduction ? authConfig.cookieDomain : undefined

  // Create secure cookie handlers
  const secureCookieOptions = (options: CookieOptions = {}) => {
    return config.isProduction ? {
      ...options,
      secure: true,
      httpOnly: true,
      sameSite: 'none' as const,
      domain: cookieDomain,
      path: '/'
    } : {
      ...options,
      secure: true,
      sameSite: 'lax' as const,
      path: '/'
    }
  }

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-auth-token',
        debug: false // Explicitly disable debug mode
      },
      cookies: {
        async getAll() {
          const resolvedCookieStore = await cookieStore
          return resolvedCookieStore.getAll()
        },
        async setAll(cookies) {
          try {
            const resolvedCookieStore = await cookieStore
            cookies.forEach(({ name, value, options = {} }) => {
              const secureOptions = secureCookieOptions(options)
              resolvedCookieStore.set(name, value, secureOptions)
            })
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        }
      }
    }
  )
}