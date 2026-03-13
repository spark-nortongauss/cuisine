import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { ApprovedMenuDetailView } from "@/components/modules/approved-menu-detail-view";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";

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

  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption);
  const description = `${menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate", "No date")}${menu.meal_type ? ` / ${menu.meal_type}` : ""}`;

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("approval.detail.eyebrow", "Approved Service")}
        title={displayTitle}
        description={description}
      />

      <ApprovedMenuDetailView
        menu={menu}
        approvedOption={approvedOption}
        dishes={(dishes ?? []).map((dish, index) => ({
          ...dish,
          imageUrl: dishImageUrls[index] ?? null,
        }))}
        heroImageUrl={heroImageUrl}
        cookPlan={cookPlan}
        cookSteps={cookSteps ?? []}
        favorite={Boolean(favorite)}
        shoppingItemCount={shoppingItems?.length ?? 0}
        hasShoppingList={Boolean(shoppingList)}
      />
    </PageTransition>
  );
}
