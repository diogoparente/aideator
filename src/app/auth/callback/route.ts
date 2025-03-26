import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // Note: We're not using the returned data, just checking for errors
    } catch (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_exception", request.url)
      );
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/app/dashboard", request.url));
}
