import { notFound } from "next/navigation";
import { Calendar, ShoppingBasket, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";
import { CookAgainButton } from "@/components/modules/cook-again-button";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { localizeMealType } from "@/lib/i18n/labels";

type FavoriteMenuOptionRow = Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name">;

export default async function FavoriteDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: favorite } = await supabase
    .from("menu_favorites")
    .select("menu_id, rating_percent, people_count, served_on, menus(title, meal_type, owner_id, approved_option_id, menu_options(id, title, michelin_name))")
    .eq("menu_id", menuId)
    .maybeSingle();

  if (!favorite) return notFound();
  const menu = Array.isArray(favorite.menus) ? favorite.menus[0] : favorite.menus;
  if (!menu || (user?.id && menu.owner_id !== user.id)) return notFound();

  const menuOptions: FavoriteMenuOptionRow[] = (menu.menu_options ?? []) as FavoriteMenuOptionRow[];
  const approvedOption: FavoriteMenuOptionRow | null = menuOptions.find((option: FavoriteMenuOptionRow) => option.id === menu.approved_option_id) ?? null;
  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption, t("common.untitledMenu", "Untitled menu"));

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("favorites.detail.eyebrow", "Favorite Detail")}
        title={displayTitle}
        description={t("favorites.detail.description", "A celebrated signature menu with strong post-service sentiment and repeat-service potential.")}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Users size={14} />{t("favorites.detail.guests", "Guests")}</p><p className="mt-2">{favorite.people_count ?? "-"}</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ShoppingBasket size={14} />{t("favorites.detail.type", "Type")}</p><p className="mt-2">{localizeMealType(menu.meal_type, t)}</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Calendar size={14} />{t("favorites.detail.servedOn", "Served on")}</p><p className="mt-2">{favorite.served_on ? formatWithLocale(locale, new Date(favorite.served_on), { dateStyle: "medium" }) : "-"}</p></Card>
      </div>
      <Card variant="feature" className="space-y-2">
        <Badge variant="accent" className="w-fit">{t("favorites.detail.savedReason", "Saved because post-meal rating exceeded threshold")}</Badge>
        <p className="text-sm">{t("favorites.detail.rating", "Favorite rating")}: {favorite.rating_percent}%</p>
        <CookAgainButton menuId={menuId} />
      </Card>
    </PageTransition>
  );
}
