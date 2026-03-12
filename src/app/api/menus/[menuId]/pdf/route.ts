import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { buildMichelinMenuPdf } from "@/lib/pdf/menu-pdf";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(_request: Request, { params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("id, owner_id, title, meal_type, serve_at, approved_option_id, menu_options(id, title, michelin_name)")
    .eq("id", menuId)
    .maybeSingle();

  if (!menu || menu.owner_id !== user.id || !menu.approved_option_id) {
    return NextResponse.json({ success: false, error: "Menu not found" }, { status: 404 });
  }

  const { data: dishes } = await supabase
    .from("menu_dishes")
    .select("dish_name, description, plating_notes, decoration_notes, image_path")
    .eq("menu_option_id", menu.approved_option_id)
    .order("course_no", { ascending: true });

  const { data: shoppingList } = await supabase.from("shopping_lists").select("id").eq("menu_id", menu.id).maybeSingle();
  const { data: shoppingItems } = shoppingList
    ? await supabase.from("shopping_items").select("item_name").eq("shopping_list_id", shoppingList.id).order("sort_order", { ascending: true })
    : { data: [] as Array<{ item_name: string }> };
  const ingredientsText = (shoppingItems ?? []).map((item) => item.item_name).slice(0, 12).join(", ") || "Ingredients available in shopping list";

  const options = (menu.menu_options ?? []) as Array<Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name">>;
  const displayTitle = resolveMenuDisplayTitle(menu, options.find((option) => option.id === menu.approved_option_id) ?? null);

  const dishPayload = await Promise.all(
    ((dishes ?? []) as Array<Pick<Database["public"]["Tables"]["menu_dishes"]["Row"], "dish_name" | "description" | "plating_notes" | "decoration_notes" | "image_path">>).map(async (dish) => ({
      dishName: dish.dish_name,
      description: dish.description ?? "",
      ingredients: ingredientsText,
      platingNotes: dish.plating_notes,
      decorationNotes: dish.decoration_notes,
      imageUrl: await resolveStorageImageUrl({ supabase, path: dish.image_path }),
    })),
  );

  const pdf = buildMichelinMenuPdf({
    title: displayTitle,
    mealType: menu.meal_type,
    serviceDateTime: menu.serve_at ? new Date(menu.serve_at).toLocaleString() : null,
    courses: dishPayload.length,
    dishes: dishPayload,
  });
  const pdfBytes = new Uint8Array(pdf);

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"${displayTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "menu"}.pdf\"`,
      "Cache-Control": "no-store",
    },
  });
}
