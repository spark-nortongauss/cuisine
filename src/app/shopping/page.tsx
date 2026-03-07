import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

type ShoppingListView = {
  id: string;
  menuId: string;
  menuTitle: string;
  mealType: string;
  serveAt: string | null;
  itemCount: number;
  purchasedCount: number;
  updatedAt: string;
};

export default async function ShoppingIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: rows } = await supabase
    .from("shopping_lists")
    .select("id, menu_id, updated_at, menus!inner(owner_id, title, meal_type, serve_at), shopping_items(id, purchased)")
    .eq("menus.owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false });

  const lists: ShoppingListView[] = (rows ?? []).map((row) => {
    const items = row.shopping_items ?? [];
    const purchasedCount = items.filter((item) => item.purchased).length;
    const menu = Array.isArray(row.menus) ? row.menus[0] : row.menus;

    return {
      id: row.id,
      menuId: row.menu_id,
      menuTitle: menu?.title ?? "Untitled menu",
      mealType: menu?.meal_type ?? "Service",
      serveAt: menu?.serve_at ?? null,
      itemCount: items.length,
      purchasedCount,
      updatedAt: row.updated_at,
    };
  });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Operations"
        title="Shopping lists"
        description="All menu shopping lists in one operational dashboard."
      />

      {lists.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="px-3 py-2">Menu</th>
                <th className="px-3 py-2">Meal</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id} className="rounded-2xl border border-border/60 bg-card/70">
                  <td className="px-3 py-3 font-medium text-primary underline-offset-4 hover:underline">
                    <Link href={`/shopping/${list.menuId}`}>{list.menuTitle}</Link>
                  </td>
                  <td className="px-3 py-3">{list.mealType}</td>
                  <td className="px-3 py-3">{list.serveAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(list.serveAt)) : "No date"}</td>
                  <td className="px-3 py-3">{list.itemCount}</td>
                  <td className="px-3 py-3">{list.purchasedCount}/{list.itemCount}</td>
                  <td className="px-3 py-3">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(list.updatedAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground">No shopping lists yet. Open an approved menu and generate one.</p>
        </Card>
      )}
    </PageTransition>
  );
}
