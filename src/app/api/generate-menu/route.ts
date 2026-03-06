import { NextResponse } from "next/server";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { generateMichelinMenus } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeMenuOptions } from "@/lib/menu-records";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = generateMenuSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const options = await generateMichelinMenus(parsed.data);
  const supabase = createSupabaseAdminClient();

  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .insert({
      chef_user_id: user?.id ?? null,
      meal_type: parsed.data.mealType,
      course_count: parsed.data.courseCount,
      restrictions: parsed.data.restrictions,
      notes: parsed.data.notes ?? null,
      serve_at: parsed.data.serveAt,
      invitee_count: parsed.data.inviteeCount,
      status: "draft",
    })
    .select("id")
    .single();

  if (menuError || !menu) {
    return NextResponse.json({ error: menuError?.message ?? "Failed to create menu" }, { status: 500 });
  }

  const optionRows = options.map((option, index) => ({
    menu_id: menu.id,
    title: option.title,
    concept: option.concept,
    sort_order: index,
  }));

  const { data: insertedOptions, error: optionError } = await supabase
    .from("menu_options")
    .insert(optionRows)
    .select("id, title, concept, sort_order");

  if (optionError || !insertedOptions?.length) {
    await supabase.from("menus").delete().eq("id", menu.id);
    return NextResponse.json({ error: optionError?.message ?? "Failed to create menu options" }, { status: 500 });
  }

  const optionByIndex = [...insertedOptions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const dishRows = optionByIndex.flatMap((insertedOption, optionIndex) => {
    const sourceDishes = options[optionIndex]?.dishes ?? [];
    return sourceDishes.map((dish, dishIndex) => ({
      menu_id: menu.id,
      menu_option_id: insertedOption.id,
      course: dish.course,
      name: dish.name,
      description: dish.description,
      plating_notes: dish.platingNotes,
      beverage_suggestion: dish.beverageSuggestion ?? null,
      image_prompt: dish.imagePrompt,
      sort_order: dishIndex,
    }));
  });

  const { error: dishError } = await supabase.from("menu_dishes").insert(dishRows);
  if (dishError) {
    await supabase.from("menu_options").delete().eq("menu_id", menu.id);
    await supabase.from("menus").delete().eq("id", menu.id);
    return NextResponse.json({ error: dishError.message }, { status: 500 });
  }

  const normalizedOptions = normalizeMenuOptions(
    optionByIndex.map((option, optionIndex) => ({
      id: option.id,
      title: option.title,
      concept: option.concept,
      menu_dishes: (options[optionIndex]?.dishes ?? []).map((dish) => ({
        course: dish.course,
        name: dish.name,
        description: dish.description,
        plating_notes: dish.platingNotes,
        beverage_suggestion: dish.beverageSuggestion ?? null,
        image_prompt: dish.imagePrompt,
      })),
    })),
  );

  return NextResponse.json({ options: normalizedOptions, menuId: menu.id, menuGenerationId: menu.id });
}
