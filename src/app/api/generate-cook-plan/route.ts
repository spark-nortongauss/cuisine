import { NextResponse } from "next/server";
import { generateCookPlanFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { MenuOption } from "@/types/domain";

export async function POST(request: Request) {
  const { menuGenerationId } = await request.json();
  if (!menuGenerationId) {
    return NextResponse.json({ error: "menuGenerationId is required" }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menuGeneration, error: generationError } = await supabase
    .from("menu_generations")
    .select("id, chef_user_id, request, selected_option, response")
    .eq("id", menuGenerationId)
    .single();

  if (generationError || !menuGeneration) {
    return NextResponse.json({ error: generationError?.message ?? "Menu generation not found" }, { status: 404 });
  }

  if (user?.id && menuGeneration.chef_user_id && menuGeneration.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const selected = menuGeneration.selected_option as MenuOption | null;
  const fallback = (menuGeneration.response as MenuOption[] | null)?.[0] ?? null;
  const menuOption = selected ?? fallback;

  if (!menuOption) return NextResponse.json({ error: "No menu option available" }, { status: 400 });

  const serveAt = ((menuGeneration.request ?? {}) as { serveAt?: string }).serveAt ?? new Date().toISOString();
  const payload = await generateCookPlanFromMenu(menuOption, serveAt);

  const { error } = await supabase.from("cook_plans").upsert(
    {
      menu_generation_id: menuGeneration.id,
      chef_user_id: menuGeneration.chef_user_id,
      payload,
    },
    { onConflict: "menu_generation_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
