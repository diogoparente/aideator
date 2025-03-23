import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log("Auth callback called with code:", code ? "Code exists" : "No code")

    if (code) {
        try {
            const supabase = await createClient()

            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            console.log("Exchange code result:", {
                session: data.session ? "Session exists" : "No session",
                user: data.user ? "User exists" : "No user",
                error
            })

            if (error) {
                console.error("Error exchanging auth code:", error)
                // Still redirect to avoid leaving user on callback page
                return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url))
            }
        } catch (error) {
            console.error("Exception in auth callback:", error)
            return NextResponse.redirect(new URL('/login?error=auth_callback_exception', request.url))
        }
    } else {
        console.log("No code provided in auth callback")
        return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // URL to redirect to after sign in process completes
    console.log("Auth callback successful, redirecting to dashboard")
    return NextResponse.redirect(new URL('/dashboard', request.url))
} 