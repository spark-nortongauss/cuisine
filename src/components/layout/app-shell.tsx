"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChefHat, Heart, LayoutDashboard, ListChecks, Sparkles, Timer, Vote } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";
import { AmbientOrbs } from "@/components/layout/ambient-orbs";
import { ChefAssistant } from "@/components/modules/chef-assistant";

function isPublicLayout(pathname: string | null) {
  if (!pathname) return false;
  const isApprovalTokenRoute = /^\/approval\/[^/]+$/.test(pathname);
  return pathname === "/login" || pathname === "/landing" || isApprovalTokenRoute || pathname.startsWith("/feedback/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicLayout = isPublicLayout(pathname);
  const { t } = useI18n();

  const navItems = [
    { href: "/dashboard", label: t("app.nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { href: "/generate", label: t("app.nav.generate", "Generate"), icon: Sparkles },
    { href: "/approval", label: t("app.nav.approval", "Approval"), icon: Vote },
    { href: "/shopping", label: t("app.nav.shopping", "Shopping"), icon: ListChecks },
    { href: "/cook", label: t("app.nav.cook", "Cook"), icon: Timer },
    { href: "/favorites", label: t("app.nav.favorites", "Favorites"), icon: Heart },
  ];

  return (
    <div className="luxury-shell min-h-screen pb-24">
      {!publicLayout ? <AmbientOrbs /> : null}
      {!publicLayout ? (
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pt-5 md:px-8 md:pt-7">
          <div className="flex items-center gap-3 rounded-3xl border border-accent/40 bg-card/95 px-4 py-3 text-card-foreground shadow-luxe backdrop-blur-xl">
            <span className="rounded-2xl bg-accent-luxury p-2 text-accent-foreground shadow-soft">
              <ChefHat size={16} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{t("app.brandTop", "Gastronomic")}</p>
              <p className="font-serif text-xl leading-none tracking-[0.045em]">{t("app.brandBottom", "Cuisine")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <LogoutButton />
          </div>
        </header>
      ) : null}
      <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      {!publicLayout ? <ChefAssistant /> : null}
      {!publicLayout ? (
        <nav className="fixed inset-x-2 bottom-2 z-50 rounded-3xl border border-accent/40 bg-card/95 p-1.5 shadow-luxe backdrop-blur-xl md:left-1/2 md:max-w-3xl md:-translate-x-1/2">
          <ul className="grid grid-cols-6 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition md:text-xs",
                      active ? "text-card-foreground" : "text-[hsl(var(--nav-inactive))] hover:text-card-foreground",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="active-route"
                        className="absolute inset-0 -z-10 rounded-2xl border border-accent/70 bg-gradient-to-br from-accent/75 to-accent/40"
                        transition={{ type: "spring", stiffness: 340, damping: 34 }}
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
