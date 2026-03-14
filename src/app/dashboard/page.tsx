import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Heart, ListChecks, Sparkles, Timer, Vote } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/modules/empty-state";
import { MenuSuggestionCard } from "@/components/modules/menu-suggestion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";

type DashboardMenuOption = {
  id: string;
  title: string | null;
  michelin_name: string | null;
  concept_summary: string | null;
  concept: string | null;
  hero_image_path: string | null;
  option_no: number | null;
};

type DashboardMenu = {
  id: string;
  title: string | null;
  meal_type: string | null;
  serve_at: string | null;
  invitee_count: number | null;
  notes: string | null;
  status: string;
  updated_at: string;
  approved_option_id: string | null;
  menu_options: DashboardMenuOption[] | null;
};

type DashboardFavorite = {
  menu_id: string;
  rating_percent: number | null;
  people_count: number | null;
  served_on: string | null;
  menus: {
    title: string | null;
    meal_type: string | null;
    approved_option_id: string | null;
    menu_options: Array<{
      id: string;
      title: string | null;
      michelin_name: string | null;
    }>;
  } | null;
};

type KitchenFlowStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  badge: string;
  icon: typeof Sparkles;
};

function pickDisplayOption(menu: DashboardMenu) {
  const options = [...(menu.menu_options ?? [])].sort((left, right) => (left.option_no ?? 0) - (right.option_no ?? 0));
  return options.find((option) => option.id === menu.approved_option_id) ?? options[0] ?? null;
}

function buildStatusLabel(menu: DashboardMenu, hasShoppingList: boolean, hasCookPlan: boolean, t: (key: string, fallback?: string) => string) {
  if (hasCookPlan) return { label: t("dashboard.status.readyToCook", "Ready to cook"), variant: "success" as const };
  if (hasShoppingList) return { label: t("dashboard.status.shoppingReady", "Shopping in progress"), variant: "accent" as const };
  if (menu.approved_option_id) return { label: t("dashboard.status.approved", "Approved for service"), variant: "accent" as const };
  return { label: t("dashboard.status.generating", "Awaiting selection"), variant: "warning" as const };
}

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

  const [{ data: menus }, { data: favorites }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, title, meal_type, serve_at, invitee_count, notes, status, updated_at, approved_option_id, menu_options(id, title, michelin_name, concept_summary, concept, hero_image_path, option_no)")
      .eq("owner_id", user?.id ?? "")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("menu_favorites")
      .select("menu_id, rating_percent, people_count, served_on, menus(title, meal_type, approved_option_id, menu_options(id, title, michelin_name))")
      .eq("owner_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const recentMenus = (menus ?? []) as DashboardMenu[];
  const favoriteRecords = ((favorites ?? []) as Array<DashboardFavorite & { menus: DashboardFavorite["menus"] | DashboardFavorite["menus"][] }>).map((favorite) => ({
    ...favorite,
    menus: Array.isArray(favorite.menus) ? favorite.menus[0] ?? null : favorite.menus,
  }));
  const menuIds = recentMenus.map((menu) => menu.id);

  const [{ data: shoppingLists }, { data: cookPlans }] = menuIds.length
    ? await Promise.all([
        supabase.from("shopping_lists").select("id, menu_id").in("menu_id", menuIds),
        supabase.from("cook_plans").select("id, menu_id").in("menu_id", menuIds),
      ])
    : [{ data: [] as Array<{ id: string; menu_id: string }> }, { data: [] as Array<{ id: string; menu_id: string }> }];

  const shoppingMenuIds = new Set((shoppingLists ?? []).map((row) => row.menu_id));
  const cookMenuIds = new Set((cookPlans ?? []).map((row) => row.menu_id));

  const suggestions = await Promise.all(
    recentMenus.slice(0, 3).map(async (menu) => {
      const displayOption = pickDisplayOption(menu);
      const imageUrl = displayOption?.hero_image_path
        ? await resolveStorageImageUrl({ supabase, path: displayOption.hero_image_path })
        : null;
      const status = buildStatusLabel(menu, shoppingMenuIds.has(menu.id), cookMenuIds.has(menu.id), t);

      const primaryAction = cookMenuIds.has(menu.id)
        ? { href: `/cook/${menu.id}`, label: t("dashboard.actions.openCookPlan", "Open cook plan") }
        : shoppingMenuIds.has(menu.id)
          ? { href: `/shopping/${menu.id}`, label: t("dashboard.actions.openShopping", "Open shopping list") }
          : menu.approved_option_id
            ? { href: `/approval/menus/${menu.id}`, label: t("dashboard.actions.openApproval", "Open approved menu") }
            : { href: "/generate", label: t("dashboard.actions.reviewOptions", "Continue in Generate") };

      const secondaryAction = menu.approved_option_id
        ? { href: `/approval/menus/${menu.id}`, label: t("dashboard.actions.serviceBrief", "Service brief") }
        : { href: "/approval", label: t("dashboard.actions.viewApproval", "Approval workspace") };

      return {
        id: menu.id,
        title: resolveMenuDisplayTitle(menu, displayOption),
        description: displayOption?.concept_summary ?? displayOption?.concept ?? menu.notes ?? t("dashboard.descriptionFallback", "A refined menu concept ready for your next decision."),
        imageUrl,
        mealType: menu.meal_type ?? t("common.mealFallback", "Service"),
        serveLabel: menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate", "No date"),
        inviteeCount: menu.invitee_count,
        statusLabel: status.label,
        statusVariant: status.variant,
        primaryAction,
        secondaryAction,
      };
    }),
  );

  const stats = [
    {
      label: t("dashboard.stats.activeMenus", "Active menus"),
      value: String(recentMenus.length),
      helper: t("dashboard.stats.activeMenusHelper", "Recent services tracked in the workspace"),
      icon: Sparkles,
    },
    {
      label: t("dashboard.stats.approvals", "Approved"),
      value: String(recentMenus.filter((menu) => menu.approved_option_id).length),
      helper: t("dashboard.stats.approvalsHelper", "Menus ready to move into operations"),
      icon: Vote,
    },
    {
      label: t("dashboard.stats.shopping", "Shopping"),
      value: String(shoppingMenuIds.size),
      helper: t("dashboard.stats.shoppingHelper", "Lists currently being procured"),
      icon: ListChecks,
    },
    {
      label: t("dashboard.stats.favorites", "Favorites"),
      value: String((favorites ?? []).length),
      helper: t("dashboard.stats.favoritesHelper", "Saved menus worth repeating"),
      icon: Heart,
    },
  ];

  const pendingApprovalMenu = recentMenus.find((menu) => !menu.approved_option_id);
  const shoppingNeededMenu = recentMenus.find((menu) => menu.approved_option_id && !shoppingMenuIds.has(menu.id));
  const cookingNeededMenu = recentMenus.find((menu) => shoppingMenuIds.has(menu.id) && !cookMenuIds.has(menu.id));
  const serviceReadyMenu = recentMenus.find((menu) => cookMenuIds.has(menu.id));

  const kitchenFlow: KitchenFlowStep[] = recentMenus.length
    ? [
        pendingApprovalMenu
          ? {
              id: "continue-generation",
              title: t("dashboard.flow.continueGeneration", "Continue menu selection"),
              description: t("dashboard.flow.continueGenerationText", "Recent menu options still need a final choice before the rest of the workflow can progress."),
              href: "/generate",
              cta: t("dashboard.flow.continueGenerationCta", "Open Generate"),
              badge: t("dashboard.flow.awaiting", "Awaiting choice"),
              icon: Sparkles,
            }
          : null,
        shoppingNeededMenu
          ? {
              id: "create-shopping",
              title: t("dashboard.flow.createShopping", "Create the shopping brief"),
              description: t("dashboard.flow.createShoppingText", "The approved menu is ready to become a procurement checklist for the kitchen team."),
              href: `/approval/menus/${shoppingNeededMenu.id}`,
              cta: t("dashboard.flow.createShoppingCta", "Open approval brief"),
              badge: t("dashboard.flow.approved", "Approved"),
              icon: ListChecks,
            }
          : null,
        cookingNeededMenu
          ? {
              id: "generate-cook-plan",
              title: t("dashboard.flow.generateCookPlan", "Turn shopping into service timing"),
              description: t("dashboard.flow.generateCookPlanText", "Use the shopping workspace to generate a precise cook timeline once procurement is underway."),
              href: `/shopping/${cookingNeededMenu.id}`,
              cta: t("dashboard.flow.generateCookPlanCta", "Open shopping list"),
              badge: t("dashboard.flow.procurement", "Procurement ready"),
              icon: Timer,
            }
          : null,
        serviceReadyMenu
          ? {
              id: "open-cook-plan",
              title: t("dashboard.flow.openCookPlan", "Open the live cook plan"),
              description: t("dashboard.flow.openCookPlanText", "Your service timeline is ready with plating guidance, metadata, and step-by-step execution notes."),
              href: `/cook/${serviceReadyMenu.id}`,
              cta: t("dashboard.flow.openCookPlanCta", "Open Cook"),
              badge: t("dashboard.flow.live", "Live plan"),
              icon: Timer,
            }
          : null,
      ].filter((step): step is KitchenFlowStep => step !== null)
    : [];

  const topFavorite = favoriteRecords[0] ?? null;

  return (
    <PageTransition className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <PageHero
          className="h-full"
          eyebrow={t("dashboard.eyebrow", "Premium culinary control center")}
          title={t("dashboard.title", "Run every service with the clarity of a modern executive kitchen")}
          description={t("dashboard.description", "Shape menus, align approvals, and guide procurement and cooking from one polished command surface built for premium hospitality teams.")}
          chips={[
            t("dashboard.chips.hospitality", "Luxury Hospitality"),
            t("dashboard.chips.ai", "AI Culinary Intelligence"),
            t("dashboard.chips.operations", "Operations Rhythm"),
          ]}
        />

        <Card variant="glass" className="flex h-full flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="section-label">{t("dashboard.snapshotLabel", "Today's Plan")}</p>
              <h2 className="font-serif text-3xl leading-tight">{t("dashboard.snapshotTitle", "A sharper view of what is ready, blocked, and next")}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {recentMenus.length
                  ? t("dashboard.snapshotDescription", "Jump directly into approvals, procurement, or service execution based on what the current menus need most.")
                  : t("dashboard.snapshotDescriptionEmpty", "Start with a signature menu and the workspace will carry it through approval, shopping, and cooking guidance.")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("dashboard.snapshotApproved", "Approved services")}</p>
                <p className="mt-2 font-serif text-3xl">{recentMenus.filter((menu) => menu.approved_option_id).length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("dashboard.snapshotReady", "Ready to cook")}</p>
                <p className="mt-2 font-serif text-3xl">{cookMenuIds.size}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/generate">
                {t("dashboard.primaryCta", "Create a new service")}
                <ArrowRight size={15} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/favorites">{t("dashboard.secondaryCta", "Open favorites")}</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-label">{label}</p>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <Icon size={18} />
              </span>
            </div>
            <p className="font-serif text-4xl">{value}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{helper}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">{t("dashboard.suggestionsLabel", "Smart suggestions")}</p>
            <h2 className="font-serif text-3xl">{t("dashboard.suggestionsTitle", "Menus worth opening next")}</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/approval">{t("dashboard.suggestionsCta", "View approval workspace")}</Link>
          </Button>
        </div>

        {suggestions.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {suggestions.map((suggestion) => (
              <MenuSuggestionCard key={suggestion.id} {...suggestion} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("dashboard.emptySuggestionsTitle", "No menu suggestions yet")}
            description={t("dashboard.emptySuggestionsDescription", "Generate a service to unlock smart suggestions, future actions, and saved highlights right here on the dashboard.")}
            action={{ href: "/generate", label: t("dashboard.emptySuggestionsAction", "Generate your first menu") }}
          />
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-label">{t("dashboard.flowLabel", "Kitchen Flow")}</p>
              <h2 className="font-serif text-3xl">{t("dashboard.flowTitle", "What the kitchen should do next")}</h2>
            </div>
            <Badge variant="accent">{recentMenus.length} {t("dashboard.flowMenusTracked", "menus tracked")}</Badge>
          </div>

          {kitchenFlow.length ? (
            <div className="space-y-3">
              {kitchenFlow.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
                          <Icon size={18} />
                        </span>
                        <div className="space-y-2">
                          <Badge variant="accent" className="w-fit">{step.badge}</Badge>
                          <h3 className="font-serif text-2xl">{step.title}</h3>
                          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="shrink-0">
                        <Link href={step.href}>{step.cta}</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t("dashboard.flowEmptyTitle", "Your workflow is ready for its first service")}
              description={t("dashboard.flowEmptyDescription", "Once a menu exists, this area will surface the clearest next operational move for approvals, shopping, and cook execution.")}
              action={{ href: "/generate", label: t("dashboard.flowEmptyAction", "Start a service") }}
            />
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-label">{t("dashboard.favoritesLabel", "Saved highlights")}</p>
              <h2 className="font-serif text-3xl">{t("dashboard.favoritesTitle", "Favorite menus that still have momentum")}</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/favorites">{t("dashboard.favoritesCta", "Open archive")}</Link>
            </Button>
          </div>

          {topFavorite ? (
            <div className="space-y-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="success">{topFavorite.rating_percent ?? 0}% {t("dashboard.favoriteRating", "rating")}</Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
                    <CalendarClock size={13} className="text-primary" />
                    {topFavorite.served_on ?? t("dashboard.favoriteNoDate", "Date not set")}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-3xl">
                  {resolveMenuDisplayTitle(topFavorite.menus, topFavorite.menus?.menu_options.find((option) => option.id === topFavorite.menus?.approved_option_id) ?? null)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("dashboard.favoriteDescription", "A strong-performing menu kept for repeatable execution and quick relaunch when you need a proven service.")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="default">{topFavorite.people_count ?? "-"} {t("dashboard.favoriteGuests", "guests")}</Badge>
                  <Badge variant="default">{topFavorite.menus?.meal_type ?? t("common.mealFallback", "Service")}</Badge>
                </div>
                <div className="mt-5">
                  <Button asChild>
                    <Link href={`/favorites/${topFavorite.menu_id}`}>
                      {t("dashboard.favoriteOpen", "Open favorite")}
                      <ArrowRight size={15} />
                    </Link>
                  </Button>
                </div>
              </div>

              {favoriteRecords.slice(1).map((favorite) => {
                const menu = favorite.menus;
                const approvedOption = menu?.menu_options.find((option) => option.id === menu?.approved_option_id) ?? null;
                return (
                  <Link
                    key={favorite.menu_id}
                    href={`/favorites/${favorite.menu_id}`}
                    className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{resolveMenuDisplayTitle(menu, approvedOption)}</p>
                      <p className="text-xs text-muted-foreground">{favorite.people_count ?? "-"} {t("dashboard.favoriteGuests", "guests")}</p>
                    </div>
                    <Badge variant="accent">{favorite.rating_percent ?? 0}%</Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t("dashboard.favoritesEmptyTitle", "Favorites will appear here")}
              description={t("dashboard.favoritesEmptyDescription", "Once guest feedback pushes a menu above the threshold, this panel becomes your curated archive of proven services.")}
              action={{ href: "/generate", label: t("dashboard.favoritesEmptyAction", "Create a menu to test") }}
            />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
