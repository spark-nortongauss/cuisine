import { NextResponse } from "next/server";
import { generateShoppingListFromMenu } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
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
  const { data: menuGeneration, error: generationError } = await supabase
    .from("menu_generations")
    .select("id, chef_user_id, request, response")
    .eq("id", menuGenerationId)
    .single();

  if (generationError || !menuGeneration) {
    return NextResponse.json({ error: generationError?.message ?? "Menu generation not found" }, { status: 404 });
  }

  if (user?.id && menuGeneration.chef_user_id && menuGeneration.chef_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const responseOptions = (menuGeneration.response ?? []) as MenuOption[];
  const selectedOption = responseOptions.find((option) => option.id === selectedOptionId) ?? responseOptions[0];
  if (!selectedOption) return NextResponse.json({ error: "No menu options found" }, { status: 400 });

  const requestData = (menuGeneration.request ?? {}) as { inviteeCount?: number; mealType?: string; serveAt?: string };
  const aiItems = await generateShoppingListFromMenu(selectedOption, requestData.inviteeCount ?? 4);

  const { data: shoppingList, error: shoppingListError } = await supabase
    .from("shopping_lists")
    .upsert(
      {
        menu_generation_id: menuGeneration.id,
        chef_user_id: menuGeneration.chef_user_id,
        meal_type: requestData.mealType ?? null,
        menu_title: selectedOption.title,
        serve_at: requestData.serveAt ?? new Date().toISOString(),
        status: "pending",
      },
      { onConflict: "menu_generation_id" },
    )
    .select("id")
    .single();

  if (shoppingListError || !shoppingList) {
    return NextResponse.json({ error: shoppingListError?.message ?? "Failed to create shopping list" }, { status: 500 });
  }

  await supabase.from("shopping_items").delete().eq("shopping_list_id", shoppingList.id);

  const { error: itemError } = await supabase.from("shopping_items").insert(
    aiItems.map((item) => ({
      ...item,
      menu_id: menuGeneration.id,
      shopping_list_id: shoppingList.id,
      purchased: false,
    })),
  );

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  await supabase
    .from("menu_generations")
    .update({ selected_option: selectedOption, selected_option_id: selectedOption.id, status: "validated" })
    .eq("id", menuGeneration.id);

  return NextResponse.json({ ok: true, shoppingListId: shoppingList.id });
}
