import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingListDetail } from "@/components/modules/shopping-list-detail";

export default async function ShoppingDetailPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: shoppingList, error: listError } = await supabaseServer
    .from("shopping_lists")
    .select("id, menu_title, meal_type, serve_at, status, chef_user_id")
    .eq("id", menuId)
    .single();

  if (listError) {
    console.error("[shopping-detail] list query error", listError);
  }

  if (!shoppingList) return notFound();
  if (user?.id && shoppingList.chef_user_id && shoppingList.chef_user_id !== user.id) return notFound();

  const { data: items, error: itemError } = await supabaseServer
    .from("shopping_items")
    .select("id, section, item_name, quantity, unit, purchased")
    .eq("shopping_list_id", shoppingList.id)
    .order("section", { ascending: true });

  if (itemError) {
    console.error("[shopping-detail] item query error", itemError);
  }

  const parsedDate = shoppingList.serve_at ? new Date(shoppingList.serve_at) : null;
  const serviceLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsedDate)
    : "Service time TBD";

  return (
    <PageTransition>
        <PageHero
        eyebrow="Operational Workspace"
        title={shoppingList.menu_title}
        description={`Service ${serviceLabel}${shoppingList.meal_type ? ` · ${shoppingList.meal_type}` : ""}`}
      />
      <ShoppingListDetail shoppingListId={shoppingList.id} initialStatus={shoppingList.status} initialItems={items ?? []} />
    </PageTransition>
  );
}
