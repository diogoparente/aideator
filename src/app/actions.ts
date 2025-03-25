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
            return { success: false, error: 'User authentication required' };
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
        if (!user && !isDev) {
            return { success: false, error: 'Authentication required' };
        }

        // Verify user ID matching in production
        if (user && user.id !== userId && !isDev) {
            return { success: false, error: 'User ID mismatch' };
        }

        // Use upsert for better performance (creates or updates in a single operation)
        const { data, error } = await supabase
            .from('clicks')
            .upsert({
                id: playerId,
                user_id: userId,
                qty: qty
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
            newCount: data?.qty || qty
        };
    } catch (error) {
        console.error('Update click action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}