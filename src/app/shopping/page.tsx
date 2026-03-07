import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShoppingIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id, menu_id, created_at, menus(title, meal_type, serve_at, owner_id), shopping_items(id, purchased)")
    .order("created_at", { ascending: false });

  const visibleLists = (lists ?? []).filter((list) => {
    const menuOwner = Array.isArray(list.menus) ? list.menus[0]?.owner_id : list.menus?.owner_id;
    return user?.id ? menuOwner === user.id : false;
  });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Operations"
        title="Shopping lists"
        description="Track approved menu shopping runs and item completion progress."
      />

      <div className="space-y-3">
        {visibleLists.length ? (
          visibleLists.map((list) => {
            const menu = Array.isArray(list.menus) ? list.menus[0] : list.menus;
            const items = (list.shopping_items ?? []) as { purchased: boolean }[];
            const checked = items.filter((item) => item.purchased).length;
            const total = items.length;
            return (
              <Link key={list.id} href={`/shopping/${list.menu_id}`} className="block">
                <Card className="space-y-2 transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl">{menu?.title ?? "Untitled menu"}</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{checked}/{total} purchased</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {menu?.serve_at
                      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at))
                      : "No service date"}
                    {menu?.meal_type ? ` · ${menu.meal_type}` : ""}
                  </p>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No shopping lists yet. Validate a menu to generate one.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
