"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

export interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: NavItem[];
}

export function SidebarNav({ items, className, ...props }: SidebarNavProps) {
  const segment = useSelectedLayoutSegment();

  if (!items?.length) return null;

  return (
    <div
      className={cn(
        "w-48 shrink-0 border-r bg-background p-4 flex flex-col h-full",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 flex-1">
        {items.map((item, index) => {
          // We need to handle the icon properly based on its type
          const IconComponent = item.icon;

          return item.href ? (
            <Link
              aria-label={item.title}
              key={index}
              href={item.href}
              target={item.external ? "_blank" : ""}
              rel={item.external ? "noreferrer" : ""}
            >
              <span
                className={cn(
                  "group flex w-full items-center rounded-md border border-transparent px-2 py-2 mb-1 hover:bg-muted hover:text-foreground",
                  item.href.includes(String(segment))
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground",
                  item.disabled && "pointer-events-none opacity-60"
                )}
              >
                {IconComponent && typeof IconComponent === "function" && (
                  <IconComponent className="mr-2 h-4 w-4" />
                )}
                <span>{item.title}</span>
              </span>
            </Link>
          ) : (
            <span
              key={index}
              className="flex w-full cursor-not-allowed items-center rounded-md p-2 text-muted-foreground hover:underline"
            >
              {item.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}
