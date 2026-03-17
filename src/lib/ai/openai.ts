import OpenAI from "openai";
import { z } from "zod";
import { cookPlanAiSchema, formatMenuOptionForAi, shoppingItemAiSchema } from "@/lib/db-schema";
import { normalizeCookPlanPayload } from "@/lib/cook-plan";
import { getRestrictionPromptGuidance } from "@/lib/menu-restrictions";
import type { GenerateMenuInput, MenuOption } from "@/types/domain";

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

function normalizeCookPlanResponse(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];

  return normalizeCookPlanPayload({
    ...(record as Record<string, unknown>),
    overview: stringifyCookPlanField(record.overview),
    mise_en_place: stringifyCookPlanField(record.mise_en_place),
    plating_overview: stringifyCookPlanField(record.plating_overview),
    service_notes: stringifyCookPlanField(record.service_notes),
    steps: rawSteps.map((step, index) => {
      const stepRecord = step && typeof step === "object" ? (step as Record<string, unknown>) : {};
      return {
        step_no: typeof stepRecord.step_no === "number" ? stepRecord.step_no : index + 1,
        phase: typeof stepRecord.phase === "string" ? stepRecord.phase : "cooking phase",
        title: typeof stepRecord.title === "string" ? stepRecord.title : `Step ${index + 1}`,
        details: stringifyCookPlanField(stepRecord.details),
        technique: typeof stepRecord.technique === "string" ? stepRecord.technique : "Chef technique",
        knife_cut: typeof stepRecord.knife_cut === "string" ? stepRecord.knife_cut : null,
        utensils: Array.isArray(stepRecord.utensils) ? stepRecord.utensils.map((item) => String(item)) : [],
        dish_name: typeof stepRecord.dish_name === "string" ? stepRecord.dish_name : null,
        relative_minutes: typeof stepRecord.relative_minutes === "number" ? stepRecord.relative_minutes : null,
      };
    }),
  });
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
  const courseLabel = input.courseCount === 1 ? "course" : "courses";
  const restrictionGuidance = getRestrictionPromptGuidance(input.restrictions) || "- No additional restriction guidance.";

  const prompt = `Create exactly 3 premium menu options for a ${input.mealType} with ${input.courseCount} ${courseLabel}.
Restrictions (aggregate): ${input.restrictions.join(", ") || "none"}.
Restrictions per individual: ${inviteeContext}.
Service date/time: ${input.serveAt}.
Guest count: ${input.inviteeCount}.
Chef notes: ${input.notes || "none"}.
Restriction safety rules:
${restrictionGuidance}

Return ONLY valid JSON object with this shape:
{"options":[{"id":"option-1","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","decorationNotes":"...","beverageSuggestion":"...","imagePrompt":"high quality image prompt"}]}]}

Rules:
1) Ensure "options" contains exactly 3 menu options.
2) Every option, dish, ingredient implication, sauce, garnish, beverage pairing, and image prompt must fully respect every listed restriction.
3) If seafood or shellfish are restricted, do not mention seafood, shellfish, fish stock, roe, or shellfish-adjacent garnishes anywhere.
4) If diabetes type 1 or type 2 is restricted, avoid overtly sugary preparations, desserts, syrups, candied garnishes, or refined-sugar-heavy sauces.
5) Never leak ingredients, dish ideas, or language from another menu context.
6) Keep the tone Michelin-style, premium, and feasible for service.
7) Descriptions should imply the core ingredients clearly enough for downstream shopping and cook planning.`;

  const payload = await requestStructuredJson<{ options?: unknown } | MenuOption[]>(prompt);
  const options = Array.isArray(payload) ? payload : payload.options;
  return menuGenerationSchema.parse({ options }).options;
}

export async function repairMichelinMenusForRestrictions(params: {
  input: GenerateMenuInput;
  currentOptions: MenuOption[];
  violationSummary: string;
  restrictionGuidance: string;
}): Promise<MenuOption[]> {
  const courseLabel = params.input.courseCount === 1 ? "course" : "courses";
  const prompt = `You are repairing generated Michelin-style menu options so they become fully restriction-safe.
Event: ${params.input.mealType}, ${params.input.courseCount} ${courseLabel}, ${params.input.inviteeCount} guests, service at ${params.input.serveAt}.
Chef notes: ${params.input.notes || "none"}.
Restrictions: ${params.input.restrictions.join(", ") || "none"}.
Restriction safety rules:
${params.restrictionGuidance}

Current menu options:
${JSON.stringify(params.currentOptions)}

Violations to fix:
${params.violationSummary}

Return ONLY valid JSON object:
{"options":[{"id":"option-1","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","decorationNotes":"...","beverageSuggestion":"...","imagePrompt":"..."}]}]}

Repair instructions:
1) Preserve exactly 3 options and preserve each option id.
2) Replace or rewrite any violating dish, sauce, garnish, pairing, or prompt content.
3) Keep the menus premium and Michelin-style.
4) Do not leak ingredients or dish ideas from another option.
5) Every field must be safe, not just visible dish text.`;

  const payload = await requestStructuredJson<{ options?: unknown } | MenuOption[]>(prompt);
  const options = Array.isArray(payload) ? payload : payload.options;
  return menuGenerationSchema.parse({ options }).options;
}

export async function repairMenuOptionForRestrictions(params: {
  mealType?: string | null;
  inviteeCount?: number | null;
  serveAtIso?: string | null;
  restrictions: string[];
  currentOption: MenuOption;
  violationSummary: string;
  restrictionGuidance: string;
}): Promise<MenuOption> {
  const prompt = `You are repairing one Michelin-style menu option so it becomes fully restriction-safe while preserving a premium restaurant feel.
Meal type: ${params.mealType ?? "unknown"}.
Guest count: ${params.inviteeCount ?? "unknown"}.
Service datetime: ${params.serveAtIso ?? "unknown"}.
Restrictions: ${params.restrictions.join(", ") || "none"}.
Restriction safety rules:
${params.restrictionGuidance}

Current option:
${JSON.stringify(params.currentOption)}

Violations to fix:
${params.violationSummary}

Return ONLY valid JSON object:
{"option":{"id":"${params.currentOption.id}","title":"...","concept":"...","dishes":[{"course":"...","name":"...","description":"...","platingNotes":"...","decorationNotes":"...","beverageSuggestion":"...","imagePrompt":"..."}]}}

Repair instructions:
1) Preserve the option id exactly as provided.
2) Replace or rewrite any violating dish, sauce, garnish, pairing, or hidden prompt content.
3) Every field must respect the listed restrictions, including descriptions, plating notes, beverage suggestions, and image prompts.
4) Keep the menu Michelin-style, coherent, and feasible.
5) Do not leak ingredients or dish ideas from another menu context.`;

  const payload = await requestStructuredJson<{ option?: unknown } | MenuOption>(prompt);
  const option = ("option" in payload ? payload.option : payload) ?? payload;
  return menuOptionSchema.parse(option);
}

export type ShoppingListAiItem = z.infer<typeof shoppingItemAiSchema>;

const shoppingPriceEstimateSchema = z.object({
  index: z.number().int().min(0),
  estimated_unit_price_eur: z.number().positive().nullable().optional(),
  estimated_total_price_eur: z.number().positive().nullable().optional(),
});

const shoppingPriceEstimatePayloadSchema = z.object({
  items: z.array(shoppingPriceEstimateSchema),
  estimated_shopping_total_eur: z.number().positive().nullable().optional(),
});

const platingGuidanceItemSchema = z.object({
  dish_name: z.string().min(1),
  plating_notes: z.string().min(1),
  decoration_notes: z.string().min(1),
  image_prompt: z.string().min(1),
});

const platingGuidancePayloadSchema = z.object({
  dishes: z.array(platingGuidanceItemSchema),
});

export type CookPlanPayload = z.infer<typeof cookPlanAiSchema>;

export async function estimateShoppingPricesForFrance(items: Array<{
  item_name: string;
  quantity: number | null;
  unit: string | null;
  section: string | null;
}>): Promise<z.infer<typeof shoppingPriceEstimatePayloadSchema>> {
  const prompt = `You estimate practical grocery prices in France (EUR), no live scraping, only cautious approximations.
Return ONLY valid JSON with shape:
{"items":[{"index":0,"estimated_unit_price_eur":2.3,"estimated_total_price_eur":4.6}],"estimated_shopping_total_eur":40.1}

Rules:
1) Keep values realistic for regular French supermarkets in 2026.
2) If quantity/unit is unclear, return estimated_unit_price_eur and set estimated_total_price_eur to null.
3) Numbers must be positive when provided.
4) Don't overfit luxury ingredients unless item clearly requires it.
5) This is an estimate only.

Items (index-aligned): ${JSON.stringify(items)}`;

  const payload = await requestStructuredJson<unknown>(prompt);
  return shoppingPriceEstimatePayloadSchema.parse(payload);
}

export async function generatePlatingGuidanceForMenuOption(menuOption: MenuOption): Promise<z.infer<typeof platingGuidancePayloadSchema>> {
  const prompt = `You are a Michelin plating coach for beginners.
Generate plating assembly guidance for each dish and a plating-focused image prompt.
Menu option: ${JSON.stringify(formatMenuOptionForAi(menuOption))}

Return ONLY valid JSON:
{"dishes":[{"dish_name":"...","plating_notes":"...","decoration_notes":"...","image_prompt":"..."}]}

Guidance must be practical and premium, including when relevant:
- plate/base choice
- what goes first
- where main component goes
- where sauce goes
- garnish placement
- finishing touches
- clean rim / serving notes
- no markdown bullets, just clear sentences.`;

  const payload = await requestStructuredJson<unknown>(prompt);
  return platingGuidancePayloadSchema.parse(payload);
}

export async function generateShoppingListFromMenu(menuOption: MenuOption, inviteeCount: number, restrictions: string[] = []): Promise<ShoppingListAiItem[]> {
  const restrictionGuidance = getRestrictionPromptGuidance(restrictions) || "- No additional restriction guidance.";
  const prompt = `You are a Michelin operations sous-chef. Build a consolidated shopping list for ${inviteeCount} guests.
Menu: ${JSON.stringify(formatMenuOptionForAi(menuOption))}.
Restrictions: ${restrictions.join(", ") || "none"}.
Restriction safety rules:
${restrictionGuidance}

Return ONLY JSON object with key "items" where items is an array of objects:
{"items":[{"section":"Produce","item_name":"Lemon","quantity":2,"unit":"kg","note":"zest and juice"}]}

Rules:
1) Only include ingredients required for this exact menu option.
2) Never leak ingredients from another option, another dish family, or a different menu.
3) Keep quantities practical and explicit whenever they can be inferred.
4) Ensure every item and note respects all restrictions.
5) Use nullable quantity/unit/note when unknown.`;

  const payload = await requestStructuredJson<{ items?: unknown }>(prompt);
  return z.array(shoppingItemAiSchema).parse(payload.items ?? []);
}

export async function repairShoppingListForRestrictions(params: {
  menuOption: MenuOption;
  inviteeCount: number;
  restrictions: string[];
  currentItems: ShoppingListAiItem[];
  violationSummary: string;
  restrictionGuidance: string;
}): Promise<ShoppingListAiItem[]> {
  const prompt = `You are repairing a Michelin-style shopping list so it becomes fully restriction-safe and free of cross-menu leakage.
Guest count: ${params.inviteeCount}
Restrictions: ${params.restrictions.join(", ") || "none"}.
Restriction safety rules:
${params.restrictionGuidance}
Menu option:
${JSON.stringify(formatMenuOptionForAi(params.menuOption))}

Current shopping list:
${JSON.stringify(params.currentItems)}

Violations to fix:
${params.violationSummary}

Return ONLY valid JSON object:
{"items":[{"section":"Produce","item_name":"Lemon","quantity":2,"unit":"kg","note":"zest and juice"}]}

Rules:
1) Include only ingredients needed for this menu option.
2) Remove or replace any violating item.
3) Keep quantities practical and explicit whenever they can be inferred.
4) Keep the same premium kitchen-operations tone.`;

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
  restrictions: string[] = [],
): Promise<CookPlanPayload> {
  const shoppingContext = shoppingItems.length
    ? `Shopping list context: ${JSON.stringify(shoppingItems)}.`
    : "Shopping list context: none provided.";
  const restrictionGuidance = getRestrictionPromptGuidance(restrictions) || "- No additional restriction guidance.";

  const prompt = `You are an expert executive sous-chef writing an operational cookbook for a complete beginner.
Service datetime (ISO): ${serveAtIso}
Selected approved menu option: ${JSON.stringify(formatMenuOptionForAi(menuOption))}
${shoppingContext}
Restrictions: ${restrictions.join(", ") || "none"}.
Restriction safety rules:
${restrictionGuidance}

Return ONLY valid JSON with keys:
- overview
- mise_en_place
- plating_overview
- service_notes
- steps

Rules:
1) Keep language practical, imperative, and beginner-safe.
2) Use explicit timeline phases in steps.phase such as: day-before prep, mise-en-place, cooking phase, resting/holding, plating, service.
3) steps must be an ordered array where each item has: step_no (int), phase, title, details, technique, knife_cut(optional nullable), utensils(array of strings), dish_name(optional), relative_minutes(optional int).
4) technique must use professional kitchen terminology but stay beginner-friendly.
5) knife_cut should be present only when relevant (e.g. julienne, brunoise, chiffonade, dice, mince, paysanne) otherwise null.
6) utensils must include the key tools and utensils needed for the step.
7) details must be highly detailed and use separate newline-delimited lines with these exact labels whenever relevant:
   - Action:
   - Ingredients & amounts:
   - Duration:
   - Heat:
   - Tools:
   - Technique:
   - Knife cut:
   - Visual cue:
   - Avoid:
   - Chef tip:
   - Hold/storage:
8) Infer exact ingredient amounts from the shopping list context whenever possible and allocate them consistently to the step at hand.
9) Every step title should begin with a strong action verb.
10) Every step must help a total beginner execute the dish confidently, including visual cues of doneness, frequent mistakes, and pro tips.
11) Do not introduce restricted ingredients, off-menu ingredients, or dish-name leakage from another menu or option.
12) relative_minutes should be tied to service time, negative for before service and 0 at service.
13) End with explicit plating and final service sequence.
14) Avoid vague phrasing like "cook until done"; always include practical cues.
15) Keep output schema-compatible and deterministic.`;

  const payload = await requestStructuredJson<unknown>(prompt);
  return cookPlanAiSchema.parse(normalizeCookPlanResponse(payload));
}

export async function repairCookPlanForRestrictions(params: {
  menuOption: MenuOption;
  serveAtIso: string;
  restrictions: string[];
  shoppingItems: Array<{
    section: string | null;
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    purchased?: boolean | null;
  }>;
  currentCookPlan: CookPlanPayload;
  violationSummary: string;
  richnessSummary: string;
  restrictionGuidance: string;
}): Promise<CookPlanPayload> {
  const prompt = `You are repairing a detailed cook plan so it becomes restriction-safe, menu-accurate, and beginner-proof.
Service datetime (ISO): ${params.serveAtIso}
Restrictions: ${params.restrictions.join(", ") || "none"}.
Restriction safety rules:
${params.restrictionGuidance}
Selected approved menu option:
${JSON.stringify(formatMenuOptionForAi(params.menuOption))}
Shopping list context:
${JSON.stringify(params.shoppingItems)}

Current cook plan:
${JSON.stringify(params.currentCookPlan)}

Restriction or cross-menu issues:
${params.violationSummary}

Missing beginner-detail issues:
${params.richnessSummary}

Return ONLY valid JSON with keys overview, mise_en_place, plating_overview, service_notes, steps.

Repair rules:
1) Keep the schema exactly the same.
2) Ensure every step details field uses newline-delimited labels exactly as follows when relevant:
Action:
Ingredients & amounts:
Duration:
Heat:
Tools:
Technique:
Knife cut:
Visual cue:
Avoid:
Chef tip:
Hold/storage:
3) Infer exact ingredient amounts from the shopping list when possible.
4) Do not introduce any ingredient or dish name that is not part of the selected menu option or shopping list.
5) Keep the language beginner-friendly but premium and operationally precise.
6) Every step title should begin with a strong action verb.`;

  const payload = await requestStructuredJson<unknown>(prompt);
  return cookPlanAiSchema.parse(normalizeCookPlanResponse(payload));
}
