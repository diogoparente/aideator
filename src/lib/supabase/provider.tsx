'use client';

import { createClient } from '@/lib/supabase/client';
import { ReactNode, useMemo, useRef, useEffect, createContext, useContext } from 'react';

// Create a context for the Supabase client
const SupabaseContext = createContext<ReturnType<typeof createClient> | undefined>(undefined);

// Hook to use the Supabase client
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Create a memoized client to avoid unnecessary re-renders
  const supabase = useMemo(() => createClient(), []);

  // Add a ref to track initialization
  const initialized = useRef(false);

  // Ensure realtime is properly initialized
  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      initialized.current = true;

      // Make sure realtime is connected
      try {
        const channel = supabase.channel('system');
        channel.subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error initializing realtime:', error);
      }
    }
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}