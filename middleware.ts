import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/.*)
     * - supabase routes (/supabase/.*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (next.js data files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc)
     */
    "/((?!api|supabase|_next/static|_next/image|_next/data|favicon.ico|placeholder.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
