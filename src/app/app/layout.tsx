"use client";

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

  return (
    <div className="flex h-screen">
      <SidebarNav items={navItems} />
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto px-6 py-8 h-full">{children}</main>
      </div>
    </div>
  );
}
