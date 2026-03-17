import { generateValidatedCookPlan, generateValidatedShoppingList, repairStoredMenuOptionUntilValid } from "@/lib/ai/menu-safety";
import { getCookStepRichnessIssues } from "@/lib/cook-plan";
import { mapShoppingItemsToInsert } from "@/lib/db-schema";
import { resolveCanonicalMenuTitleFromOption } from "@/lib/menu-display";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";
import {
  validateCookPlanAgainstRestrictions,
  validateMenuOptionsAgainstRestrictions,
  validateShoppingItemsAgainstRestrictions,
} from "@/lib/menu-restrictions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function summarizeCookPlanRichness(plan: {
  steps: Array<{
    title: string;
    details: string;
    technique?: string | null;
    knife_cut?: string | null;
    utensils?: string[] | null;
  }>;
}) {
  const issues = plan.steps.flatMap((step, index) => getCookStepRichnessIssues(step).map((issue) => `Step ${index + 1}: ${issue}`));
  return issues.length;
}

async function persistMenuOption(menuId: string, option: ReturnType<typeof normalizeMenuOptions>[number]) {
  const supabase = createSupabaseAdminClient();

  const { error: optionError } = await supabase
    .from("menu_options")
    .update({
      title: option.title,
      michelin_name: option.title,
      concept_summary: option.concept,
      concept: option.concept,
      beverage_pairing: option.dishes.map((dish) => dish.beverageSuggestion).filter(Boolean).join("; ") || null,
      hero_image_prompt: option.heroImagePrompt ?? option.dishes[0]?.imagePrompt ?? null,
      hero_image_path: null,
    })
    .eq("id", option.id);

  if (optionError) {
    throw new Error(optionError.message);
  }

  const { error: deleteError } = await supabase.from("menu_dishes").delete().eq("menu_option_id", option.id);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const dishRows = option.dishes.map((dish, index) => ({
    menu_option_id: option.id,
    course_no: index + 1,
    course_label: dish.course,
    dish_name: dish.name,
    description: dish.description,
    plating_notes: dish.platingNotes,
    decoration_notes: dish.decorationNotes ?? null,
    image_prompt: dish.imagePrompt,
    image_path: null,
  }));

  if (dishRows.length) {
    const { error: insertError } = await supabase.from("menu_dishes").insert(dishRows);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const canonicalTitle = resolveCanonicalMenuTitleFromOption({ title: option.title });
  if (canonicalTitle) {
    const { error: menuError } = await supabase.from("menus").update({ title: canonicalTitle }).eq("id", menuId);
    if (menuError) {
      throw new Error(menuError.message);
    }
  }
}

async function replaceShoppingList(menuId: string, shoppingListId: string, items: Awaited<ReturnType<typeof generateValidatedShoppingList>>) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingListId);
  const { error: insertError } = await supabase.from("shopping_items").insert(mapShoppingItemsToInsert(shoppingListId, items));
  if (insertError) {
    throw new Error(insertError.message);
  }

  await supabase.from("shopping_lists").update({ estimated_total_eur: null }).eq("id", shoppingListId).eq("menu_id", menuId);
}

async function replaceCookPlan(menuId: string, payload: Awaited<ReturnType<typeof generateValidatedCookPlan>>) {
  const supabase = createSupabaseAdminClient();

  const { data: cookPlan, error: cookPlanError } = await supabase
    .from("cook_plans")
    .upsert(
      {
        menu_id: menuId,
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
    throw new Error(cookPlanError?.message ?? "Failed to persist cook plan.");
  }

  await supabase.from("cook_steps").delete().eq("cook_plan_id", cookPlan.id);

  const { error: stepError } = await supabase.from("cook_steps").insert(
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

  if (stepError) {
    throw new Error(stepError.message);
  }

  return cookPlan.id;
}

export async function ensureRestrictionSafeMenuArtifacts(menuId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: menu, error } = await fetchMenuWithOptions(menuId);

  if (error || !menu) {
    return { repaired: false, approvedOptionId: null, shoppingListId: null, cookPlanId: null };
  }

  const restrictions = menu.restrictions ?? [];
  const normalizedOptions = normalizeMenuOptions(menu.menu_options ?? []);
  const repairedOptionIds = new Set<string>();
  const safeOptions = [];

  for (const option of normalizedOptions) {
    const violations = validateMenuOptionsAgainstRestrictions([option], restrictions);
    if (!violations.length) {
      safeOptions.push(option);
      continue;
    }

    const repairedOption = await repairStoredMenuOptionUntilValid({
      option,
      mealType: menu.meal_type,
      inviteeCount: menu.invitee_count,
      serveAtIso: menu.serve_at,
      restrictions,
    });

    await persistMenuOption(menu.id, repairedOption);
    repairedOptionIds.add(option.id);
    safeOptions.push(repairedOption);
  }

  const approvedOption = safeOptions.find((option) => option.id === menu.approved_option_id) ?? null;
  const approvedOptionChanged = approvedOption ? repairedOptionIds.has(approvedOption.id) : false;

  const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menu.id).maybeSingle();
  let effectiveShoppingItems: Array<{
    section: string | null;
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    purchased: boolean | null;
  }> = [];
  let shoppingRepaired = false;

  if (shoppingList && approvedOption) {
    const { data: shoppingItems } = await supabase
      .from("shopping_items")
      .select("section, item_name, quantity, unit, note, purchased")
      .eq("shopping_list_id", shoppingList.id)
      .order("sort_order", { ascending: true });

    effectiveShoppingItems = (shoppingItems ?? []).map((item) => ({
      section: item.section,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note,
      purchased: item.purchased,
    }));

    const shoppingViolations = validateShoppingItemsAgainstRestrictions(effectiveShoppingItems, restrictions);
    if (approvedOptionChanged || shoppingViolations.length) {
      const regeneratedItems = await generateValidatedShoppingList({
        menuOption: approvedOption,
        inviteeCount: menu.invitee_count ?? 1,
        restrictions,
      });

      await replaceShoppingList(menu.id, shoppingList.id, regeneratedItems);
      effectiveShoppingItems = regeneratedItems.map((item) => ({
        section: item.section,
        item_name: item.item_name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        note: item.note ?? null,
        purchased: false,
      }));
      shoppingRepaired = true;
    }
  }

  const { data: cookPlan } = await supabase
    .from("cook_plans")
    .select("id, overview, mise_en_place, plating_overview, service_notes")
    .eq("menu_id", menu.id)
    .maybeSingle();

  let cookPlanId = cookPlan?.id ?? null;

  if (cookPlan && approvedOption) {
    const { data: steps } = await supabase
      .from("cook_steps")
      .select("step_no, phase, title, details, technique, knife_cut, utensils, dish_name, relative_minutes")
      .eq("cook_plan_id", cookPlan.id)
      .order("step_no", { ascending: true });

    const currentCookPlan = {
      overview: cookPlan.overview ?? "",
      mise_en_place: cookPlan.mise_en_place ?? "",
      plating_overview: cookPlan.plating_overview ?? "",
      service_notes: cookPlan.service_notes ?? "",
      steps:
        (steps ?? []).map((step) => ({
          step_no: step.step_no,
          phase: step.phase,
          title: step.title,
          details: step.details,
          technique: step.technique ?? "",
          knife_cut: step.knife_cut ?? null,
          utensils: step.utensils ?? [],
          dish_name: step.dish_name ?? null,
          relative_minutes: step.relative_minutes ?? null,
        })) ?? [],
    };

    const cookViolations = validateCookPlanAgainstRestrictions(
      currentCookPlan,
      restrictions,
      approvedOption.dishes.map((dish) => dish.name),
    );
    const richnessIssueCount = summarizeCookPlanRichness(currentCookPlan);

    if (approvedOptionChanged || shoppingRepaired || cookViolations.length || richnessIssueCount) {
      const regeneratedCookPlan = await generateValidatedCookPlan({
        menuOption: approvedOption,
        serveAtIso: menu.serve_at ?? new Date().toISOString(),
        restrictions,
        shoppingItems: effectiveShoppingItems,
      });

      cookPlanId = await replaceCookPlan(menu.id, regeneratedCookPlan);
    }
  }

  return {
    repaired: repairedOptionIds.size > 0 || shoppingRepaired || (cookPlanId !== cookPlan?.id && Boolean(cookPlanId)),
    approvedOptionId: approvedOption?.id ?? null,
    shoppingListId: shoppingList?.id ?? null,
    cookPlanId,
  };
}
