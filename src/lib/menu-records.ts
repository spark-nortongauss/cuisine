import { MenuOption } from "@/types/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MenuRow = {
  id: string;
  owner_id: string;
  chef_user_id: string | null;
  invitee_count: number | null;
  meal_type: string | null;
  serve_at: string | null;
  approved_option_id: string | null;
  menu_options: Array<{
    id: string;
    title: string | null;
    michelin_name: string;
    concept: string | null;
    concept_summary: string | null;
    sort_order: number | null;
    option_no: number;
    menu_dishes: Array<{
      course_no: number;
      course_label: string | null;
      dish_name: string;
      description: string;
      plating_notes: string | null;
      decoration_notes: string | null;
      image_prompt: string | null;
    }>;
  }>;
};

export function normalizeMenuOptions(options: MenuRow["menu_options"] = []): MenuOption[] {
  return options
    .sort((a, b) => (a.sort_order ?? a.option_no) - (b.sort_order ?? b.option_no))
    .map((option) => ({
      id: option.id,
      title: option.title ?? option.michelin_name,
      concept: option.concept_summary ?? option.concept ?? "",
      dishes: (option.menu_dishes ?? [])
        .sort((a, b) => a.course_no - b.course_no)
        .map((dish) => ({
          course: dish.course_label ?? `Course ${dish.course_no}`,
          name: dish.dish_name,
          description: dish.description,
          platingNotes: dish.plating_notes ?? "",
          decorationNotes: dish.decoration_notes ?? undefined,
          imagePrompt: dish.image_prompt ?? "",
        })),
    }));
}

export async function fetchMenuWithOptions(menuId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("menus")
    .select(`
      id,
      owner_id,
      chef_user_id,
      invitee_count,
      meal_type,
      serve_at,
      approved_option_id,
      menu_options (
        id,
        title,
        michelin_name,
        concept,
        concept_summary,
        sort_order,
        option_no,
        menu_dishes (
          course_no,
          course_label,
          dish_name,
          description,
          plating_notes,
          decoration_notes,
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
