import { NextResponse } from "next/server";
import { generateCookPlanFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";

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
  const menuOption = options.find((option) => option.id === selectedOptionId) ?? options.find((option) => option.id === menu.approved_option_id) ?? options[0] ?? null;

  if (!menuOption) return NextResponse.json({ success: false, code: "NO_OPTION", error: "No menu option available" }, { status: 400 });

  console.info("[cook-plan] generation start", { menuId: menu.id, optionId: menuOption.id });
  const payload = await generateCookPlanFromMenu(menuOption, menu.serve_at ?? new Date().toISOString());

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
    return NextResponse.json({ success: false, code: "COOK_PLAN_UPSERT_FAILED", error: cookPlanError?.message ?? "Failed to upsert cook plan" }, { status: 500 });
  }

  await supabase.from("cook_steps").delete().eq("cook_plan_id", cookPlan.id);

  const { error: stepError } = await supabase.from("cook_steps").insert(
    payload.steps.map((step, index) => ({
      cook_plan_id: cookPlan.id,
      step_no: step.step_no || index + 1,
      phase: step.phase,
      title: step.title,
      details: step.details,
      dish_name: step.dish_name ?? null,
      relative_minutes: step.relative_minutes ?? null,
    })),
  );

  if (stepError) return NextResponse.json({ success: false, code: "COOK_STEPS_INSERT_FAILED", error: stepError.message }, { status: 500 });

  console.info("[cook-plan] generation end", { menuId: menu.id, cookPlanId: cookPlan.id, stepCount: payload.steps.length });
  return NextResponse.json({ success: true, menuId: menu.id, cookPlanId: cookPlan.id });
}
