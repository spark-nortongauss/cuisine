import { notFound } from "next/navigation";
import { Calendar, ShoppingBasket, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FavoriteDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: favorite } = await supabase
    .from("menu_favorites")
    .select("menu_id, rating_percent, people_count, served_on, menus(title, meal_type, owner_id)")
    .eq("menu_id", menuId)
    .maybeSingle();

  if (!favorite) return notFound();
  const menu = Array.isArray(favorite.menus) ? favorite.menus[0] : favorite.menus;
  if (!menu || (user?.id && menu.owner_id !== user.id)) return notFound();

  return (
    <PageTransition>
      <PageHero
        eyebrow="Favorite Detail"
        title={menu.title ?? "Favorite menu"}
        description="A celebrated signature menu with strong post-dinner sentiment and repeat-service potential."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Users size={14} />Guests</p><p className="mt-2">{favorite.people_count ?? "-"}</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ShoppingBasket size={14} />Type</p><p className="mt-2">{menu.meal_type ?? "-"}</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Calendar size={14} />Served on</p><p className="mt-2">{favorite.served_on ?? "-"}</p></Card>
      </div>
      <Card variant="feature" className="space-y-2">
        <Badge variant="accent" className="w-fit">Saved because post-meal rating exceeded threshold</Badge>
        <p className="text-sm">Favorite rating: {favorite.rating_percent}%</p>
      </Card>
    </PageTransition>
  );
}
