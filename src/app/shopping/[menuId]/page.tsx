import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingListDetail } from "@/components/modules/shopping-list-detail";
import { Card } from "@/components/ui/card";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";

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

  const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menuId).maybeSingle();

  const menuOptions: ShoppingMenuOptionRow[] = (menu.menu_options ?? []) as ShoppingMenuOptionRow[];
  const approvedOption: ShoppingMenuOptionRow | null = menuOptions.find((option: ShoppingMenuOptionRow) => option.id === menu.approved_option_id) ?? null;
  const title = resolveMenuDisplayTitle(menu, approvedOption);
  const subtitle = `${menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate")}${menu.meal_type ? ` · ${menu.meal_type}` : ""}`;

  if (!shoppingList) {
    return (
      <PageTransition>
        <PageHero eyebrow={t("shopping.detail.eyebrow", "Operational Workspace")} title={title} description={subtitle} />
        <Card>
          <p className="text-sm text-muted-foreground">{t("shopping.detail.notGenerated", "Shopping list not generated yet. Open this menu from Approval and click “Shopping List”.")}</p>
        </Card>
      </PageTransition>
    );
  }

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, section, item_name, quantity, unit, note, purchased")
    .eq("shopping_list_id", shoppingList.id)
    .order("sort_order", { ascending: true });

  return (
    <PageTransition>
      <PageHero eyebrow={t("shopping.detail.eyebrow", "Operational Workspace")} title={title} description={subtitle} />
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("shopping.detail.menuContext", "Menu context")}</p>
        <p className="mt-2 text-sm">{t("approval.invitees", "Invitees")}: {menu.invitee_count ?? "-"}</p>
        <p className="text-sm">{t("approval.detail.restrictions", "Restrictions")}: {menu.restrictions?.length ? menu.restrictions.join(", ") : t("approval.detail.none", "None")}</p>
      </Card>
      <ShoppingListDetail menuId={menu.id} initialItems={items ?? []} />
    </PageTransition>
  );
}
