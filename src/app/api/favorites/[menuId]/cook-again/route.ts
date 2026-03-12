import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { generateCookPlanFromMenu, generateShoppingListFromMenu } from "@/lib/ai/openai";
import { mapShoppingItemsToInsert } from "@/lib/db-schema";
import type { MenuOption } from "@/types/domain";
import type { Database } from "@/lib/supabase/database.types";

type MenuOptionRow = Database["public"]["Tables"]["menu_options"]["Row"];
type MenuDishRow = Database["public"]["Tables"]["menu_dishes"]["Row"];
type ShoppingItemRow = Database["public"]["Tables"]["shopping_items"]["Row"];
type CookStepRow = Database["public"]["Tables"]["cook_steps"]["Row"];

export async function POST(_request: Request, { params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: sourceMenu } = await supabase
    .from("menus")
    .select("id, owner_id, title, meal_type, course_count, restrictions, notes, invitee_count, invitee_preferences, serve_at, approved_option_id")
    .eq("id", menuId)
    .maybeSingle();

  if (!sourceMenu || sourceMenu.owner_id !== user.id) return NextResponse.json({ success: false, error: "Menu not found" }, { status: 404 });

  const { data: options } = await supabase.from("menu_options").select("*").eq("menu_id", sourceMenu.id).order("option_no", { ascending: true });
  const sourceOptions = (options ?? []) as MenuOptionRow[];
  if (!sourceOptions.length) return NextResponse.json({ success: false, error: "Source menu has no options" }, { status: 400 });

  const optionIds = sourceOptions.map((option: MenuOptionRow) => option.id);
  const { data: dishes } = await supabase.from("menu_dishes").select("*").in("menu_option_id", optionIds).order("course_no", { ascending: true });
  const sourceDishes = (dishes ?? []) as MenuDishRow[];

  const { data: newMenu, error: newMenuError } = await supabase
    .from("menus")
    .insert({
      owner_id: user.id,
      title: sourceMenu.title,
      meal_type: sourceMenu.meal_type,
      course_count: sourceMenu.course_count,
      restrictions: sourceMenu.restrictions,
      notes: sourceMenu.notes,
      invitee_count: sourceMenu.invitee_count,
      invitee_preferences: sourceMenu.invitee_preferences,
      serve_at: sourceMenu.serve_at,
      status: "approved",
      chef_user_id: user.id,
    })
    .select("id")
    .single();

  if (newMenuError || !newMenu) return NextResponse.json({ success: false, error: newMenuError?.message ?? "Failed to duplicate menu" }, { status: 500 });

  const optionMap = new Map<string, string>();
  for (const option of sourceOptions) {
    const { data: insertedOption, error: optionError } = await supabase
      .from("menu_options")
      .insert({
        menu_id: newMenu.id,
        option_no: option.option_no,
        michelin_name: option.michelin_name,
        concept_summary: option.concept_summary,
        beverage_pairing: option.beverage_pairing,
        hero_image_path: option.hero_image_path,
        hero_image_prompt: option.hero_image_prompt,
        concept: option.concept,
        sort_order: option.sort_order,
        chef_notes: option.chef_notes,
        title: option.title,
      })
      .select("id")
      .single();

    if (optionError || !insertedOption) {
      return NextResponse.json({ success: false, error: optionError?.message ?? "Failed to duplicate options" }, { status: 500 });
    }

    optionMap.set(option.id, insertedOption.id);
  }

  if (sourceDishes.length) {
    const dishRows = sourceDishes
      .map((dish: MenuDishRow) => ({
        menu_option_id: optionMap.get(dish.menu_option_id) ?? null,
        course_no: dish.course_no,
        course_label: dish.course_label,
        dish_name: dish.dish_name,
        description: dish.description,
        plating_notes: dish.plating_notes,
        decoration_notes: dish.decoration_notes,
        image_prompt: dish.image_prompt,
        image_path: dish.image_path,
      }))
      .filter((dish): dish is Omit<MenuDishRow, "id" | "created_at"> & { menu_option_id: string } => Boolean(dish.menu_option_id));

    if (dishRows.length) {
      const { error: dishInsertError } = await supabase.from("menu_dishes").insert(dishRows);
      if (dishInsertError) return NextResponse.json({ success: false, error: dishInsertError.message }, { status: 500 });
    }
  }

  const mappedApprovedOptionId = sourceMenu.approved_option_id ? optionMap.get(sourceMenu.approved_option_id) ?? null : null;
  if (mappedApprovedOptionId) {
    await supabase.from("menus").update({ approved_option_id: mappedApprovedOptionId }).eq("id", newMenu.id);
  }

  const { data: sourceShoppingList } = await supabase.from("shopping_lists").select("id, generated_by, estimated_total_eur").eq("menu_id", sourceMenu.id).maybeSingle();
  if (sourceShoppingList) {
    const { data: sourceItems } = await supabase
      .from("shopping_items")
      .select("section, item_name, quantity, unit, note, purchased, estimated_unit_price_eur, estimated_total_price_eur, sort_order")
      .eq("shopping_list_id", sourceShoppingList.id)
      .order("sort_order", { ascending: true });

    const { data: newShoppingList } = await supabase
      .from("shopping_lists")
      .insert({ menu_id: newMenu.id, generated_by: sourceShoppingList.generated_by, estimated_total_eur: sourceShoppingList.estimated_total_eur })
      .select("id")
      .single();

    if (newShoppingList && (sourceItems ?? []).length) {
      await supabase.from("shopping_items").insert(
        ((sourceItems ?? []) as Array<Pick<ShoppingItemRow, "section" | "item_name" | "quantity" | "unit" | "note" | "purchased" | "estimated_unit_price_eur" | "estimated_total_price_eur" | "sort_order">>).map((item) => ({
          shopping_list_id: newShoppingList.id,
          section: item.section,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          note: item.note,
          purchased: item.purchased,
          estimated_unit_price_eur: item.estimated_unit_price_eur,
          estimated_total_price_eur: item.estimated_total_price_eur,
          sort_order: item.sort_order,
        })),
      );
    }
  }

  const { data: sourceCookPlan } = await supabase.from("cook_plans").select("id, overview, mise_en_place, plating_overview, service_notes").eq("menu_id", sourceMenu.id).maybeSingle();
  if (sourceCookPlan) {
    const { data: sourceCookSteps } = await supabase
      .from("cook_steps")
      .select("step_no, phase, title, details, technique, knife_cut, utensils, dish_name, relative_minutes")
      .eq("cook_plan_id", sourceCookPlan.id)
      .order("step_no", { ascending: true });

    const { data: newCookPlan } = await supabase
      .from("cook_plans")
      .insert({
        menu_id: newMenu.id,
        overview: sourceCookPlan.overview,
        mise_en_place: sourceCookPlan.mise_en_place,
        plating_overview: sourceCookPlan.plating_overview,
        service_notes: sourceCookPlan.service_notes,
      })
      .select("id")
      .single();

    if (newCookPlan && (sourceCookSteps ?? []).length) {
      await supabase.from("cook_steps").insert(
        ((sourceCookSteps ?? []) as Array<Pick<CookStepRow, "step_no" | "phase" | "title" | "details" | "technique" | "knife_cut" | "utensils" | "dish_name" | "relative_minutes">>).map((step) => ({
          cook_plan_id: newCookPlan.id,
          step_no: step.step_no,
          phase: step.phase,
          title: step.title,
          details: step.details,
          technique: step.technique,
          knife_cut: step.knife_cut,
          utensils: step.utensils,
          dish_name: step.dish_name,
          relative_minutes: step.relative_minutes,
        })),
      );
    }
  } else if (mappedApprovedOptionId) {
    const { data: approvedOption } = await supabase
      .from("menu_options")
      .select("id, title, concept, menu_dishes(course_label, dish_name, description, plating_notes, decoration_notes)")
      .eq("id", mappedApprovedOptionId)
      .maybeSingle();

    if (approvedOption) {
      const menuOption: MenuOption = {
        id: approvedOption.id,
        title: approvedOption.title ?? "Chef Menu",
        concept: approvedOption.concept ?? "Chef concept",
        dishes: (approvedOption.menu_dishes ?? []).map((dish) => ({
          course: dish.course_label ?? "Course",
          name: dish.dish_name,
          description: dish.description,
          platingNotes: dish.plating_notes ?? "Chef plating notes",
          decorationNotes: dish.decoration_notes ?? undefined,
          imagePrompt: `${dish.dish_name} plated`,
        })),
      };

      const aiShoppingItems = await generateShoppingListFromMenu(menuOption, sourceMenu.invitee_count ?? 4);
      const { data: regeneratedList } = await supabase
        .from("shopping_lists")
        .upsert({ menu_id: newMenu.id, generated_by: "ai", estimated_total_eur: null }, { onConflict: "menu_id" })
        .select("id")
        .single();
      if (regeneratedList) {
        await supabase.from("shopping_items").delete().eq("shopping_list_id", regeneratedList.id);
        await supabase.from("shopping_items").insert(mapShoppingItemsToInsert(regeneratedList.id, aiShoppingItems));
      }

      const aiCookPlan = await generateCookPlanFromMenu(menuOption, sourceMenu.serve_at ?? new Date().toISOString());
      const { data: regeneratedCookPlan } = await supabase
        .from("cook_plans")
        .upsert(
          {
            menu_id: newMenu.id,
            overview: aiCookPlan.overview,
            mise_en_place: aiCookPlan.mise_en_place,
            plating_overview: aiCookPlan.plating_overview,
            service_notes: aiCookPlan.service_notes,
          },
          { onConflict: "menu_id" },
        )
        .select("id")
        .single();

      if (regeneratedCookPlan) {
        await supabase.from("cook_steps").delete().eq("cook_plan_id", regeneratedCookPlan.id);
        await supabase.from("cook_steps").insert(
          aiCookPlan.steps.map((step) => ({
            cook_plan_id: regeneratedCookPlan.id,
            step_no: step.step_no,
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
      }
    }
  }

  return NextResponse.json({ success: true, menuId: newMenu.id, cookUrl: `/cook/${newMenu.id}` });
}
