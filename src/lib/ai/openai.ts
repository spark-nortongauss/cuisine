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

function stringifyCookPlanField(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : JSON.stringify(item)))
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, fieldValue]) => `${key}: ${typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}`)
      .join("\n");
  }
  return "";
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

export async function generateCookPlanFromMenu(
  menuOption: MenuOption,
  serveAtIso: string,
  shoppingItems: Array<{
    section: string | null;
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    purchased: boolean | null;
  }> = [],
): Promise<CookPlanPayload> {
  const shoppingContext = shoppingItems.length
    ? `Shopping list context: ${JSON.stringify(shoppingItems)}.`
    : "Shopping list context: none provided.";

  const prompt = `You are an expert executive sous-chef writing an operational cookbook for a complete beginner.
Service datetime (ISO): ${serveAtIso}
Selected approved menu option: ${JSON.stringify(formatMenuOptionForAi(menuOption))}
${shoppingContext}

Return ONLY valid JSON with keys:
- overview
- mise_en_place
- plating_overview
- service_notes
- steps

Rules:
1) Keep language practical, imperative, and beginner-safe.
2) Use explicit timeline phases in steps.phase such as: day-before prep, mise-en-place, cooking phase, resting/holding, plating, service.
3) steps must be an ordered array where each item has: step_no (int), phase, title, details, dish_name(optional), relative_minutes(optional int).
4) details must be rich and structured in readable bullet-like lines including (when relevant):
   - objective
   - required ingredients/tools
   - exact actions
   - approximate duration
   - heat/temperature guidance
   - visual/texture cue of doneness
   - common mistakes warning
   - advance prep vs last-minute action
5) relative_minutes should be tied to service time, negative for before service and 0 at service.
6) End with explicit plating and final service sequence.
7) Avoid vague phrasing like "cook until done"; always include practical cues.
8) Keep output schema-compatible and deterministic.`;

  const payload = await requestStructuredJson<unknown>(prompt);
  const normalizedPayload = payload && typeof payload === "object"
    ? {
        ...(payload as Record<string, unknown>),
        mise_en_place: stringifyCookPlanField((payload as Record<string, unknown>).mise_en_place),
        plating_overview: stringifyCookPlanField((payload as Record<string, unknown>).plating_overview),
        service_notes: stringifyCookPlanField((payload as Record<string, unknown>).service_notes),
      }
    : payload;

  return cookPlanAiSchema.parse(normalizedPayload);
}
