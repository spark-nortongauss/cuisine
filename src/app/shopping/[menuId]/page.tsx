import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingListDetail } from "@/components/modules/shopping-list-detail";
import { Card } from "@/components/ui/card";

export default async function ShoppingDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();

  const { data: menu } = await supabase.from("menus").select("id, owner_id, title, meal_type, serve_at").eq("id", menuId).single();

  if (!menu) return notFound();
  if (user?.id && menu.owner_id !== user.id) return notFound();

  const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menuId).maybeSingle();

  const title = menu.title ?? "Shopping List";
  const subtitle = `${menu.serve_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at)) : "No service date"}${menu.meal_type ? ` · ${menu.meal_type}` : ""}`;

  if (!shoppingList) {
    return (
      <PageTransition>
        <PageHero eyebrow="Operational Workspace" title={title} description={subtitle} />
        <Card>
          <p className="text-sm text-muted-foreground">No shopping list exists for this menu yet. Validate the menu to generate one.</p>
        </Card>
      </PageTransition>
    );
  }

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, section, item_name, quantity, unit, purchased")
    .eq("shopping_list_id", shoppingList.id)
    .order("sort_order", { ascending: true });

  return (
    <PageTransition>
      <PageHero eyebrow="Operational Workspace" title={title} description={subtitle} />
      <ShoppingListDetail shoppingListId={shoppingList.id} initialItems={items ?? []} />
    </PageTransition>
  );
}
