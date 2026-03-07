import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

type ShoppingListView = {
  id: string;
  menuId: string;
  menuTitle: string | null;
  mealType: string | null;
  serveAt: string | null;
  ownerId: string | null;
  createdAt: string;
  itemsCount: number;
  purchasedCount: number;
};

export default async function ShoppingIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const shoppingListsQuery = supabase
    .from("shopping_lists")
    .select("id, menu_id, created_at, menus:menu_id ( id, owner_id, title, meal_type, serve_at ), shopping_items(id, purchased)")
    .order("created_at", { ascending: false });

  type ShoppingListRow = QueryData<typeof shoppingListsQuery>[number];

  const { data: rawLists } = await shoppingListsQuery;

  const lists: ShoppingListView[] = (rawLists ?? []).map((list: ShoppingListRow) => {
    const items = list.shopping_items ?? [];
    const purchasedCount = items.filter((item) => item.purchased).length;

    return {
      id: list.id,
      menuId: list.menu_id,
      menuTitle: list.menus?.title ?? null,
      mealType: list.menus?.meal_type ?? null,
      serveAt: list.menus?.serve_at ?? null,
      ownerId: list.menus?.owner_id ?? null,
      createdAt: list.created_at,
      itemsCount: items.length,
      purchasedCount,
    };
  });

  const visibleLists = lists.filter((list) => (user?.id ? list.ownerId === user.id : false));

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
            const checked = list.purchasedCount;
            const total = list.itemsCount;
            return (
              <Link key={list.id} href={`/shopping/${list.menuId}`} className="block">
                <Card className="space-y-2 transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl">{list.menuTitle ?? "Untitled menu"}</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{checked}/{total} purchased</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {list.serveAt
                      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(list.serveAt))
                      : "No service date"}
                    {list.mealType ? ` · ${list.mealType}` : ""}
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
