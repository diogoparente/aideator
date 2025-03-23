import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SerializeOptions } from 'cookie'
import { config, getAuthConfig } from '../config'

// Define proper cookie option types to match what's expected
type CookieOptions = Partial<Omit<SerializeOptions, 'sameSite'> & {
  sameSite?: 'lax' | 'strict' | 'none';
}>

export async function createClient() {
  const cookieStore = await cookies()
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
        getAll() {
          const allCookies = cookieStore.getAll();
          return allCookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options = {} }) => {
              // Cast the options to ensure compatibility
              const secureOptions = secureCookieOptions(options as CookieOptions);
              cookieStore.set(name, value, secureOptions);
            });
          } catch (error) {
            console.error('Error setting cookies:', error);
          }
        }
      }
    }
  );
}