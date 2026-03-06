"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Heart, ListChecks, Sparkles, Timer, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChefHat },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/approval", label: "Approval", icon: Vote },
  { href: "/shopping/sample", label: "Shopping", icon: ListChecks },
  { href: "/cook/sample", label: "Cook", icon: Timer },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="luxury-shell min-h-screen pb-20">
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur md:left-1/2 md:max-w-xl md:-translate-x-1/2 md:rounded-t-2xl">
        <ul className="grid grid-cols-6">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-xs",
                  pathname?.startsWith(href) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
