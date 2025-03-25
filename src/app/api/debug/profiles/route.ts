import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@/lib/supabase/client';

export async function GET() {
    try {
        // Create server-side supabase client
        const supabase = await createClient();

        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Try to get profile using server client
        const serverResult = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Try to get profile using browser client
        const browserClient = createClientBrowser();
        const browserResult = await browserClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Check if profile exists
        const profileExists = await supabase.from('profiles').select('id').eq('id', user.id);

        // Try to get user metadata
        const userMetadata = user.user_metadata;

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                metadata: userMetadata
            },
            serverResult: {
                data: serverResult.data,
                error: serverResult.error
            },
            browserResult: {
                data: browserResult.data,
                error: browserResult.error
            },
            profileExists: {
                data: profileExists.data,
                error: profileExists.error
            }
        });
    } catch (error: any) {
        console.error('Debug API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 