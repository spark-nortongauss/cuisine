import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateShoppingListFromMenu, generateCookPlanFromMenu } from "@/lib/ai/openai";
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

  if (menuError || !menu) return NextResponse.json({ error: menuError?.message ?? "Not found" }, { status: 404 });
  if (user?.id && menu.chef_user_id && menu.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const options = normalizeMenuOptions(menu.menu_options ?? []);
  const selected = options.find((option) => option.id === selectedOptionId) ?? options[0];
  if (!selected) return NextResponse.json({ error: "No generated option found" }, { status: 400 });

  const shoppingItems = await generateShoppingListFromMenu(selected, menu.invitee_count ?? 4);
  const cookPayload = await generateCookPlanFromMenu(selected, menu.serve_at ?? new Date().toISOString());

  const { data: shoppingList, error: shoppingError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_id: menu.id,
        chef_user_id: menu.chef_user_id,
        menu_title: selected.title,
        meal_type: menu.meal_type,
        serve_at: menu.serve_at ?? new Date().toISOString(),
      },
      { onConflict: "menu_id" },
    )
    .select("id")
    .single();

  if (shoppingError || !shoppingList) return NextResponse.json({ error: shoppingError?.message ?? "Failed to persist shopping list" }, { status: 500 });

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);
  const { error: itemError } = await supabase.from("shopping_items").insert(
    shoppingItems.map((item) => ({
      ...item,
      menu_id: menu.id,
      shopping_list_id: shoppingList.id,
    })),
  );
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  const { error: cookError } = await supabase.from("cook_plans").upsert(
    {
      menu_id: menu.id,
      chef_user_id: menu.chef_user_id,
      shopping_list_id: shoppingList.id,
      payload: cookPayload,
    },
    { onConflict: "menu_id" },
  );
  if (cookError) return NextResponse.json({ error: cookError.message }, { status: 500 });

  const { error: menuUpdateError } = await supabase.from("menus").update({ selected_option_id: selected.id, status: "validated" }).eq("id", menu.id);
  if (menuUpdateError) return NextResponse.json({ error: menuUpdateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, shoppingListId: shoppingList.id });
}
