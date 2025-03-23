import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Store the current guest ID in memory
let currentGuestId: string | null = null;

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

// Initialize the Supabase client
export const createClient = (guestId?: string) => {
  // If we already have an instance, return it
  if (supabaseInstance !== null) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key must be defined in environment variables');
  }

  // If a guest ID is provided, store it for future use
  if (guestId && guestId.startsWith('guest-')) {
    currentGuestId = guestId;
  }

  // Get headers for the request
  const headers: Record<string, string> = {};

  // Add guest ID to headers if available
  if (currentGuestId) {
    headers['x-guest-id'] = currentGuestId;
  }

  supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers,
      fetch: (...args) => {
        // Add guest ID header dynamically if it exists
        if (currentGuestId && args[1] && typeof args[1] === 'object') {
          const options = args[1] as RequestInit;
          options.headers = {
            ...options.headers,
            'x-guest-id': currentGuestId
          };
        }
        return fetch(...args);
      },
    },
  });

  return supabaseInstance;
};

// Helper to get authenticated user - more secure than using session directly
export const getAuthenticatedUser = async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }

  return user;
};

// Set the current guest ID
export const setGuestId = (guestId: string | null) => {
  if (guestId === null || guestId.startsWith('guest-')) {
    currentGuestId = guestId;
  } else {
    console.error('Invalid guest ID format. Must start with "guest-"');
  }
};

// Get the current guest ID
export const getGuestId = () => {
  return currentGuestId;
};

// Clear the guest ID (e.g., when signing out)
export const clearGuestId = () => {
  currentGuestId = null;
};

// Reset the Supabase instance (useful for testing or when auth state changes)
export const resetSupabaseClient = () => {
  supabaseInstance = null;
};
