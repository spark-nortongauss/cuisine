import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type IdRow = { id: string };

function parseMenuIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

type DeletableTable = keyof Database["public"]["Tables"];

async function deleteByIds(table: DeletableTable, column: string, ids: string[], supabase: ReturnType<typeof createSupabaseAdminClient>) {
  if (!ids.length) return;
  const { error } = await supabase.from(table).delete().in(column, ids);
  if (error) throw new Error(`${table} delete failed: ${error.message}`);
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const menuIds = parseMenuIds(payload?.menuIds);

  if (!menuIds.length) {
    return NextResponse.json({ success: false, error: "menuIds is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: menus, error: menuError } = await supabase
    .from("menus")
    .select("id")
    .eq("owner_id", user.id)
    .in("id", menuIds);

  if (menuError) {
    return NextResponse.json({ success: false, error: menuError.message }, { status: 500 });
  }

  const ownedMenuIds = (menus ?? []).map((menu: IdRow) => menu.id);
  if (!ownedMenuIds.length) {
    return NextResponse.json({ success: false, error: "No owned menus found for deletion" }, { status: 404 });
  }

  const [{ data: menuOptions }, { data: cookPlans }, { data: shoppingLists }, { data: feedbackRequests }] = await Promise.all([
    supabase.from("menu_options").select("id").in("menu_id", ownedMenuIds),
    supabase.from("cook_plans").select("id").in("menu_id", ownedMenuIds),
    supabase.from("shopping_lists").select("id").in("menu_id", ownedMenuIds),
    supabase.from("feedback_requests").select("id").in("menu_id", ownedMenuIds),
  ]);

  const optionIds = (menuOptions ?? []).map((row: IdRow) => row.id);
  const cookPlanIds = (cookPlans ?? []).map((row: IdRow) => row.id);
  const shoppingListIds = (shoppingLists ?? []).map((row: IdRow) => row.id);
  const feedbackRequestIds = (feedbackRequests ?? []).map((row: IdRow) => row.id);

  const { data: menuDishes } = optionIds.length
    ? await supabase.from("menu_dishes").select("id").in("menu_option_id", optionIds)
    : { data: [] as IdRow[] };

  const dishIds = (menuDishes ?? []).map((row: IdRow) => row.id);

  try {
    await deleteByIds("dish_feedback", "feedback_request_id", feedbackRequestIds, supabase);
    await deleteByIds("dish_feedback", "menu_dish_id", dishIds, supabase);
    await deleteByIds("cook_steps", "cook_plan_id", cookPlanIds, supabase);
    await deleteByIds("shopping_items", "shopping_list_id", shoppingListIds, supabase);
    await deleteByIds("menu_invites", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("feedback_requests", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("menu_feedback_summary", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("menu_favorites", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("cook_plans", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("shopping_lists", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("menu_dishes", "menu_option_id", optionIds, supabase);
    await deleteByIds("menu_options", "menu_id", ownedMenuIds, supabase);
    await deleteByIds("menus", "id", ownedMenuIds, supabase);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete menus";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedCount: ownedMenuIds.length });
}
