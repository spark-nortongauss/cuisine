import { NextResponse } from "next/server";
import { generateCookPlanFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMenuWithOptions, normalizeMenuOptions } from "@/lib/menu-records";

export async function POST(request: Request) {
  const { menuId, menuGenerationId } = await request.json();
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
  const menuOption = options[0] ?? null;

  if (!menuOption) return NextResponse.json({ error: "No menu option available" }, { status: 400 });

  const payload = await generateCookPlanFromMenu(menuOption, menu.serve_at ?? new Date().toISOString());

  const { error } = await supabase.from("cook_plans").upsert(
    {
      menu_id: menu.id,
      chef_user_id: menu.chef_user_id,
      payload,
    },
    { onConflict: "menu_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
