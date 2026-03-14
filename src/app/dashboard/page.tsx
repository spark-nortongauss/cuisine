import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, ImageIcon, ListChecks, ShoppingBasket, Sparkles, Timer, Vote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { localizeMealType, localizeMenuStatus } from "@/lib/i18n/labels";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { isShoppingItemComplete } from "@/lib/shopping-status";

type MenuOptionRow = {
  id: string;
  option_no: number;
  title: string | null;
  michelin_name: string | null;
  hero_image_path: string | null;
};

type MenuRow = {
  id: string;
  title: string | null;
  meal_type: string | null;
  serve_at: string | null;
  invitee_count: number | null;
  status: string;
  updated_at: string;
  approved_option_id: string | null;
  menu_options: MenuOptionRow[] | null;
};

type SuggestedMenuCard = {
  id: string;
  title: string;
  mealType: string;
  guests: number | null;
  serveAt: string | null;
  status: string;
  heroImageUrl: string | null;
  href: string;
};

export default async function DashboardRoutePage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  const supabase = createSupabaseAdminClient();
  const { data: menuRows } = await supabase
    .from("menus")
    .select("id, title, meal_type, serve_at, invitee_count, status, updated_at, approved_option_id, menu_options(id, option_no, title, michelin_name, hero_image_path)")
    .eq("owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(30);

  const allMenus: MenuRow[] = (menuRows ?? []) as MenuRow[];
  const menuIds = allMenus.map((menu) => menu.id);

  const { data: shoppingRows } = await supabase
    .from("shopping_lists")
    .select("id, menu_id, menus!inner(owner_id), shopping_items(id, purchased, status)")
    .eq("menus.owner_id", user?.id ?? "");

  const { data: cookRows } = await supabase
    .from("cook_plans")
    .select("id, menu_id, updated_at, menus!inner(owner_id, serve_at)")
    .eq("menus.owner_id", user?.id ?? "");

  const { data: favoriteRows } = await supabase
    .from("menu_favorites")
    .select("menu_id, rating_percent, menus(title, meal_type, approved_option_id, menu_options(id, title, michelin_name))")
    .eq("owner_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(4);

  const curatedBase = allMenus
    .filter((menu) => menu.approved_option_id || ["approved", "selected", "validated"].includes(menu.status))
    .slice(0, 8);
  const suggestionsBase = curatedBase.length ? curatedBase : allMenus.slice(0, 8);

  const suggestedMenus: SuggestedMenuCard[] = await Promise.all(
    suggestionsBase.map(async (menu) => {
      const options = (menu.menu_options ?? []) as MenuOptionRow[];
      const selectedOption = options.find((option) => option.id === menu.approved_option_id) ?? options[0] ?? null;
      const heroImageUrl = await resolveStorageImageUrl({ supabase, path: selectedOption?.hero_image_path });
      const menuTitle = resolveMenuDisplayTitle(menu, selectedOption);
      const href = menu.approved_option_id ? `/approval/menus/${menu.id}` : "/approval";
      return {
        id: menu.id,
        title: menuTitle,
        mealType: localizeMealType(menu.meal_type, t),
        guests: menu.invitee_count,
        serveAt: menu.serve_at,
        status: localizeMenuStatus(menu.status, t),
        heroImageUrl,
        href,
      };
    }),
  );

  const pendingApprovals = allMenus.filter((menu) => !menu.approved_option_id && ["draft", "generated", "pending"].includes(menu.status)).length;
  const shoppingLists = (shoppingRows ?? []).map((row) => ({
    id: row.id,
    menuId: row.menu_id,
    items: row.shopping_items ?? [],
  }));
  const pendingShoppingItems = shoppingLists.reduce((total, list) => (
    total + list.items.filter((item) => !isShoppingItemComplete(item.status, item.purchased)).length
  ), 0);
  const shoppingItemsTotal = shoppingLists.reduce((total, list) => total + list.items.length, 0);
  const shoppingCompletionPct = shoppingItemsTotal
    ? Math.round(((shoppingItemsTotal - pendingShoppingItems) / shoppingItemsTotal) * 100)
    : 0;

  const cookPlans = (cookRows ?? []).map((row) => {
    const menu = Array.isArray(row.menus) ? row.menus[0] : row.menus;
    return {
      menuId: row.menu_id,
      serveAt: menu?.serve_at ?? null,
    };
  });
  const now = Date.now();
  const soonThresholdMs = 1000 * 60 * 60 * 30;
  const upcomingCookPlans = cookPlans.filter((plan) => {
    if (!plan.serveAt) return false;
    const serviceAt = new Date(plan.serveAt).getTime();
    return serviceAt >= now && serviceAt <= now + soonThresholdMs;
  }).length;

  const recentMenus = allMenus.slice(0, 5).map((menu) => {
    const hasCookPlan = cookPlans.some((plan) => plan.menuId === menu.id);
    const hasShoppingList = shoppingLists.some((list) => list.menuId === menu.id);
    const options = (menu.menu_options ?? []) as MenuOptionRow[];
    const selectedOption = options.find((option) => option.id === menu.approved_option_id) ?? options[0] ?? null;
    const href = hasCookPlan ? `/cook/${menu.id}` : hasShoppingList ? `/shopping/${menu.id}` : menu.approved_option_id ? `/approval/menus/${menu.id}` : "/generate";

    return {
      id: menu.id,
      title: resolveMenuDisplayTitle(menu, selectedOption),
      mealType: localizeMealType(menu.meal_type, t),
      serveAt: menu.serve_at,
      status: localizeMenuStatus(menu.status, t),
      href,
    };
  });

  const favorites = (favoriteRows ?? []).map((favorite) => {
    const menu = Array.isArray(favorite.menus) ? favorite.menus[0] : favorite.menus;
    const options = (menu?.menu_options ?? []) as MenuOptionRow[];
    const selectedOption = options.find((option) => option.id === menu?.approved_option_id) ?? options[0] ?? null;
    return {
      id: favorite.menu_id,
      title: resolveMenuDisplayTitle(menu, selectedOption),
      rating: Math.round(favorite.rating_percent),
      mealType: localizeMealType(menu?.meal_type, t),
    };
  });

  const actionItems = [
    pendingApprovals > 0
      ? {
          key: "approvals",
          icon: Vote,
          title: t("dashboard.actions.pendingApprovalsTitle", "Pending approvals"),
          description: t("dashboard.actions.pendingApprovalsDescription", `${pendingApprovals} menu approvals need your decision.`),
          cta: t("dashboard.actions.reviewApprovals", "Review approvals"),
          href: "/approval",
          priority: 4,
        }
      : null,
    pendingShoppingItems > 0
      ? {
          key: "shopping",
          icon: ShoppingBasket,
          title: t("dashboard.actions.shoppingTitle", "Shopping follow-up"),
          description: t("dashboard.actions.shoppingDescription", `${pendingShoppingItems} shopping items still need action.`),
          cta: t("dashboard.actions.openShopping", "Open shopping"),
          href: "/shopping",
          priority: 3,
        }
      : null,
    upcomingCookPlans > 0
      ? {
          key: "cook",
          icon: Timer,
          title: t("dashboard.actions.cookTitle", "Cook plans coming soon"),
          description: t("dashboard.actions.cookDescription", `${upcomingCookPlans} services are scheduled soon.`),
          cta: t("dashboard.actions.openCook", "Open cook plans"),
          href: "/cook",
          priority: 2,
        }
      : null,
    favorites.length > 0
      ? {
          key: "favorites",
          icon: Sparkles,
          title: t("dashboard.actions.favoritesTitle", "Favorites ready to relaunch"),
          description: t("dashboard.actions.favoritesDescription", "Reuse your highest-rated signature menus in one click."),
          cta: t("dashboard.actions.openFavorites", "Open favorites"),
          href: "/favorites",
          priority: 1,
        }
      : null,
  ]
    .filter((action): action is NonNullable<typeof action> => Boolean(action))
    .sort((a, b) => b.priority - a.priority);

  const operationalSnapshot = [
    { label: t("dashboard.metrics.menusInFlow", "Menus in flow"), value: String(allMenus.length) },
    { label: t("dashboard.metrics.pendingActions", "Pending actions"), value: String(actionItems.length) },
    { label: t("dashboard.metrics.shoppingReadiness", "Shopping readiness"), value: `${shoppingCompletionPct}%` },
    { label: t("dashboard.metrics.favoriteSignatures", "Favorite signatures"), value: String(favorites.length) },
  ];

  const hasData = menuIds.length > 0;

  return (
    <section className="space-y-6 md:space-y-8">
      <PageHero
        eyebrow={t("dashboard.eyebrow", "Culinary Command Center")}
        title={t("dashboard.title", "Run every service with confidence, precision, and Michelin-level polish")}
        description={t("dashboard.description", "Your premium cockpit for menu curation, approvals, shopping execution, and cook readiness across upcoming services.")}
        chips={[t("dashboard.chips.curated", "Curated Menus"), t("dashboard.chips.operations", "Service Operations"), t("dashboard.chips.control", "Executive Control")]}
      />

      <div className="grid gap-3 md:grid-cols-4">
        {operationalSnapshot.map((metric) => (
          <Card key={metric.label} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
            <p className="font-serif text-3xl text-card-foreground">{metric.value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("dashboard.suggested.eyebrow", "Suggested Menus")}</p>
            <h2 className="font-serif text-3xl text-card-foreground">{t("dashboard.suggested.title", "Curated suggestions for your next service")}</h2>
          </div>
          <Link href="/approval" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {t("dashboard.suggested.viewAll", "View all")}
            <ArrowRight size={14} />
          </Link>
        </div>

        {suggestedMenus.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {suggestedMenus.map((menu) => (
              <Link key={menu.id} href={menu.href} className="group">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
                  {menu.heroImageUrl ? (
                    <img src={menu.heroImageUrl} alt={menu.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/10 via-card to-accent/25 text-sm text-muted-foreground">
                      <ImageIcon size={16} className="mr-2" />
                      {t("dashboard.suggested.placeholder", "Signature image coming soon")}
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-2xl leading-tight text-card-foreground">{menu.title}</p>
                      <Badge variant="accent">{menu.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {menu.mealType}
                      {menu.guests ? ` · ${menu.guests} ${t("dashboard.suggested.guests", "guests")}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {menu.serveAt ? formatWithLocale(locale, new Date(menu.serveAt), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate", "No service date")}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {t("dashboard.suggested.openDetails", "Open details")}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
            {t("dashboard.suggested.empty", "No suggested menus yet. Generate your first curated service to unlock recommendations.")}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("dashboard.actions.eyebrow", "Next in Service")}</p>
              <h2 className="font-serif text-3xl text-card-foreground">{t("dashboard.actions.title", "Upcoming culinary actions")}</h2>
            </div>
            <ListChecks size={18} className="text-primary" />
          </div>

          {actionItems.length ? (
            <div className="space-y-3">
              {actionItems.map((action) => {
                const Icon = action.icon;
                return (
                  <div key={action.key} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-semibold text-card-foreground"><Icon size={15} className="text-primary" />{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <Link href={action.href} className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
                        {action.cta}
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              {t("dashboard.actions.allClear", "Everything is in excellent shape. No urgent actions right now.")}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("dashboard.progress.eyebrow", "Operational Readiness")}</p>
            <h2 className="font-serif text-3xl text-card-foreground">{t("dashboard.progress.title", "Service progress summary")}</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-card-foreground">{t("dashboard.progress.approval", "Approval")}</p>
                <p className="text-muted-foreground">{allMenus.filter((menu) => Boolean(menu.approved_option_id)).length}/{allMenus.length || 1}</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${allMenus.length ? (allMenus.filter((menu) => Boolean(menu.approved_option_id)).length / allMenus.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-card-foreground">{t("dashboard.progress.shopping", "Shopping")}</p>
                <p className="text-muted-foreground">{shoppingCompletionPct}%</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-success" style={{ width: `${shoppingCompletionPct}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-card-foreground">{t("dashboard.progress.cook", "Cook readiness")}</p>
                <p className="text-muted-foreground">{cookPlans.length}</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-warning" style={{ width: `${allMenus.length ? Math.min(100, (cookPlans.length / allMenus.length) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.recent.eyebrow", "Recent Menus")}</p>
            <Clock3 size={15} className="text-primary" />
          </div>
          {recentMenus.length ? (
            <div className="space-y-2">
              {recentMenus.map((menu) => (
                <Link key={menu.id} href={menu.href} className="block rounded-xl border border-border/70 bg-card/70 p-3 transition hover:border-primary/40">
                  <p className="font-medium text-card-foreground">{menu.title}</p>
                  <p className="text-xs text-muted-foreground">{menu.mealType} · {menu.status}</p>
                  <p className="text-xs text-muted-foreground">{menu.serveAt ? formatWithLocale(locale, new Date(menu.serveAt), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate", "No service date")}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.recent.empty", "No recent menus yet.")}</p>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.favorites.eyebrow", "Favorites Snapshot")}</p>
            <CheckCircle2 size={15} className="text-primary" />
          </div>
          {favorites.length ? (
            <div className="space-y-2">
              {favorites.map((favorite) => (
                <Link key={favorite.id} href={`/favorites/${favorite.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-3 transition hover:border-primary/40">
                  <div>
                    <p className="font-medium text-card-foreground">{favorite.title}</p>
                    <p className="text-xs text-muted-foreground">{favorite.mealType}</p>
                  </div>
                  <Badge variant="accent">{favorite.rating}%</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.favorites.empty", "High-rated menus will appear here once feedback is collected.")}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/generate" className="inline-flex items-center gap-2 rounded-full border border-primary/35 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={13} />
              {t("dashboard.shortcuts.generate", "Quick generate")}
            </Link>
            <Link href="/approval" className="inline-flex items-center gap-2 rounded-full border border-primary/35 px-3 py-1.5 text-xs font-semibold text-primary">
              <Vote size={13} />
              {t("dashboard.shortcuts.approval", "Approve menus")}
            </Link>
            <Link href="/shopping" className="inline-flex items-center gap-2 rounded-full border border-primary/35 px-3 py-1.5 text-xs font-semibold text-primary">
              <ShoppingBasket size={13} />
              {t("dashboard.shortcuts.shopping", "Open shopping")}
            </Link>
          </div>
        </Card>
      </div>

      {!hasData ? (
        <Card variant="feature" className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.empty.eyebrow", "Start Here")}</p>
            <p className="font-serif text-3xl text-card-foreground">{t("dashboard.empty.title", "Create your first signature service")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.empty.description", "Generate a menu to unlock approvals, shopping intelligence, and cook execution workflows.")}</p>
          </div>
          <Link href="/generate" className="inline-flex items-center gap-2 rounded-2xl bg-accent-luxury px-4 py-2 text-sm font-semibold text-accent-foreground shadow-soft">
            {t("dashboard.empty.cta", "Generate menu")}
            <ArrowRight size={14} />
          </Link>
        </Card>
      ) : null}
    </section>
  );
}
