import Link from "next/link";
import { CircleCheck, ShoppingBasket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";

type ShoppingMenuOptionRow = Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name">;

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
    .select("id, menu_id, updated_at, menus!inner(owner_id, title, meal_type, serve_at, approved_option_id, menu_options(id, title, michelin_name)), shopping_items(id, purchased)")
    .eq("menus.owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false });

  const lists: ShoppingListView[] = (rows ?? []).map((row) => {
    const items = row.shopping_items ?? [];
    const purchasedCount = items.filter((item) => item.purchased).length;
    const menu = Array.isArray(row.menus) ? row.menus[0] : row.menus;

    const menuOptions: ShoppingMenuOptionRow[] = (menu?.menu_options ?? []) as ShoppingMenuOptionRow[];
    const approvedOption: ShoppingMenuOptionRow | null = menuOptions.find((option: ShoppingMenuOptionRow) => option.id === menu?.approved_option_id) ?? null;

    return {
      id: row.id,
      menuId: row.menu_id,
      menuTitle: resolveMenuDisplayTitle(menu, approvedOption),
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
        title="Shopping intelligence"
        description="Track procurement progress with premium operational clarity and move directly into cooking execution."
      />

      {lists.length ? (
        <Card className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="px-3 py-2">Menu</th>
                <th className="px-3 py-2">Meal</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => {
                const complete = list.itemCount > 0 && list.purchasedCount === list.itemCount;
                return (
                  <tr key={list.id} className="premium-row">
                    <td className="px-3 py-3 font-serif text-base text-primary underline-offset-4 hover:underline">
                      <Link href={`/shopping/${list.menuId}`}>{list.menuTitle}</Link>
                    </td>
                    <td className="px-3 py-3">{list.mealType}</td>
                    <td className="px-3 py-3">{list.serveAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(list.serveAt)) : "No date"}</td>
                    <td className="px-3 py-3">{list.itemCount}</td>
                    <td className="px-3 py-3">
                      <Badge variant={complete ? "success" : "accent"} className="gap-1.5">
                        {complete ? <CircleCheck size={12} /> : <ShoppingBasket size={12} />}
                        {list.purchasedCount}/{list.itemCount}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(list.updatedAt))}</td>
                  </tr>
                );
              })}
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
