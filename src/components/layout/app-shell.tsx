"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, ChefHat, Heart, LayoutDashboard, ListChecks, Sparkles, Timer, Vote } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";
import { AmbientOrbs } from "@/components/layout/ambient-orbs";
import { ChefAssistant } from "@/components/modules/chef-assistant";

function isPublicLayout(pathname: string | null) {
  if (!pathname) return false;
  const isApprovalTokenRoute = /^\/approval\/[^/]+$/.test(pathname);
  return pathname === "/login" || isApprovalTokenRoute || pathname.startsWith("/feedback/");
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
    <div className="luxury-shell min-h-screen pb-24 md:pb-10">
      {!publicLayout ? <AmbientOrbs /> : null}
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pt-4 md:px-6 md:pt-6">
        {!publicLayout ? (
          <header className="sticky top-0 z-40 mb-6">
            <div className="glass-surface rounded-[2rem] px-4 py-3 shadow-luxe md:px-5">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard" className="group flex items-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-card-foreground transition hover:bg-white/[0.08]">
                  <span className="rounded-2xl bg-accent-luxury p-2.5 text-primary-foreground shadow-soft">
                    <ChefHat size={17} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{t("app.brandTop", "Gastronomic")}</p>
                    <p className="font-serif text-xl leading-none tracking-[0.045em]">
                      {t("app.brandBottom", "Cuisine")}
                    </p>
                  </div>
                  <ArrowUpRight size={14} className="hidden text-muted-foreground transition group-hover:text-primary md:block" />
                </Link>

                <nav className="hidden min-w-0 flex-1 md:block" aria-label={t("app.nav.aria", "Primary navigation")}>
                  <ul className="flex items-center justify-center gap-1 px-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                      const active = pathname?.startsWith(href);
                      return (
                        <li key={href} className="relative shrink-0">
                          <Link
                            href={href}
                            className={cn(
                              "relative z-10 flex items-center gap-2 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium transition lg:px-3.5",
                              active ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground",
                            )}
                          >
                            {active ? (
                              <motion.span
                                layoutId="desktop-active-route"
                                className="absolute inset-0 -z-10 rounded-[1.25rem] border border-primary/20 bg-white/[0.08] shadow-soft"
                                transition={{ type: "spring", stiffness: 340, damping: 34 }}
                              />
                            ) : null}
                            <Icon size={16} className={cn(active ? "text-primary" : "text-muted-foreground")} />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="ml-auto flex items-center gap-2">
                  <LocaleSwitcher />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </header>
        ) : null}

        <main className="flex-1 pb-6">{children}</main>
      </div>
      {!publicLayout ? <ChefAssistant /> : null}
      {!publicLayout ? (
        <nav className="fixed inset-x-2 bottom-2 z-50 rounded-[2rem] border border-white/10 bg-premium-panel p-1.5 shadow-luxe backdrop-blur-2xl md:hidden">
          <ul className="grid grid-cols-6 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    className={cn(
                      "relative z-10 flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold transition",
                      active ? "text-card-foreground" : "text-[hsl(var(--nav-inactive))] hover:text-card-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active ? (
                      <motion.span
                        layoutId="mobile-active-route"
                        className="absolute inset-0 -z-10 rounded-2xl border border-primary/20 bg-white/[0.08]"
                        transition={{ type: "spring", stiffness: 340, damping: 34 }}
                      />
                    ) : null}
                    <Icon size={17} className={cn(active ? "text-primary" : "text-[hsl(var(--nav-inactive))]")} />
                    <span className="truncate">{label}</span>
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
