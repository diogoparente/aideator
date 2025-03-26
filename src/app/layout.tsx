import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Shell } from "@/components/shell";

// Import messages directly
import enMessages from "../../messages/en.json";

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
  // Set default locale
  const locale = "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col justify-center`}
        suppressHydrationWarning
      >
        {/* Wrap the entire app with NextIntlClientProvider */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={enMessages}>
            {/* Analytics */}
            <Analytics />
            <SupabaseProvider>
              <TooltipProvider>
                <SidebarProvider>
                  <ErrorBoundary>
                    <Shell>{children}</Shell>
                  </ErrorBoundary>
                </SidebarProvider>
              </TooltipProvider>
              <Toaster position="top-center" closeButton richColors />
            </SupabaseProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
