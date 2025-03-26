"use client";

import { redirect } from "next/navigation";
import { Search, Lightbulb, Cog } from "lucide-react";
import { NavItem } from "@/types";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { SidebarNav } from "@/components/siderbar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("AppLayout");
  const { user, loading } = useUser();
  const navItems: NavItem[] = [
    {
      title: t("dashboard"),
      href: "/app/dashboard",
      icon: Search,
    },
    { title: t("ideas"), href: "/app/ideas", icon: Lightbulb },
    {
      title: t("settings"),
      href: "/app/settings",
      icon: Cog,
    },
  ];

  // Handle loading state
  if (!loading) {
    return <div>{t("loading")}</div>;
  }

  // If no user is found, redirect to sign-in
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <SidebarNav items={navItems} />
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto px-6 py-8 h-full">
          <div className="flex items-center justify-end">
            <div className="flex space-x-4 items-center">
              <ThemeToggle />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
