import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateShoppingListFromMenu, generateCookPlanFromMenu } from "@/lib/ai/openai";
import { MenuOption } from "@/types/domain";

export async function POST(request: Request) {
  const { menuGenerationId, selectedOptionId } = await request.json();
  if (!menuGenerationId) {
    return NextResponse.json({ error: "menuGenerationId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const supabase = createSupabaseAdminClient();

  const { data: generation, error } = await supabase
    .from("menu_generations")
    .select("id, chef_user_id, request, response")
    .eq("id", menuGenerationId)
    .single();

  if (error || !generation) return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  if (user?.id && generation.chef_user_id && generation.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestData = (generation.request ?? {}) as { inviteeCount?: number; mealType?: string; serveAt?: string };
  const options = (generation.response ?? []) as MenuOption[];
  const selected = options.find((option) => option.id === selectedOptionId) ?? options[0];
  if (!selected) return NextResponse.json({ error: "No generated option found" }, { status: 400 });

  const shoppingItems = await generateShoppingListFromMenu(selected, requestData.inviteeCount ?? 4);
  const cookPayload = await generateCookPlanFromMenu(selected, requestData.serveAt ?? new Date().toISOString());

  const { data: shoppingList, error: shoppingError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_generation_id: generation.id,
        chef_user_id: generation.chef_user_id,
        menu_title: selected.title,
        meal_type: requestData.mealType ?? null,
        serve_at: requestData.serveAt ?? new Date().toISOString(),
      },
      { onConflict: "menu_generation_id" },
    )
    .select("id")
    .single();

  if (shoppingError || !shoppingList) return NextResponse.json({ error: shoppingError?.message ?? "Failed to persist shopping list" }, { status: 500 });

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);
  const { error: itemError } = await supabase.from("shopping_items").insert(
    shoppingItems.map((item) => ({
      ...item,
      menu_id: generation.id,
      shopping_list_id: shoppingList.id,
    })),
  );
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  const { error: cookError } = await supabase.from("cook_plans").upsert(
    {
      menu_generation_id: generation.id,
      chef_user_id: generation.chef_user_id,
      shopping_list_id: shoppingList.id,
      payload: cookPayload,
    },
    { onConflict: "menu_generation_id" },
  );
  if (cookError) return NextResponse.json({ error: cookError.message }, { status: 500 });

  await supabase
    .from("menu_generations")
    .update({ selected_option: selected, selected_option_id: selected.id, status: "validated" })
    .eq("id", generation.id);

  return NextResponse.json({ ok: true, shoppingListId: shoppingList.id });
}
