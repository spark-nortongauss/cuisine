import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMichelinMenuPdf } from "@/lib/pdf/menu-pdf";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import type { Database } from "@/lib/supabase/database.types";
import { resolveLocale } from "@/lib/i18n/config";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { localizeApprovedOption, localizeDishRows, localizeDisplayTitle, localizeShoppingItems } from "@/lib/menu-localization";
import { translatePlainText } from "@/lib/ai/content-translation";
import { formatRestrictionLabel } from "@/lib/menu-restrictions";
import { ensureRestrictionSafeMenuArtifacts } from "@/lib/menu-safety-repair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFETY_REPAIR_TIMEOUT_MS = 1500;
const PDF_TRANSLATION_OPTIONS = {
  maxRetries: 0,
  timeoutMs: 2500,
} as const;

async function ensureRestrictionSafeMenuArtifactsQuickly(menuId: string) {
  try {
    await Promise.race([
      ensureRestrictionSafeMenuArtifacts(menuId),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out while validating menu artifacts for PDF export.")), SAFETY_REPAIR_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn("[menu-pdf] continuing export without waiting for menu artifact repair", {
      menuId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function buildPdfFilename(title: string) {
  const slug = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
  return `${slug || "menu"}.pdf`;
}

export async function GET(request: Request, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") ? resolveLocale(searchParams.get("locale")) : await getServerLocale();
    const shouldDownload = searchParams.get("download") === "1";
    const t = getServerT(locale);

    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .select("id, owner_id, title, meal_type, serve_at, restrictions, approved_option_id, menu_options(id, title, michelin_name, concept_summary, concept)")
      .eq("id", menuId)
      .maybeSingle();

    if (menuError) {
      throw new Error(menuError.message);
    }

    if (!menu || menu.owner_id !== user.id || !menu.approved_option_id) {
      return NextResponse.json({ success: false, error: "Menu not found" }, { status: 404 });
    }

    await ensureRestrictionSafeMenuArtifactsQuickly(menu.id);

    const { data: dishes, error: dishesError } = await supabase
      .from("menu_dishes")
      .select("course_label, dish_name, description, plating_notes, decoration_notes, image_path")
      .eq("menu_option_id", menu.approved_option_id)
      .order("course_no", { ascending: true });

    if (dishesError) {
      throw new Error(dishesError.message);
    }

    const { data: shoppingList, error: shoppingListError } = await supabase.from("shopping_lists").select("id").eq("menu_id", menu.id).maybeSingle();
    if (shoppingListError) {
      throw new Error(shoppingListError.message);
    }

    const { data: shoppingItems, error: shoppingItemsError } = shoppingList
      ? await supabase.from("shopping_items").select("section, item_name, note").eq("shopping_list_id", shoppingList.id).order("sort_order", { ascending: true })
      : { data: [] as Array<{ section: string | null; item_name: string | null; note: string | null }>, error: null };

    if (shoppingItemsError) {
      throw new Error(shoppingItemsError.message);
    }

    const options = (menu.menu_options ?? []) as Array<Pick<Database["public"]["Tables"]["menu_options"]["Row"], "id" | "title" | "michelin_name" | "concept_summary" | "concept">>;
    const approvedOption = options.find((option) => option.id === menu.approved_option_id) ?? null;

    const [localizedOption, displayTitle, localizedDishes, localizedShoppingItems, localizedMealType] = await Promise.all([
      localizeApprovedOption(approvedOption, locale, PDF_TRANSLATION_OPTIONS),
      localizeDisplayTitle(locale, resolveMenuDisplayTitle(menu, approvedOption), PDF_TRANSLATION_OPTIONS),
      localizeDishRows(
        ((dishes ?? []) as Array<Pick<Database["public"]["Tables"]["menu_dishes"]["Row"], "course_label" | "dish_name" | "description" | "plating_notes" | "decoration_notes">>),
        locale,
        PDF_TRANSLATION_OPTIONS,
      ),
      localizeShoppingItems(shoppingItems ?? [], locale, PDF_TRANSLATION_OPTIONS),
      translatePlainText(locale, menu.meal_type, "Translate the meal type label for a menu PDF.", PDF_TRANSLATION_OPTIONS),
    ]);

    const ingredientsText = localizedShoppingItems
      .map((item) => item.item_name)
      .filter(Boolean)
      .slice(0, 12)
      .join(", ") || t("pdf.ingredientsFallback", "Ingredients available in shopping list");
    const restrictionsLine = menu.restrictions?.length
      ? menu.restrictions.map((restriction) => formatRestrictionLabel(t, restriction)).join(", ")
      : t("approval.detail.none", "None");

    const pdf = await buildMichelinMenuPdf({
      locale,
      title: displayTitle,
      mealType: localizedMealType,
      serviceDateTime: menu.serve_at ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at)) : null,
      concept: localizedOption?.concept_summary ?? localizedOption?.concept ?? null,
      restrictionsLine,
      courses: localizedDishes.length,
      labels: {
        eyebrow: t("pdf.eyebrow", "Curated Service"),
        service: t("common.table.service", "Service"),
        restrictions: t("approval.detail.restrictions", "Restrictions"),
        ingredients: t("pdf.ingredients", "Ingredients"),
        plating: t("approval.detail.plating", "Plating"),
        finishing: t("pdf.finishing", "Finishing"),
        noDishes: t("approval.detail.noDishes", "No dishes available for the approved option."),
        course: t("approval.detail.course", "Course"),
        courseCount: t("generate.form.courses", "Courses"),
      },
      dishes: localizedDishes.map((dish) => ({
        courseLabel: dish.course_label,
        dishName: dish.dish_name,
        description: dish.description ?? "",
        ingredients: ingredientsText,
        platingNotes: dish.plating_notes,
        decorationNotes: dish.decoration_notes,
        imageUrl: null,
      })),
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename=\"${buildPdfFilename(displayTitle)}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[menu-pdf] failed to generate PDF", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Failed to generate PDF." }, { status: 500 });
  }
}
