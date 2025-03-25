import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';
import { handleAuthError, handleError } from '@/lib/error-handler';

// Store the current guest ID in memory
let currentGuestId: string | null = null;

// Create a singleton instance - use any for the schema type to avoid TypeScript errors
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database, any>> | null = null;

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

  try {
    // Use "any" type for schema to avoid TypeScript errors
    supabaseInstance = createSupabaseClient<Database, any>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sb-auth-token',
        detectSessionInUrl: true,
        debug: false,
      },
      global: {
        headers,
        fetch: async (...args) => {
          // Add guest ID header dynamically if it exists
          if (currentGuestId && args[1] && typeof args[1] === 'object') {
            const options = args[1] as RequestInit;
            options.headers = {
              ...options.headers,
              'x-guest-id': currentGuestId
            };
          }

          try {
            const response = await fetch(...args);
            // Check for auth-related errors in the response
            if (!response.ok && (response.status === 401 || response.status === 403)) {
              toast.error("Authentication error. Please log in again.");
              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  window.location.href = '/login';
                }, 2000);
              }
            }
            return response;
          } catch (error) {
            console.error("Fetch error:", error);
            if (!handleAuthError(error)) {
              // If it's not an auth error that we've handled, re-throw it
              throw error;
            }
            // Return a mock response for auth errors we handled
            return new Response(JSON.stringify({ error: 'Authentication error' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        },
      },
      // Set the default schema to public
      db: {
        schema: 'public'
      }
    });

    // Override the auth methods to add error handling
    const originalGetUser = supabaseInstance.auth.getUser.bind(supabaseInstance.auth);
    supabaseInstance.auth.getUser = async function () {
      try {
        return await originalGetUser();
      } catch (error) {
        console.error("getUser error:", error);
        if (!handleAuthError(error)) {
          throw error;
        }
        return { data: { user: null }, error: error as any };
      }
    };

    const originalGetSession = supabaseInstance.auth.getSession.bind(supabaseInstance.auth);
    supabaseInstance.auth.getSession = async function () {
      try {
        return await originalGetSession();
      } catch (error) {
        console.error("getSession error:", error);
        if (!handleAuthError(error)) {
          throw error;
        }
        return { data: { session: null }, error: error as any };
      }
    };

    return supabaseInstance;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    handleError(error, "Error initializing application. Please refresh the page.");
    throw error;
  }
};

// Helper to get authenticated user - more secure than using session directly
export const getAuthenticatedUser = async (options?: { ensureProfile?: boolean }) => {
  const supabase = createClient();
  const { ensureProfile = false } = options || {};

  // Attempt to grab session from localStorage to avoid trying to get a user when there isn't one
  // This prevents unnecessary AuthSessionMissingError in browsers
  if (typeof window !== 'undefined') {
    try {
      const storageKey = 'sb-auth-token';
      const sessionStr = localStorage.getItem(storageKey);

      // If no session in storage, don't even try to get the user
      if (!sessionStr) {
        return null;
      }
    } catch (e) {
      // Ignore errors reading from localStorage (e.g., in incognito mode)
    }
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      handleAuthError(error);
      console.error('Error getting authenticated user:', error);
      return null;
    }

    // If ensureProfile is true, check if the user has a profile and create one if not
    if (ensureProfile && user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // If no profile exists, create one
      if (!profile) {
        console.log(`Creating profile for user ${user.id}`);
        await supabase.from('profiles').insert([{
          id: user.id,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          username: user.user_metadata?.preferred_username || user.user_metadata?.username,
          updated_at: new Date().toISOString()
        }]);
      }
    }

    return user;
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    handleAuthError(error);
    return null;
  }
};

// Helper to get user profile from public schema
export const getUserProfile = async (userId: string) => {
  const supabase = createClient();

  try {
    if (!userId) {
      console.error('getUserProfile called with empty userId');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    handleAuthError(error);
    return null;
  }
};

// Helper to get all user profiles from public schema
export const getAllProfiles = async () => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    handleAuthError(error);
    return [];
  }
};

// Helper to create a user profile if it doesn't exist
export const createUserProfile = async (userId: string, userData: {
  full_name?: string;
  avatar_url?: string;
  username?: string;
  website?: string;
  bio?: string;
}) => {
  const supabase = createClient();

  try {
    if (!userId) {
      console.error('createUserProfile called with empty userId');
      return null;
    }

    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If profile exists, don't create a new one
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}`);
      return await getUserProfile(userId);
    }

    // Insert new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        ...userData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    handleAuthError(error);
    return null;
  }
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
