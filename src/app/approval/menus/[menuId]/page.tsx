import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingListButton } from "@/components/modules/shopping-list-button";
import { resolveMenuDisplayTitle, resolveOptionDisplayTitle } from "@/lib/menu-display";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { FavoriteMenuButton } from "@/components/modules/favorite-menu-button";
import { DownloadMenuPdfButton } from "@/components/modules/download-menu-pdf-button";
import { localizeMealType, localizeMenuStatus } from "@/lib/i18n/labels";

export default async function ApprovedMenuDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("id, owner_id, title, meal_type, serve_at, invitee_count, restrictions, notes, status, approved_option_id")
    .eq("id", menuId)
    .maybeSingle();

  if (!menu) return notFound();
  if (!user?.id || menu.owner_id !== user.id) return notFound();
  if (!menu.approved_option_id) return notFound();

  const [{ data: approvedOption }, { data: dishes }, { data: cookPlan }, { data: shoppingList }, { data: favorite }] = await Promise.all([
    supabase
      .from("menu_options")
      .select("id, title, michelin_name, concept_summary, concept, chef_notes, beverage_pairing, hero_image_path")
      .eq("id", menu.approved_option_id)
      .maybeSingle(),
    supabase
      .from("menu_dishes")
      .select("id, course_no, course_label, dish_name, description, plating_notes, decoration_notes, image_path")
      .eq("menu_option_id", menu.approved_option_id)
      .order("course_no", { ascending: true }),
    supabase
      .from("cook_plans")
      .select("id, overview, mise_en_place, plating_overview, service_notes")
      .eq("menu_id", menu.id)
      .maybeSingle(),
    supabase.from("shopping_lists").select("id").eq("menu_id", menu.id).maybeSingle(),
    supabase.from("menu_favorites").select("id").eq("menu_id", menu.id).eq("owner_id", user.id).maybeSingle(),
  ]);

  const { data: shoppingItems } = shoppingList
    ? await supabase.from("shopping_items").select("id").eq("shopping_list_id", shoppingList.id)
    : { data: [] as { id: string }[] };

  const { data: cookSteps } = cookPlan
    ? await supabase
      .from("cook_steps")
      .select("id, step_no, phase, title, details, dish_name")
      .eq("cook_plan_id", cookPlan.id)
      .order("step_no", { ascending: true })
    : { data: [] as { id: string; step_no: number; phase: string; title: string; details: string; dish_name: string | null }[] };

  const [heroImageUrl, dishImageUrls] = await Promise.all([
    resolveStorageImageUrl({ supabase, path: approvedOption?.hero_image_path }),
    Promise.all((dishes ?? []).map((dish) => resolveStorageImageUrl({ supabase, path: dish.image_path }))),
  ]);

  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption, t("common.untitledMenu", "Untitled menu"));

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("approval.detail.eyebrow", "Approved Service")}
        title={displayTitle}
        description={`${menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate")}${menu.meal_type ? ` · ${localizeMealType(menu.meal_type, t)}` : ""}`}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("approval.detail.menuMetadata", "Menu metadata")}</p>
          <p><strong>{t("approval.status", "Status")}:</strong> <span className="capitalize">{localizeMenuStatus(menu.status, t)}</span></p>
          <p><strong>{t("approval.invitees", "Invitees")}:</strong> {menu.invitee_count ?? "-"}</p>
          <p><strong>{t("approval.detail.restrictions", "Restrictions")}:</strong> {menu.restrictions?.length ? menu.restrictions.join(", ") : t("approval.detail.none", "None")}</p>
          <p><strong>{t("approval.detail.chefNotes", "Chef notes")}:</strong> {menu.notes ?? t("approval.detail.noChefNotes", "No chef notes")}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("approval.detail.selectedOption", "Selected option")}</p>
          <p className="font-serif text-2xl">{resolveOptionDisplayTitle(approvedOption) ?? t("approval.detail.approvedOption", "Approved option")}</p>
          <p className="text-sm text-muted-foreground">{approvedOption?.concept_summary ?? approvedOption?.concept ?? t("approval.detail.noConceptSummary", "No concept summary.")}</p>
          <p className="text-sm"><strong>{t("approval.detail.beveragePairing", "Beverage pairing")}:</strong> {approvedOption?.beverage_pairing ?? t("approval.detail.notSpecified", "Not specified")}</p>
          <p className="text-sm"><strong>{t("approval.detail.optionChefNotes", "Option chef notes")}:</strong> {approvedOption?.chef_notes ?? t("approval.detail.noOptionNotes", "No option notes")}</p>
          {heroImageUrl ? <img src={heroImageUrl} alt={t("approval.detail.menuHero", "Menu hero")} className="mt-2 h-40 w-full rounded-xl object-cover" /> : null}
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">{t("approval.detail.dishes", "Dishes")}</h2>
          <div className="flex items-center gap-2">
            <FavoriteMenuButton menuId={menu.id} initialFavorited={Boolean(favorite)} />
            <ShoppingListButton menuId={menu.id} />
            <DownloadMenuPdfButton menuId={menu.id} />
          </div>
        </div>
        {(dishes ?? []).length ? (
          <div className="space-y-3">
            {(dishes ?? []).map((dish, index) => (
              <div key={dish.id} className="rounded-2xl border border-border/70 bg-card/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
                <p className="font-medium">{dish.dish_name}</p>
                <p className="text-sm text-muted-foreground">{dish.description}</p>
                <p className="mt-2 text-xs"><strong>{t("approval.detail.plating", "Plating")}:</strong> {dish.plating_notes ?? t("approval.detail.noPlatingNotes", "No plating notes")}</p>
                <p className="text-xs"><strong>{t("approval.detail.decoration", "Decoration")}:</strong> {dish.decoration_notes ?? t("approval.detail.noDecorationNotes", "No decoration notes")}</p>
                {dishImageUrls[index] ? <img src={dishImageUrls[index] ?? undefined} alt={dish.dish_name} className="mt-2 h-36 w-full rounded-xl object-cover md:h-40 md:w-64" /> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("approval.detail.noDishes", "No dishes available for the approved option.")}</p>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-serif text-2xl">{t("approval.detail.cookingGuidance", "Cooking guidance")}</h2>
        <p className="text-sm text-muted-foreground">{cookPlan?.overview ?? t("approval.detail.noCookOverview", "No cook overview yet.")}</p>
        <p className="text-sm"><strong>{t("cook.miseEnPlace", "Mise en place")}:</strong> {cookPlan?.mise_en_place ?? t("approval.detail.notGenerated", "Not generated")}</p>
        <p className="text-sm"><strong>{t("approval.detail.platingOverview", "Plating overview")}:</strong> {cookPlan?.plating_overview ?? t("approval.detail.notGenerated", "Not generated")}</p>
        <p className="text-sm"><strong>{t("cook.serviceNotes", "Service notes")}:</strong> {cookPlan?.service_notes ?? t("approval.detail.notGenerated", "Not generated")}</p>
        {(cookSteps ?? []).length ? (
          <div className="space-y-2">
            {(cookSteps ?? []).map((step) => (
              <div key={step.id} className="rounded-xl border border-border/60 p-2 text-sm">
                <p><strong>#{step.step_no}</strong> · {step.phase}</p>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground">{step.details}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <p className="text-sm text-muted-foreground">{t("approval.detail.shoppingListStatus", "Shopping list status")}: {shoppingList ? `${shoppingItems?.length ?? 0} ${t("approval.detail.itemsPrepared", "items prepared")}` : t("approval.detail.notGeneratedYet", "Not generated yet")}.</p>
      </Card>
    </PageTransition>
  );
}
