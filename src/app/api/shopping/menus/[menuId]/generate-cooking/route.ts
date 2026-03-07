import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateCookPlanForMenu } from "@/lib/cook-plan-service";

export async function POST(_request: Request, { params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, code: "UNAUTHENTICATED", error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menuId).maybeSingle();

  if (!shoppingList) {
    return NextResponse.json({ success: false, code: "SHOPPING_LIST_NOT_FOUND", error: "Shopping list not found" }, { status: 404 });
  }

  const { data: items } = await supabase.from("shopping_items").select("id, purchased").eq("shopping_list_id", shoppingList.id);
  const totalItems = items?.length ?? 0;
  const purchasedItems = (items ?? []).filter((item) => Boolean(item.purchased)).length;
  const allPurchased = totalItems > 0 && purchasedItems === totalItems;

  if (!allPurchased) {
    return NextResponse.json(
      {
        success: false,
        code: "SHOPPING_INCOMPLETE",
        error: "All shopping items must be marked as purchased before generating cooking.",
      },
      { status: 400 },
    );
  }

  const result = await generateCookPlanForMenu({
    menuId,
    ownerId: user.id,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, code: result.code, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, menuId: result.menuId, cookPlanId: result.cookPlanId });
}
