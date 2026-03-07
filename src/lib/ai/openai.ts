import OpenAI from "openai";
import { GenerateMenuInput, MenuOption } from "@/types/domain";
import { z } from "zod";
import { cookPlanAiSchema, formatMenuOptionForAi, shoppingItemAiSchema } from "@/lib/db-schema";

let openAiClient: OpenAI | null = null;

export function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openAiClient;
}

async function requestStructuredJson<T>(prompt: string): Promise<T> {
  const completion = await getOpenAiClient().responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  return JSON.parse(completion.output_text) as T;
}

const dishSchema = z.object({
  course: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  platingNotes: z.string().min(1),
  decorationNotes: z.string().optional(),
  beverageSuggestion: z.string().min(1).optional(),
  imagePrompt: z.string().min(1),
});

const menuOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  concept: z.string().min(1),
  dishes: z.array(dishSchema).min(1),
});

const menuGenerationSchema = z.object({
  options: z.array(menuOptionSchema).length(3),
});

export async function generateMichelinMenus(input: GenerateMenuInput): Promise<MenuOption[]> {
  const inviteeContext = input.inviteePreferences.length
    ? input.inviteePreferences
        .map((invitee) => `${invitee.label}${invitee.name ? ` (${invitee.name})` : ""}: ${invitee.restrictions.join(", ") || "none"}`)
        .join("; ")
    : "none";

  const prompt = `Create exactly 3 premium menu options for a ${input.mealType} with ${input.courseCount} courses.
Restrictions (aggregate): ${input.restrictions.join(", ") || "none"}.
Restrictions per individual: ${inviteeContext}.
Service date/time: ${input.serveAt}.
Guest count: ${input.inviteeCount}.
Chef notes: ${input.notes || "none"}.
Return ONLY valid JSON object with this shape:
{"options":[{"id":"option-1","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","decorationNotes":"...","beverageSuggestion":"...","imagePrompt":"high quality image prompt"}]}]}
Ensure "options" contains exactly 3 menu options.`;

  const payload = await requestStructuredJson<{ options?: unknown } | MenuOption[]>(prompt);
  const options = Array.isArray(payload) ? payload : payload.options;
  return menuGenerationSchema.parse({ options }).options;
}

export type ShoppingListAiItem = z.infer<typeof shoppingItemAiSchema>;

export type CookPlanPayload = z.infer<typeof cookPlanAiSchema>;

export async function generateShoppingListFromMenu(menuOption: MenuOption, inviteeCount: number): Promise<ShoppingListAiItem[]> {
  const prompt = `You are a Michelin operations sous-chef. Build a consolidated shopping list for ${inviteeCount} guests.
Menu: ${JSON.stringify(formatMenuOptionForAi(menuOption))}.
Return ONLY JSON object with key "items" where items is an array of objects:
{"items":[{"section":"Produce","item_name":"Lemon","quantity":2,"unit":"kg","note":"zest and juice"}]}
Use nullable quantity/unit/note when unknown.`;

  const payload = await requestStructuredJson<{ items?: unknown }>(prompt);
  return z.array(shoppingItemAiSchema).parse(payload.items ?? []);
}

export async function generateCookPlanFromMenu(menuOption: MenuOption, serveAtIso: string): Promise<CookPlanPayload> {
  const prompt = `Create an execution-grade cook plan for this menu and service time ${serveAtIso}:
${JSON.stringify(formatMenuOptionForAi(menuOption))}
Return ONLY JSON with keys:
overview, mise_en_place, plating_overview, service_notes, steps.
steps must be an array of objects with: step_no(integer), phase, title, details, dish_name(optional), relative_minutes(optional integer).`;

  const payload = await requestStructuredJson<unknown>(prompt);
  return cookPlanAiSchema.parse(payload);
}
