import { MenuOption } from "@/types/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MenuRow = {
  id: string;
  chef_user_id: string | null;
  invitee_count: number | null;
  meal_type: string | null;
  serve_at: string | null;
  menu_options: Array<{
    id: string;
    title: string;
    concept: string;
    menu_dishes: Array<{
      course: string;
      name: string;
      description: string;
      plating_notes: string;
      beverage_suggestion: string | null;
      image_prompt: string;
    }>;
  }>;
};

export function normalizeMenuOptions(options: MenuRow["menu_options"] = []): MenuOption[] {
  return options.map((option) => ({
    id: option.id,
    title: option.title,
    concept: option.concept,
    dishes: (option.menu_dishes ?? []).map((dish) => ({
      course: dish.course,
      name: dish.name,
      description: dish.description,
      platingNotes: dish.plating_notes,
      beverageSuggestion: dish.beverage_suggestion ?? undefined,
      imagePrompt: dish.image_prompt,
    })),
  }));
}

export async function fetchMenuWithOptions(menuId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("menus")
    .select(`
      id,
      chef_user_id,
      invitee_count,
      meal_type,
      serve_at,
      menu_options (
        id,
        title,
        concept,
        menu_dishes (
          course,
          name,
          description,
          plating_notes,
          beverage_suggestion,
          image_prompt
        )
      )
    `)
    .eq("id", menuId)
    .single();

  return {
    ...result,
    data: result.data as MenuRow | null,
  };
}
