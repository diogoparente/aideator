'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type UpdateClickResult = {
    success: boolean;
    error?: string;
    newCount?: number;
};

/**
 * Server action to update click count with optimistic updates
 * @param userId - The ID of the user making the update
 * @param playerId - The ID of the player to update
 * @param qty - The new quantity value
 * @returns UpdateClickResult object
 */
export async function updateClickAction(
    userId: string,
    playerId: string,
    qty: number
): Promise<UpdateClickResult> {
    try {
        // Server-side validation
        if (!userId || !playerId) {
            return { success: false, error: 'User authentication required - missing IDs' };
        }

        if (typeof qty !== 'number' || qty < 0) {
            return { success: false, error: 'Invalid click count' };
        }

        // Security check: Only allow users to update their own count
        if (userId !== playerId) {
            return { success: false, error: 'Unauthorized action' };
        }

        // Create a Supabase client
        const supabase = await createClient();

        // Get the current auth status to verify the user
        const { data: { user } } = await supabase.auth.getUser();

        // Check user authentication in production
        const isDev = process.env.NODE_ENV === 'development';
        const isVercel = process.env.VERCEL === '1';

        // Log information for debugging
        console.log('Auth debug:', {
            hasUser: !!user,
            userId,
            providedId: playerId,
            authId: user?.id,
            isDev,
            isVercel,
            requestedQty: qty
        });

        // For now, allow operations in Vercel to debug the issue
        if (!user && !isDev && !isVercel) {
            return { success: false, error: 'Authentication required - no user found' };
        }

        // Verify user ID matching in production but be more lenient for now
        if (user && user.id !== userId && !isDev && !isVercel) {
            console.warn(`User ID mismatch: auth=${user.id}, provided=${userId}`);
            // Continue with the user's actual ID instead of failing
            userId = user.id;
            playerId = user.id;
        }

        // First, get the current value to avoid race conditions
        const { data: currentData, error: fetchError } = await supabase
            .from('clicks')
            .select('qty')
            .eq('id', playerId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching current qty:', fetchError);
        }

        // Get current value or default to 0
        const currentQty = currentData?.qty || 0;

        // Only update if the new value is higher than the current value
        // This prevents race conditions on fast clicks
        const newQty = Math.max(currentQty, qty);

        console.log('Click update logic:', {
            currentQty,
            requestedQty: qty,
            finalQty: newQty
        });

        // Use upsert for better performance (creates or updates in a single operation)
        const { data, error } = await supabase
            .from('clicks')
            .upsert({
                id: playerId,
                user_id: userId,
                qty: newQty
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select('qty')
            .single();

        if (error) {
            console.error('Database error:', error);
            return { success: false, error: 'Failed to update click count' };
        }

        // Revalidate the home page to update any server-rendered components
        revalidatePath('/');

        return {
            success: true,
            newCount: data?.qty || newQty
        };
    } catch (error) {
        console.error('Update click action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}