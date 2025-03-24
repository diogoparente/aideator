import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
        <SupabaseProvider>
          <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarTrigger />
            <main>
              <div className="flex">
                <div className="w-full">
                  {children}
                </div>
              </div>
            </main>
            <Toaster />
          </SidebarProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
