"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChefHat, Heart, LayoutDashboard, ListChecks, Sparkles, Timer, Vote } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/approval", label: "Approval", icon: Vote },
  { href: "/shopping", label: "Shopping", icon: ListChecks },
  { href: "/cook", label: "Cook", icon: Timer },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

function isPublicLayout(pathname: string | null) {
  if (!pathname) return false;
  const isApprovalTokenRoute = /^\/approval\/[^/]+$/.test(pathname);
  return pathname === "/login" || isApprovalTokenRoute || pathname.startsWith("/feedback/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicLayout = isPublicLayout(pathname);

  return (
    <div className="luxury-shell min-h-screen pb-24">
      {!publicLayout ? (
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5 md:px-8 md:pt-7">
          <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-card/70 px-4 py-2 backdrop-blur-md">
            <span className="rounded-xl bg-primary p-2 text-primary-foreground">
              <ChefHat size={16} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gastronomic</p>
              <p className="font-serif text-xl leading-none">Cuisine</p>
            </div>
          </div>
          <LogoutButton />
        </header>
      ) : null}
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      {!publicLayout ? (
        <nav className="fixed inset-x-2 bottom-2 z-50 border border-border/70 bg-card/90 p-1.5 shadow-luxe backdrop-blur-xl md:left-1/2 md:max-w-2xl md:-translate-x-1/2 md:rounded-3xl">
          <ul className="grid grid-cols-6 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-[11px] font-medium transition md:text-xs",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="active-route"
                        className="absolute inset-0 -z-10 rounded-2xl bg-primary/12"
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                      />
                    ) : null}
                    <Icon size={16} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
