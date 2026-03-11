import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

type FavoriteMenuOptionRow = Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name">;

export default async function FavoritesPage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("menu_favorites")
    .select("menu_id, rating_percent, people_count, served_on, menus(title, meal_type, approved_option_id, menu_options(id, title, michelin_name))")
    .eq("owner_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("favorites.eyebrow", "Curated Archive")}
        title={t("favorites.title", "Favorites, refined and collectible")}
        description={t("favorites.description", "Revisit top-rated menus and relaunch memorable gastronomic experiences with one click.")}
      />
      <div className="space-y-3">
        {(data ?? []).length ? (
          data?.map((favorite) => {
            const menu = Array.isArray(favorite.menus) ? favorite.menus[0] : favorite.menus;
            const menuOptions: FavoriteMenuOptionRow[] = (menu?.menu_options ?? []) as FavoriteMenuOptionRow[];
            const approvedOption: FavoriteMenuOptionRow | null = menuOptions.find((option: FavoriteMenuOptionRow) => option.id === menu?.approved_option_id) ?? null;

            return (
              <Link key={favorite.menu_id} href={`/favorites/${favorite.menu_id}`} className="block">
                <Card className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-glow">
                  <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{menu?.meal_type ?? t("common.mealFallback")}</p>
                      <h2 className="font-serif text-3xl">{resolveMenuDisplayTitle(menu, approvedOption)}</h2>
                      <p className="text-sm text-muted-foreground">{favorite.people_count ?? "-"} {t("favorites.people", "people")} · {favorite.served_on ?? t("favorites.unspecifiedDate", "unspecified date")}</p>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-4">
                      <p className="mb-2 flex items-center gap-2 text-sm"><Heart size={15} className="text-primary" />{t("favorites.guestSentiment", "Guest sentiment")}</p>
                      <Badge variant="accent" className="mb-2"><Star size={12} />{favorite.rating_percent}% {t("favorites.rating", "rating")}</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">{t("favorites.empty", "No favorites yet. Menus are added after feedback scores are high.")}</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
