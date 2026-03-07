import { NextResponse } from "next/server";
import { generateShoppingListFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";
import { mapShoppingItemsToInsert } from "@/lib/db-schema";

export async function POST(request: Request) {
  const { menuId, menuGenerationId, selectedOptionId } = await request.json();
  const effectiveMenuId = menuId ?? menuGenerationId;

  if (!effectiveMenuId) {
    return NextResponse.json({ success: false, code: "MISSING_MENU_ID", error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user?.id) return NextResponse.json({ success: false, code: "UNAUTHENTICATED", error: "Authentication required" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await fetchMenuWithOptions(effectiveMenuId);

  if (menuError || !menu) {
    return NextResponse.json({ success: false, code: "MENU_NOT_FOUND", error: menuError?.message ?? "Menu not found" }, { status: 404 });
  }

  if (menu.owner_id !== user.id) {
    return NextResponse.json({ success: false, code: "FORBIDDEN", error: "Forbidden" }, { status: 403 });
  }

  const options = normalizeMenuOptions(menu.menu_options ?? []);
  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? options[0] ?? null;
  if (!selectedOption) return NextResponse.json({ success: false, code: "NO_OPTION", error: "No menu option available" }, { status: 400 });

  console.info("[shopping-list] generation start", { menuId: menu.id, optionId: selectedOption.id });
  const aiItems = await generateShoppingListFromMenu(selectedOption, menu.invitee_count ?? 4);

  const { data: shoppingList, error: shoppingListError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_id: menu.id,
        generated_by: "ai",
      },
      { onConflict: "menu_id" },
    )
    .select("id")
    .single();

  if (shoppingListError || !shoppingList) {
    return NextResponse.json({ success: false, code: "SHOPPING_LIST_UPSERT_FAILED", error: shoppingListError?.message ?? "Failed to create shopping list" }, { status: 500 });
  }

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);

  const { error: itemError } = await supabase.from("shopping_items").insert(mapShoppingItemsToInsert(shoppingList.id, aiItems));

  if (itemError) return NextResponse.json({ success: false, code: "SHOPPING_ITEMS_INSERT_FAILED", error: itemError.message }, { status: 500 });

  const { error: menuUpdateError } = await supabase
    .from("menus")
    .update({ approved_option_id: selectedOption.id, status: "validated", chef_user_id: user.id })
    .eq("id", menu.id);

  if (menuUpdateError) return NextResponse.json({ success: false, code: "MENU_UPDATE_FAILED", error: menuUpdateError.message }, { status: 500 });

  console.info("[shopping-list] generation end", { menuId: menu.id, shoppingListId: shoppingList.id, itemCount: aiItems.length });
  return NextResponse.json({ success: true, shoppingListId: shoppingList.id });
}
