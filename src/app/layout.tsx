import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supabase Auth Example",
  description: "A simple example of how to use Supabase Auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Analytics */}
        <Analytics />
        <SupabaseProvider>
          <TooltipProvider>
            <SidebarProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster position="top-center" closeButton richColors />
        </SupabaseProvider>
      </body>
    </html>
  );
}
