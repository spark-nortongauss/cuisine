import OpenAI from "openai";
import { GenerateMenuInput, MenuOption } from "@/types/domain";
import { z } from "zod";

let openAiClient: OpenAI | null = null;

function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openAiClient;
}

async function requestStructuredJson<T>(prompt: string): Promise<T> {
  const completion = await getOpenAiClient().responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = completion.output_text;
  const normalized = text.trim();

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)\s*```/i) ?? normalized.match(/```\s*([\s\S]*?)\s*```/i);
    const candidate = fencedMatch?.[1]?.trim();
    if (candidate) {
      return JSON.parse(candidate) as T;
    }
    throw new Error("AI response was not valid JSON");
  }
}

const dishSchema = z.object({
  course: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  platingNotes: z.string().min(1),
  beverageSuggestion: z.string().optional(),
  imagePrompt: z.string().min(1),
});

const generatedMenuOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  concept: z.string().min(1),
  dishes: z.array(dishSchema),
});

const generatedMenuOptionsSchema = z.array(generatedMenuOptionSchema).length(3);

export async function generateMichelinMenus(input: GenerateMenuInput): Promise<MenuOption[]> {
  const prompt = `Create exactly 3 premium menu options for a ${input.mealType} with ${input.courseCount} courses.
Restrictions: ${input.restrictions.join(", ") || "none"}.
Service date/time: ${input.serveAt}.
Guest count: ${input.inviteeCount}.
Chef notes: ${input.notes || "none"}.
Return ONLY valid JSON array of exactly 3 objects with shape:
[{"id":"option-1","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","beverageSuggestion":"...","imagePrompt":"high quality image prompt"}]}]`;

  const parsed = await requestStructuredJson<unknown>(prompt);
  return generatedMenuOptionsSchema.parse(parsed);
}

export type ShoppingListAiItem = {
  section: string;
  item_name: string;
  quantity: number;
  unit: string;
  notes?: string;
};

export type CookPlanPayload = {
  prepSchedule: { slot: string; action: string }[];
  miseEnPlace: string[];
  timeline: { time: string; step: string }[];
  serviceSequence: string[];
  platingAssemblyNotes: string[];
  assemblyDraft: string;
  recipes: { dish: string; ingredients: string[]; method: string[] }[];
};

export async function generateShoppingListFromMenu(menuOption: MenuOption, inviteeCount: number): Promise<ShoppingListAiItem[]> {
  const prompt = `You are a Michelin operations sous-chef. Build a consolidated shopping list for ${inviteeCount} guests.
Menu: ${JSON.stringify(menuOption)}.
Return ONLY JSON array with section, item_name, quantity(number), unit, notes.
Merge duplicate ingredients and include practical purchasing units.`;

  return requestStructuredJson<ShoppingListAiItem[]>(prompt);
}

export async function generateCookPlanFromMenu(menuOption: MenuOption, serveAtIso: string): Promise<CookPlanPayload> {
  const prompt = `Create an execution-grade cook plan for this menu and service time ${serveAtIso}:
${JSON.stringify(menuOption)}
Return ONLY JSON object with keys: prepSchedule, miseEnPlace, timeline, serviceSequence, platingAssemblyNotes, assemblyDraft, recipes.
recipes is an array with dish, ingredients[], method[].`;

  return requestStructuredJson<CookPlanPayload>(prompt);
}
