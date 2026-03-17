import { generateValidatedCookPlan } from "@/lib/ai/menu-safety";
import { normalizeMenuOptions } from "@/lib/menu-records";
import { resolveCanonicalMenuTitleFromOption } from "@/lib/menu-display";
import { createSupabaseAdminClient } from "@/lib/supabase/server";


export async function generateCookPlanForMenu({
  menuId,
  ownerId,
  selectedOptionId,
}: {
  menuId: string;
  ownerId: string;
  selectedOptionId?: string | null;
}) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .select("id, owner_id, title, serve_at, restrictions, approved_option_id, menu_options(id, title, michelin_name, concept_summary, concept, sort_order, option_no, hero_image_path, hero_image_prompt, menu_dishes(course_no, course_label, dish_name, description, plating_notes, decoration_notes, image_prompt, image_path))")
      .eq("id", menuId)
      .maybeSingle();

    if (menuError || !menu) {
      return { success: false as const, status: 404, code: "MENU_NOT_FOUND", error: menuError?.message ?? "Menu not found" };
    }

    if (menu.owner_id !== ownerId) {
      return { success: false as const, status: 403, code: "FORBIDDEN", error: "Forbidden" };
    }

    const options = normalizeMenuOptions(menu.menu_options ?? []);
    const selected = options.find((option) => option.id === selectedOptionId) ?? options.find((option) => option.id === menu.approved_option_id) ?? options[0] ?? null;

    console.info("[generate-cooking] approved option resolved", {
      menuId: menu.id,
      selectedOptionId: selected?.id ?? null,
      approvedOptionId: menu.approved_option_id ?? null,
      optionsCount: options.length,
    });

    if (!selected) {
      return { success: false as const, status: 400, code: "NO_OPTION", error: "No menu option available" };
    }

    const canonicalTitle = resolveCanonicalMenuTitleFromOption({ title: selected.title });

    const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menu.id).maybeSingle();

    const { data: shoppingItems } = shoppingList
      ? await supabase
        .from("shopping_items")
        .select("section, item_name, quantity, unit, note, purchased")
        .eq("shopping_list_id", shoppingList.id)
      : { data: [] as Array<{ section: string | null; item_name: string | null; quantity: number | null; unit: string | null; note: string | null; purchased: boolean | null }> };

    console.info("[generate-cooking] dishes loaded", {
      menuId: menu.id,
      selectedOptionId: selected.id,
      dishCount: selected.dishes.length,
      shoppingItemsCount: shoppingItems?.length ?? 0,
    });

    console.info("[generate-cooking] OpenAI cooking request started", { menuId: menu.id, selectedOptionId: selected.id });
    const payload = await generateValidatedCookPlan({
      menuOption: selected,
      serveAtIso: menu.serve_at ?? new Date().toISOString(),
      restrictions: menu.restrictions ?? [],
      shoppingItems: (shoppingItems ?? []).map((item) => ({
        section: item.section,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        purchased: item.purchased,
      })),
    });
    console.info("[generate-cooking] OpenAI cooking response received", { menuId: menu.id, stepCount: payload.steps.length });

    const { data: cookPlan, error: cookPlanError } = await supabase
      .from("cook_plans")
      .upsert(
        {
          menu_id: menu.id,
          overview: payload.overview,
          mise_en_place: payload.mise_en_place,
          plating_overview: payload.plating_overview,
          service_notes: payload.service_notes,
        },
        { onConflict: "menu_id" },
      )
      .select("id")
      .single();

    if (cookPlanError || !cookPlan) {
      return {
        success: false as const,
        status: 500,
        code: "COOK_PLAN_UPSERT_FAILED",
        error: cookPlanError?.message ?? "Failed to upsert cook plan",
      };
    }

    console.info("[generate-cooking] cook_plan saved", { menuId: menu.id, cookPlanId: cookPlan.id });

    const { error: deleteError } = await supabase.from("cook_steps").delete().eq("cook_plan_id", cookPlan.id);
    if (deleteError) {
      return { success: false as const, status: 500, code: "COOK_STEPS_DELETE_FAILED", error: deleteError.message };
    }

    const { error: insertError } = await supabase.from("cook_steps").insert(
      payload.steps.map((step, index) => ({
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

    if (insertError) {
      return { success: false as const, status: 500, code: "COOK_STEPS_INSERT_FAILED", error: insertError.message };
    }

    console.info("[generate-cooking] cook_steps saved", { menuId: menu.id, cookPlanId: cookPlan.id, stepCount: payload.steps.length });

    const updatePayload: { approved_option_id: string; status: string; chef_user_id: string; title?: string } = {
      approved_option_id: selected.id,
      status: "validated",
      chef_user_id: ownerId,
    };

    if (canonicalTitle) {
      updatePayload.title = canonicalTitle;
    }

    const { error: menuUpdateError } = await supabase.from("menus").update(updatePayload).eq("id", menu.id);
    if (menuUpdateError) {
      return { success: false as const, status: 500, code: "MENU_UPDATE_FAILED", error: menuUpdateError.message };
    }

    return {
      success: true as const,
      cookPlanId: cookPlan.id,
      menuId: menu.id,
      shoppingListId: shoppingList?.id ?? null,
      stepCount: payload.steps.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cook plan";
    console.error("[generate-cooking] caught exception", { menuId, error: message });
    return {
      success: false as const,
      status: 500,
      code: "COOK_PLAN_GENERATION_FAILED",
      error: message,
    };
  }
}
