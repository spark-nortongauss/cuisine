import {
  type CookPlanPayload,
  type ShoppingListAiItem,
  generateCookPlanFromMenu,
  generateMichelinMenus,
  generateShoppingListFromMenu,
  repairMenuOptionForRestrictions,
  repairCookPlanForRestrictions,
  repairMichelinMenusForRestrictions,
  repairShoppingListForRestrictions,
} from "@/lib/ai/openai";
import { getCookStepRichnessIssues, normalizeCookPlanPayload } from "@/lib/cook-plan";
import {
  getRestrictionPromptGuidance,
  summarizeRestrictionViolations,
  validateCookPlanAgainstRestrictions,
  validateMenuOptionsAgainstRestrictions,
  validateShoppingItemsAgainstRestrictions,
} from "@/lib/menu-restrictions";
import type { GenerateMenuInput, MenuOption } from "@/types/domain";

const MAX_REPAIR_ATTEMPTS = 3;
const supportedMealTypes = new Set<GenerateMenuInput["mealType"]>(["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"]);
const supportedCourseCounts = new Set<GenerateMenuInput["courseCount"]>([1, 3, 4, 5, 6]);

function summarizeCookPlanIssues(payload: CookPlanPayload) {
  const issues = payload.steps.flatMap((step, index) => getCookStepRichnessIssues(step).map((issue) => `- Step ${index + 1}: ${issue}`));
  return issues.length ? issues.join("\n") : "No cook step richness issues found.";
}

function resolveMealType(value: string | null | undefined): GenerateMenuInput["mealType"] {
  return supportedMealTypes.has(value as GenerateMenuInput["mealType"]) ? (value as GenerateMenuInput["mealType"]) : "dinner";
}

function resolveCourseCount(count: number): GenerateMenuInput["courseCount"] {
  return supportedCourseCounts.has(count as GenerateMenuInput["courseCount"]) ? (count as GenerateMenuInput["courseCount"]) : 3;
}

export async function generateValidatedMichelinMenus(input: GenerateMenuInput): Promise<MenuOption[]> {
  let options = await generateMichelinMenus(input);

  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const violations = validateMenuOptionsAgainstRestrictions(options, input.restrictions);
    if (!violations.length) return options;

    options = await repairMichelinMenusForRestrictions({
      input,
      currentOptions: options,
      violationSummary: summarizeRestrictionViolations(violations),
      restrictionGuidance: getRestrictionPromptGuidance(input.restrictions),
    });
  }

  const finalViolations = validateMenuOptionsAgainstRestrictions(options, input.restrictions);
  throw new Error(`Restriction validation failed after repair attempts.\n${summarizeRestrictionViolations(finalViolations)}`);
}

export async function repairStoredMenuOptionUntilValid(params: {
  option: MenuOption;
  mealType?: string | null;
  inviteeCount?: number | null;
  serveAtIso?: string | null;
  restrictions: string[];
}): Promise<MenuOption> {
  let option = params.option;

  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const violations = validateMenuOptionsAgainstRestrictions([option], params.restrictions);
    if (!violations.length) return option;

    option = await repairMenuOptionForRestrictions({
      mealType: params.mealType,
      inviteeCount: params.inviteeCount,
      serveAtIso: params.serveAtIso,
      restrictions: params.restrictions,
      currentOption: option,
      violationSummary: summarizeRestrictionViolations(violations),
      restrictionGuidance: getRestrictionPromptGuidance(params.restrictions),
    });
  }

  const finalViolations = validateMenuOptionsAgainstRestrictions([option], params.restrictions);
  if (!finalViolations.length) {
    return option;
  }

  const replacements = await generateValidatedMichelinMenus({
    courseCount: resolveCourseCount(params.option.dishes.length),
    mealType: resolveMealType(params.mealType),
    restrictions: params.restrictions,
    notes: params.option.concept,
    serveAt: params.serveAtIso ?? new Date().toISOString(),
    inviteeCount: params.inviteeCount ?? 1,
    inviteePreferences: [],
  });

  return {
    ...replacements[0],
    id: params.option.id,
  };
}

export async function generateValidatedShoppingList(params: {
  menuOption: MenuOption;
  inviteeCount: number;
  restrictions: string[];
}): Promise<ShoppingListAiItem[]> {
  let items = await generateShoppingListFromMenu(params.menuOption, params.inviteeCount, params.restrictions);

  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const violations = validateShoppingItemsAgainstRestrictions(items, params.restrictions);
    if (!violations.length) return items;

    items = await repairShoppingListForRestrictions({
      menuOption: params.menuOption,
      inviteeCount: params.inviteeCount,
      restrictions: params.restrictions,
      currentItems: items,
      violationSummary: summarizeRestrictionViolations(violations),
      restrictionGuidance: getRestrictionPromptGuidance(params.restrictions),
    });
  }

  const finalViolations = validateShoppingItemsAgainstRestrictions(items, params.restrictions);
  throw new Error(`Shopping list restriction validation failed after repair attempts.\n${summarizeRestrictionViolations(finalViolations)}`);
}

export async function generateValidatedCookPlan(params: {
  menuOption: MenuOption;
  serveAtIso: string;
  restrictions: string[];
  shoppingItems?: Array<{
    section: string | null;
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    purchased?: boolean | null;
  }>;
}): Promise<CookPlanPayload> {
  const normalizedShoppingItems = (params.shoppingItems ?? []).map((item) => ({
    ...item,
    purchased: item.purchased ?? null,
  }));

  let payload = normalizeCookPlanPayload(
    await generateCookPlanFromMenu(params.menuOption, params.serveAtIso, normalizedShoppingItems, params.restrictions),
  );

  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const restrictionViolations = validateCookPlanAgainstRestrictions(
      payload,
      params.restrictions,
      params.menuOption.dishes.map((dish) => dish.name),
    );
    const richnessIssues = summarizeCookPlanIssues(payload);
    const needsRichnessRepair = richnessIssues !== "No cook step richness issues found.";

    if (!restrictionViolations.length && !needsRichnessRepair) return payload;

    payload = normalizeCookPlanPayload(
      await repairCookPlanForRestrictions({
        menuOption: params.menuOption,
        serveAtIso: params.serveAtIso,
        restrictions: params.restrictions,
        shoppingItems: normalizedShoppingItems,
        currentCookPlan: payload,
        violationSummary: summarizeRestrictionViolations(restrictionViolations),
        richnessSummary: richnessIssues,
        restrictionGuidance: getRestrictionPromptGuidance(params.restrictions),
      }),
    );
  }

  const finalViolations = validateCookPlanAgainstRestrictions(
    payload,
    params.restrictions,
    params.menuOption.dishes.map((dish) => dish.name),
  );
  const finalRichness = summarizeCookPlanIssues(payload);
  throw new Error(
    `Cook plan validation failed after repair attempts.\n${summarizeRestrictionViolations(finalViolations)}\n${finalRichness}`,
  );
}
