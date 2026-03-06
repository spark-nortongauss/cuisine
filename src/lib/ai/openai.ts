import OpenAI from "openai";
import { GenerateMenuInput, MenuOption } from "@/types/domain";

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
  return JSON.parse(text) as T;
}

export async function generateMichelinMenus(input: GenerateMenuInput): Promise<MenuOption[]> {
  const prompt = `Create exactly 3 premium menu options for a ${input.mealType} with ${input.courseCount} courses.
Restrictions: ${input.restrictions.join(", ") || "none"}.
Service date/time: ${input.serveAt}.
Guest count: ${input.inviteeCount}.
Chef notes: ${input.notes || "none"}.
Return ONLY valid JSON array of exactly 3 objects with shape:
[{"id":"option-1","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","beverageSuggestion":"...","imagePrompt":"high quality image prompt"}]}]`;

  return requestStructuredJson<MenuOption[]>(prompt);
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
