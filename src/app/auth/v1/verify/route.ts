import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    const redirectTo = requestUrl.searchParams.get('redirect_to') || '/'

    // Check if we have the required parameters
    if (!token || !type) {
        console.error('Missing token or type in verification URL')
        return NextResponse.redirect(new URL('/login?error=missing_verification_params', request.url))
    }

    try {
        const supabase = await createClient()

        // Verify the user's email
        // This is handled automatically by Supabase when the user clicks the link,
        // but we need to handle the redirect

        // After verification, get the user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            console.error('Error getting session after verification:', sessionError)
            return NextResponse.redirect(new URL('/login?error=verification_session_error', request.url))
        }

        // If the user is authenticated, redirect to the dashboard
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // If not authenticated, redirect to login with a success message
        return NextResponse.redirect(new URL('/login?success=verification_complete', request.url))
    } catch (error) {
        console.error('Error during verification:', error)
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
    }
} 