import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { generateShoppingListFromMenu, generateCookPlanFromMenu } from "@/lib/ai/openai";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";
import { resolveCanonicalMenuTitleFromOption } from "@/lib/menu-display";
import { mapShoppingItemsToInsert } from "@/lib/db-schema";

export async function POST(request: Request) {
  const { menuId, menuGenerationId, selectedOptionId } = await request.json();
  const effectiveMenuId = menuId ?? menuGenerationId;

  if (!effectiveMenuId) {
    return NextResponse.json({ success: false, code: "MISSING_MENU_ID", error: "menuId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user?.id) return NextResponse.json({ success: false, code: "UNAUTHENTICATED", error: "Authentication required" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await fetchMenuWithOptions(effectiveMenuId);

  if (menuError || !menu) return NextResponse.json({ success: false, code: "MENU_NOT_FOUND", error: menuError?.message ?? "Not found" }, { status: 404 });
  if (menu.owner_id !== user.id) return NextResponse.json({ success: false, code: "FORBIDDEN", error: "Forbidden" }, { status: 403 });

  const options = normalizeMenuOptions(menu.menu_options ?? []);
  const selected = options.find((option) => option.id === selectedOptionId) ?? options.find((option) => option.id === menu.approved_option_id) ?? options[0];
  if (!selected) return NextResponse.json({ success: false, code: "NO_OPTION", error: "No generated option found" }, { status: 400 });

  console.info("[validate-menu] shopping list generation start", { menuId: menu.id, optionId: selected.id });
  const shoppingItems = await generateShoppingListFromMenu(selected, menu.invitee_count ?? 4);

  const { data: shoppingList, error: shoppingError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_id: menu.id,
        generated_by: "ai",
        estimated_total_eur: null,
      },
      { onConflict: "menu_id" },
    )
    .select("id")
    .single();

  if (shoppingError || !shoppingList) {
    return NextResponse.json({ success: false, code: "SHOPPING_LIST_UPSERT_FAILED", error: shoppingError?.message ?? "Failed to persist shopping list" }, { status: 500 });
  }

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);
  const { error: itemError } = await supabase.from("shopping_items").insert(mapShoppingItemsToInsert(shoppingList.id, shoppingItems));
  if (itemError) return NextResponse.json({ success: false, code: "SHOPPING_ITEM_INSERT_FAILED", error: itemError.message }, { status: 500 });
  console.info("[validate-menu] shopping list generation end", { menuId: menu.id, shoppingListId: shoppingList.id });

  console.info("[validate-menu] cook plan generation start", { menuId: menu.id, optionId: selected.id });
  const cookPayload = await generateCookPlanFromMenu(selected, menu.serve_at ?? new Date().toISOString());

  const { data: cookPlan, error: cookPlanError } = await supabase
    .from("cook_plans")
    .upsert(
      {
        menu_id: menu.id,
        overview: cookPayload.overview,
        mise_en_place: cookPayload.mise_en_place,
        plating_overview: cookPayload.plating_overview,
        service_notes: cookPayload.service_notes,
      },
      { onConflict: "menu_id" },
    )
    .select("id")
    .single();

  if (cookPlanError || !cookPlan) {
    return NextResponse.json({ success: false, code: "COOK_PLAN_UPSERT_FAILED", error: cookPlanError?.message ?? "Failed to persist cook plan" }, { status: 500 });
  }

  await supabase.from("cook_steps").delete().eq("cook_plan_id", cookPlan.id);
  const { error: stepError } = await supabase.from("cook_steps").insert(
    cookPayload.steps.map((step, index) => ({
      cook_plan_id: cookPlan.id,
      step_no: step.step_no || index + 1,
      phase: step.phase,
      title: step.title,
      details: step.details,
      technique: step.technique,
      knife_cut: step.knife_cut ?? null,
      utensils: step.utensils,
      dish_name: step.dish_name ?? null,
      relative_minutes: step.relative_minutes ?? null,
    })),
  );

  if (stepError) return NextResponse.json({ success: false, code: "COOK_STEPS_INSERT_FAILED", error: stepError.message }, { status: 500 });
  console.info("[validate-menu] cook plan generation end", { menuId: menu.id, cookPlanId: cookPlan.id });

  const canonicalTitle = resolveCanonicalMenuTitleFromOption({ title: selected.title });

  const { error: menuUpdateError } = await supabase
    .from("menus")
    .update({
      approved_option_id: selected.id,
      status: "validated",
      chef_user_id: user.id,
      ...(canonicalTitle ? { title: canonicalTitle } : {}),
    })
    .eq("id", menu.id);

  if (menuUpdateError) return NextResponse.json({ success: false, code: "MENU_UPDATE_FAILED", error: menuUpdateError.message }, { status: 500 });

  return NextResponse.json({ success: true, menuId: menu.id, shoppingListId: shoppingList.id });
}
