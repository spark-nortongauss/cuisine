import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { generateShoppingListFromMenu } from "@/lib/ai/openai";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";
import { mapShoppingItemsToInsert } from "@/lib/db-schema";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const menuId = typeof payload?.menuId === "string" ? payload.menuId : null;

  if (!menuId) {
    return NextResponse.json({ success: false, error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await fetchMenuWithOptions(menuId);

  if (menuError || !menu) {
    return NextResponse.json({ success: false, error: menuError?.message ?? "Menu not found" }, { status: 404 });
  }

  if (menu.owner_id !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!menu.approved_option_id) {
    return NextResponse.json({ success: false, error: "Select an approved menu option first" }, { status: 400 });
  }

  const { data: existingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menuId).maybeSingle();

  if (existingList) {
    const { count } = await supabase
      .from("shopping_items")
      .select("id", { count: "exact", head: true })
      .eq("shopping_list_id", existingList.id);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ success: true, shoppingListId: existingList.id, generated: false });
    }
  }

  const options = normalizeMenuOptions(menu.menu_options ?? []);
  const approvedOption = options.find((option) => option.id === menu.approved_option_id);

  if (!approvedOption) {
    return NextResponse.json({ success: false, error: "Approved option is missing" }, { status: 400 });
  }

  const aiItems = await generateShoppingListFromMenu(approvedOption, menu.invitee_count ?? 4);

  const { data: shoppingList, error: listError } = await supabase
    .from("shopping_lists")
    .upsert({
      menu_id: menu.id,
      generated_by: "ai",
    }, { onConflict: "menu_id" })
    .select("id")
    .single();

  if (listError || !shoppingList) {
    return NextResponse.json({ success: false, error: listError?.message ?? "Failed to create shopping list" }, { status: 500 });
  }

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);

  const { error: itemsError } = await supabase
    .from("shopping_items")
    .insert(mapShoppingItemsToInsert(shoppingList.id, aiItems));

  if (itemsError) {
    return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, shoppingListId: shoppingList.id, generated: true });
}
