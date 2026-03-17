import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingListDetail } from "@/components/modules/shopping-list-detail";
import { Card } from "@/components/ui/card";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { ensureShoppingPriceEstimates } from "@/lib/shopping-price-estimates";
import { localizeDisplayTitle, localizeShoppingItems } from "@/lib/menu-localization";
import { sumDisplayedShoppingEstimate } from "@/lib/shopping-estimate";
import { formatRestrictionLabel } from "@/lib/menu-restrictions";
import { translatePlainText } from "@/lib/ai/content-translation";
import { ensureRestrictionSafeMenuArtifacts } from "@/lib/menu-safety-repair";

type ShoppingMenuOptionRow = Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name">;

export default async function ShoppingDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
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
    .select("id, owner_id, title, meal_type, serve_at, invitee_count, restrictions, approved_option_id, menu_options(id, title, michelin_name)")
    .eq("id", menuId)
    .single();

  if (!menu) return notFound();
  if (user?.id && menu.owner_id !== user.id) return notFound();

  await ensureRestrictionSafeMenuArtifacts(menu.id);

  const { data: shoppingList } = await supabase.from("shopping_lists").select("id, estimated_total_eur").eq("menu_id", menuId).maybeSingle();

  const menuOptions: ShoppingMenuOptionRow[] = (menu.menu_options ?? []) as ShoppingMenuOptionRow[];
  const approvedOption: ShoppingMenuOptionRow | null = menuOptions.find((option: ShoppingMenuOptionRow) => option.id === menu.approved_option_id) ?? null;
  const title = await localizeDisplayTitle(locale, resolveMenuDisplayTitle(menu, approvedOption));
  const localizedMealType = await translatePlainText(locale, menu.meal_type, "Translate the meal type label for a shopping detail page.");
  const serviceLabel = menu.serve_at
    ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" })
    : t("common.noDate");
  const subtitle = localizedMealType ? `${serviceLabel} | ${localizedMealType}` : serviceLabel;

  if (!shoppingList) {
    return (
      <PageTransition>
        <PageHero eyebrow={t("shopping.detail.eyebrow", "Operational Workspace")} title={title} description={subtitle} />
        <Card>
          <p className="text-sm text-muted-foreground">
            {t("shopping.detail.notGenerated", "Shopping list not generated yet. Open this menu from Approval and click \"Shopping List\".")}
          </p>
        </Card>
      </PageTransition>
    );
  }

  await ensureShoppingPriceEstimates(shoppingList.id);

  const { data: pricedList } = await supabase.from("shopping_lists").select("id, estimated_total_eur").eq("id", shoppingList.id).maybeSingle();

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, section, item_name, quantity, unit, note, purchased, estimated_unit_price_eur, estimated_total_price_eur")
    .eq("shopping_list_id", shoppingList.id)
    .order("sort_order", { ascending: true });

  const localizedItems = await localizeShoppingItems(items ?? [], locale);
  const displayedEstimatedTotal = sumDisplayedShoppingEstimate(items ?? []) ?? pricedList?.estimated_total_eur ?? null;
  const pricedItemCount = (items ?? []).filter((item) => item.estimated_total_price_eur !== null || item.estimated_unit_price_eur !== null).length;
  const missingPriceCount = Math.max((items ?? []).length - pricedItemCount, 0);
  const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <PageTransition>
      <PageHero eyebrow={t("shopping.detail.eyebrow", "Operational Workspace")} title={title} description={subtitle} />
      <Card className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shopping.detail.menuContext", "Menu context")}</p>
          <p className="mt-4 text-sm">{t("approval.invitees", "Invitees")}: {menu.invitee_count ?? "-"}</p>
          <p className="mt-2 text-sm">
            {t("approval.detail.restrictions", "Restrictions")}: {menu.restrictions?.length ? menu.restrictions.map((restriction) => formatRestrictionLabel(t, restriction)).join(", ") : t("approval.detail.none", "None")}
          </p>
        </div>
        <div className="rounded-[1.7rem] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.18),transparent_35%),rgba(255,255,255,0.04)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shopping.detail.estimatedCost", "Estimated cost")}</p>
          <p className="mt-4 font-serif text-4xl leading-none text-card-foreground md:text-5xl">
            {displayedEstimatedTotal !== null ? eur.format(displayedEstimatedTotal) : t("common.notAvailable", "N/A")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {pricedItemCount
              ? `${pricedItemCount} ${t("common.table.items", "Items").toLowerCase()} ${t("shopping.detail.pricedItems", "priced")}`
              : t("shopping.detail.noPricedItems", "No item estimates yet.")}
          </p>
          {missingPriceCount ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("shopping.detail.partialEstimate", "Some items are still missing estimates, so this total reflects the priced lines currently shown.")}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("shopping.estimateDisclaimer", "Approximate AI estimate in EUR, for planning only.")}
            </p>
          )}
        </div>
      </Card>
      <ShoppingListDetail menuId={menu.id} initialItems={localizedItems ?? []} estimatedTotalEur={displayedEstimatedTotal} />
    </PageTransition>
  );
}
