import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePlatingGuidanceForMenuOption, getOpenAiClient } from "@/lib/ai/openai";
import type { Database } from "@/lib/supabase/database.types";

const MENU_IMAGE_BUCKET = process.env.SUPABASE_MENU_IMAGE_BUCKET ?? "menu-assets";
const IMAGE_GENERATION_RETRIES = 2;

type AdminClient = SupabaseClient<Database>;

type MenuOptionImageRow = {
  id: string;
  menu_id: string;
  michelin_name: string;
  title: string | null;
  concept: string | null;
  concept_summary: string | null;
  hero_image_prompt: string | null;
  hero_image_path: string | null;
  menu_dishes: Array<{
    id: string;
    course_no: number;
    course_label: string | null;
    dish_name: string;
    description: string;
    plating_notes: string | null;
    decoration_notes: string | null;
    image_prompt: string | null;
    image_path: string | null;
  }>;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function buildDishPrompt(option: MenuOptionImageRow, dish: MenuOptionImageRow["menu_dishes"][number]) {
  const prompt = dish.image_prompt?.trim();
  if (prompt) return prompt;

  const optionTitle = option.title ?? option.michelin_name;

  return [
    `Michelin-star food photography of ${dish.dish_name}.`,
    `Course: ${dish.course_label ?? `Course ${dish.course_no}`}.`,
    `Menu concept: ${optionTitle}. ${option.concept_summary ?? option.concept ?? ""}`,
    `Dish description: ${dish.description}`,
    `Plating notes: ${dish.plating_notes ?? "refined modern plating"}`,
    `Decoration notes: ${dish.decoration_notes ?? "elegant micro herbs and edible flowers"}`,
    "Cinematic fine-dining lighting, shallow depth of field, premium tableware, ultra realistic food texture, no text, no watermark.",
  ].join(" ");
}

function buildHeroPrompt(option: MenuOptionImageRow) {
  const prompt = option.hero_image_prompt?.trim();
  if (prompt) return prompt;

  const firstDish = option.menu_dishes[0];
  const menuName = option.title ?? option.michelin_name;

  return [
    `Hero image for a Michelin tasting menu titled '${menuName}'.`,
    `Concept: ${option.concept_summary ?? option.concept ?? "luxury contemporary gastronomy"}.`,
    firstDish ? `Representative signature dish: ${firstDish.dish_name}. ${firstDish.description}` : "",
    "Editorial fine-dining style, dramatic but natural light, pristine porcelain plating, dark elegant background, ultra realistic, no text.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function generateImageBuffer(prompt: string) {
  const result = await getOpenAiClient().images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    quality: "medium",
  });

  const base64 = result.data?.[0]?.b64_json;
  if (!base64) throw new Error("OpenAI image generation returned no image payload");

  return Buffer.from(base64, "base64");
}

async function generateImageBufferWithRetry(prompt: string, context: Record<string, unknown>) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= IMAGE_GENERATION_RETRIES; attempt += 1) {
    try {
      return await generateImageBuffer(prompt);
    } catch (error) {
      lastError = error;
      console.error("[menu-images] image generation attempt failed", {
        ...context,
        attempt,
        maxAttempts: IMAGE_GENERATION_RETRIES,
        error,
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Image generation failed after retries");
}

async function uploadPng(supabase: AdminClient, path: string, fileBuffer: Buffer) {
  const { error } = await supabase.storage.from(MENU_IMAGE_BUCKET).upload(path, fileBuffer, {
    contentType: "image/png",
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed for ${path}: ${error.message}`);
  }
}

async function generateAndStoreDishImage(params: {
  supabase: AdminClient;
  ownerId: string;
  menuId: string;
  option: MenuOptionImageRow;
  dish: MenuOptionImageRow["menu_dishes"][number];
}) {
  const { supabase, ownerId, menuId, option, dish } = params;
  const prompt = buildDishPrompt(option, dish);
  const image = await generateImageBufferWithRetry(prompt, {
    menuId,
    optionId: option.id,
    dishId: dish.id,
    dishName: dish.dish_name,
    type: "dish",
  });

  const filePath = `${ownerId}/${menuId}/options/${option.id}/dishes/${dish.course_no}-${toSlug(dish.dish_name) || dish.id}.png`;
  await uploadPng(supabase, filePath, image);

  const { error } = await supabase.from("menu_dishes").update({ image_prompt: prompt, image_path: filePath }).eq("id", dish.id);

  if (error) {
    throw new Error(`Failed to update dish image_path for ${dish.id}: ${error.message}`);
  }
}


async function enrichDishPlatingGuidance(params: {
  supabase: AdminClient;
  option: MenuOptionImageRow;
}) {
  const { supabase, option } = params;

  const guidance = await generatePlatingGuidanceForMenuOption({
    id: option.id,
    title: option.title ?? option.michelin_name,
    concept: option.concept_summary ?? option.concept ?? "",
    dishes: (option.menu_dishes ?? []).map((dish) => ({
      course: dish.course_label ?? `Course ${dish.course_no}`,
      name: dish.dish_name,
      description: dish.description,
      platingNotes: dish.plating_notes ?? "",
      decorationNotes: dish.decoration_notes ?? undefined,
      imagePrompt: dish.image_prompt ?? "",
      imagePath: dish.image_path,
    })),
  });

  const byName = new Map(guidance.dishes.map((dish) => [dish.dish_name.toLowerCase().trim(), dish]));

  for (const dish of option.menu_dishes ?? []) {
    const generated = byName.get(dish.dish_name.toLowerCase().trim());
    if (!generated) continue;

    await supabase.from("menu_dishes").update({
      plating_notes: generated.plating_notes,
      decoration_notes: generated.decoration_notes,
      image_prompt: generated.image_prompt,
    }).eq("id", dish.id);

    dish.plating_notes = generated.plating_notes;
    dish.decoration_notes = generated.decoration_notes;
    dish.image_prompt = generated.image_prompt;
  }
}

async function generateAndStoreHeroImage(params: {
  supabase: AdminClient;
  ownerId: string;
  menuId: string;
  option: MenuOptionImageRow;
}) {
  const { supabase, ownerId, menuId, option } = params;
  const prompt = buildHeroPrompt(option);
  const image = await generateImageBufferWithRetry(prompt, {
    menuId,
    optionId: option.id,
    optionTitle: option.title ?? option.michelin_name,
    type: "hero",
  });

  const filePath = `${ownerId}/${menuId}/options/${option.id}/hero.png`;
  await uploadPng(supabase, filePath, image);

  const { error } = await supabase.from("menu_options").update({ hero_image_prompt: prompt, hero_image_path: filePath }).eq("id", option.id);

  if (error) {
    throw new Error(`Failed to update hero_image_path for ${option.id}: ${error.message}`);
  }
}

export async function enrichMenuImages(params: {
  supabase: AdminClient;
  ownerId: string;
  menuId: string;
  prioritizedOptionId?: string;
  onlyPrioritizedOption?: boolean;
}) {
  const { supabase, ownerId, menuId, prioritizedOptionId, onlyPrioritizedOption = false } = params;

  const { data: options, error } = await supabase
    .from("menu_options")
    .select(`
      id,
      menu_id,
      michelin_name,
      title,
      concept,
      concept_summary,
      hero_image_prompt,
      hero_image_path,
      menu_dishes (
        id,
        course_no,
        course_label,
        dish_name,
        description,
        plating_notes,
        decoration_notes,
        image_prompt,
        image_path
      )
    `)
    .eq("menu_id", menuId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load menu options for image generation: ${error.message}`);

  const ordered = (options ?? []) as MenuOptionImageRow[];
  if (prioritizedOptionId) {
    ordered.sort((a, b) => {
      if (a.id === prioritizedOptionId) return -1;
      if (b.id === prioritizedOptionId) return 1;
      return 0;
    });
  }

  const optionsToProcess =
    onlyPrioritizedOption && prioritizedOptionId
      ? ordered.filter((option) => option.id === prioritizedOptionId)
      : ordered;

  for (const option of optionsToProcess) {
    try {
      await enrichDishPlatingGuidance({ supabase, option });
    } catch (error) {
      console.error("[menu-images] plating guidance generation failed", {
        menuId,
        optionId: option.id,
        optionTitle: option.title ?? option.michelin_name,
        error,
      });
    }

    try {
      if (!option.hero_image_path) {
        await generateAndStoreHeroImage({ supabase, ownerId, menuId, option });
      }
    } catch (error) {
      console.error("[menu-images] hero generation failed", {
        menuId,
        optionId: option.id,
        optionTitle: option.title ?? option.michelin_name,
        error,
      });
    }

    const dishes = [...(option.menu_dishes ?? [])].sort((a, b) => a.course_no - b.course_no);
    for (const dish of dishes) {
      if (dish.image_path) continue;
      try {
        await generateAndStoreDishImage({ supabase, ownerId, menuId, option, dish });
      } catch (error) {
        console.error("[menu-images] dish generation failed", {
          menuId,
          optionId: option.id,
          optionTitle: option.title ?? option.michelin_name,
          dishId: dish.id,
          dishName: dish.dish_name,
          error,
        });
      }
    }
  }
}
