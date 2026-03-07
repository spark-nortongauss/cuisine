import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { generateMichelinMenus } from "@/lib/ai/openai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeMenuOptions } from "@/lib/menu-records";
import { enrichMenuImages } from "@/lib/ai/menu-images";

type GenerateMenuSuccessResponse = {
  success: true;
  menuId: string;
  options: ReturnType<typeof normalizeMenuOptions>;
};

type GenerateMenuErrorResponse = {
  success: false;
  error: string;
  code: string;
};

function summarizeError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      message: "Validation failed",
      details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json<GenerateMenuErrorResponse>({ success: false, code, error }, { status });
}

export async function POST(request: Request) {
  console.info("[generate-menu] request received");

  try {
    const json = await request.json();
    const parsed = generateMenuSchema.safeParse(json);

    if (!parsed.success) {
      console.warn("[generate-menu] input validation failed", {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
      return jsonError(400, "VALIDATION_ERROR", "Invalid menu generation input.");
    }

    const payload = parsed.data;
    const inviteePreferences = payload.inviteePreferences.slice(0, payload.inviteeCount);
    const aggregateRestrictions = Array.from(
      new Set([
        ...payload.restrictions,
        ...inviteePreferences.flatMap((invitee) => invitee.restrictions),
      ]),
    );

    console.info("[generate-menu] validated payload", {
      mealType: payload.mealType,
      courseCount: payload.courseCount,
      inviteeCount: payload.inviteeCount,
      serveAt: payload.serveAt,
      restrictionsCount: aggregateRestrictions.length,
      hasNotes: Boolean(payload.notes?.trim()),
      inviteePreferencesCount: inviteePreferences.length,
    });

    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user?.id) return jsonError(401, "UNAUTHENTICATED", "Authentication required.");

    const supabase = createSupabaseAdminClient();

    console.info("[generate-menu] menus insert start");
    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .insert({
        owner_id: user.id,
        chef_user_id: user.id,
        meal_type: payload.mealType,
        course_count: payload.courseCount,
        restrictions: aggregateRestrictions,
        notes: payload.notes ?? null,
        serve_at: payload.serveAt,
        invitee_count: payload.inviteeCount,
        invitee_preferences: inviteePreferences,
        status: "generated",
      })
      .select("id")
      .single();

    if (menuError || !menu) {
      console.error("[generate-menu] menus insert failed", {
        message: menuError?.message,
        code: menuError?.code,
        details: menuError?.details,
      });
      return jsonError(500, "MENU_INSERT_FAILED", menuError?.message ?? "Failed to create menu.");
    }
    console.info("[generate-menu] menus insert end", { menuId: menu.id });

    let options: Awaited<ReturnType<typeof generateMichelinMenus>>;

    try {
      console.info("[generate-menu] OpenAI request start", {
        mealType: payload.mealType,
        courseCount: payload.courseCount,
      });
      options = await generateMichelinMenus({ ...payload, restrictions: aggregateRestrictions, inviteePreferences });
      console.info("[generate-menu] OpenAI response received", { optionCount: options.length });
    } catch (error) {
      console.error("[generate-menu] OpenAI/parsing failed", summarizeError(error));
      await supabase.from("menus").delete().eq("id", menu.id);

      const isSchemaError = error instanceof ZodError;
      return jsonError(
        502,
        isSchemaError ? "OPENAI_RESPONSE_PARSE_FAILED" : "OPENAI_GENERATION_FAILED",
        isSchemaError
          ? "The menu structure returned by AI could not be parsed."
          : "Menu generation failed while contacting AI service.",
      );
    }

    const optionRows = options.map((option, index) => ({
      menu_id: menu.id,
      option_no: index + 1,
      michelin_name: option.title,
      title: option.title,
      concept_summary: option.concept,
      concept: option.concept,
      beverage_pairing: option.dishes.map((dish) => dish.beverageSuggestion).filter(Boolean).join("; ") || null,
      hero_image_prompt: option.dishes[0]?.imagePrompt ?? null,
      hero_image_path: null,
      sort_order: index + 1,
      chef_notes: null,
    }));

    console.info("[generate-menu] menu_options insert start", { rowCount: optionRows.length });
    const { data: insertedOptions, error: optionError } = await supabase
      .from("menu_options")
      .insert(optionRows)
      .select("id, title, michelin_name, concept, concept_summary, sort_order, option_no, hero_image_path, hero_image_prompt");

    if (optionError || !insertedOptions?.length) {
      console.error("[generate-menu] menu_options insert failed", {
        message: optionError?.message,
        code: optionError?.code,
        details: optionError?.details,
      });
      await supabase.from("menus").delete().eq("id", menu.id);
      return jsonError(500, "MENU_OPTIONS_INSERT_FAILED", optionError?.message ?? "Failed to create menu options.");
    }
    console.info("[generate-menu] menu_options insert end", { rowCount: insertedOptions.length });

    const optionByIndex = [...insertedOptions].sort((a, b) => (a.sort_order ?? a.option_no) - (b.sort_order ?? b.option_no));

    const dishRows = optionByIndex.flatMap((insertedOption, optionIndex) => {
      const sourceDishes = options[optionIndex]?.dishes ?? [];
      return sourceDishes.map((dish, dishIndex) => ({
        menu_option_id: insertedOption.id,
        course_no: dishIndex + 1,
        course_label: dish.course,
        dish_name: dish.name,
        description: dish.description,
        plating_notes: dish.platingNotes,
        decoration_notes: dish.decorationNotes ?? null,
        image_prompt: dish.imagePrompt,
        image_path: null,
      }));
    });

    console.info("[generate-menu] menu_dishes insert start", { rowCount: dishRows.length });
    const { error: dishError } = await supabase.from("menu_dishes").insert(dishRows);

    if (dishError) {
      console.error("[generate-menu] menu_dishes insert failed", {
        message: dishError.message,
        code: dishError.code,
        details: dishError.details,
      });
      await supabase.from("menu_options").delete().eq("menu_id", menu.id);
      await supabase.from("menus").delete().eq("id", menu.id);
      return jsonError(500, "MENU_DISHES_INSERT_FAILED", dishError.message);
    }
    console.info("[generate-menu] menu_dishes insert end", { menuId: menu.id });

    const normalizedOptions = normalizeMenuOptions(
      optionByIndex.map((option, optionIndex) => ({
        id: option.id,
        title: option.title,
        michelin_name: option.michelin_name,
        concept: option.concept,
        concept_summary: option.concept_summary,
        sort_order: option.sort_order,
        option_no: option.option_no,
        hero_image_path: option.hero_image_path,
        hero_image_prompt: option.hero_image_prompt,
        menu_dishes: (options[optionIndex]?.dishes ?? []).map((dish, index) => ({
          course_no: index + 1,
          course_label: dish.course,
          dish_name: dish.name,
          description: dish.description,
          plating_notes: dish.platingNotes,
          decoration_notes: dish.decorationNotes ?? null,
          image_prompt: dish.imagePrompt,
          image_path: dish.imagePath ?? null,
        })),
      })),
    );

    const response: GenerateMenuSuccessResponse = {
      success: true,
      menuId: menu.id,
      options: normalizedOptions,
    };

    void enrichMenuImages({
      supabase,
      ownerId: user.id,
      menuId: menu.id,
      prioritizedOptionId: undefined,
    });
    console.info("[generate-menu] request end", {
      menuId: menu.id,
      optionCount: response.options.length,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[generate-menu] caught exception", summarizeError(error));
    return jsonError(500, "UNEXPECTED_ERROR", "Unexpected server error while generating menu.");
  }
}
