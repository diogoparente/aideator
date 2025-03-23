'use client';

import { createClient } from '@/lib/supabase/client';
import { Provider } from 'react-supabase';
import { ReactNode, useMemo, useRef, useEffect } from 'react';

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
    <Provider value={supabase}>
      {children}
    </Provider>
  );
}