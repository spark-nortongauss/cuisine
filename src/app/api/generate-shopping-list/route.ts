import { NextResponse } from "next/server";
import { generateShoppingListFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";

export async function POST(request: Request) {
  const { menuId, menuGenerationId, selectedOptionId } = await request.json();
  const effectiveMenuId = menuId ?? menuGenerationId;

  if (!effectiveMenuId) {
    return NextResponse.json({ error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await fetchMenuWithOptions(effectiveMenuId);

  if (menuError || !menu) {
    return NextResponse.json({ error: menuError?.message ?? "Menu not found" }, { status: 404 });
  }

  if (user?.id && menu.chef_user_id && menu.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const options = normalizeMenuOptions(menu.menu_options ?? []);
  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? options[0];
  if (!selectedOption) return NextResponse.json({ error: "No menu options found" }, { status: 400 });

  const aiItems = await generateShoppingListFromMenu(selectedOption, menu.invitee_count ?? 4);

  const { data: shoppingList, error: shoppingListError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_id: menu.id,
        chef_user_id: menu.chef_user_id,
        meal_type: menu.meal_type,
        menu_title: selectedOption.title,
        serve_at: menu.serve_at ?? new Date().toISOString(),
        status: "pending",
      },
      { onConflict: "menu_id" },
    )
    .select("id")
    .single();

  if (shoppingListError || !shoppingList) {
    return NextResponse.json({ error: shoppingListError?.message ?? "Failed to create shopping list" }, { status: 500 });
  }

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);

  const { error: itemError } = await supabase.from("shopping_items").insert(
    aiItems.map((item) => ({
      ...item,
      menu_id: menu.id,
      shopping_list_id: shoppingList.id,
      purchased: false,
    })),
  );

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  const { error: menuUpdateError } = await supabase.from("menus").update({ selected_option_id: selectedOption.id, status: "validated" }).eq("id", menu.id);

  if (menuUpdateError) return NextResponse.json({ error: menuUpdateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, shoppingListId: shoppingList.id });
}
