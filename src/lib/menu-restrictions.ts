import type { MenuOption } from "@/types/domain";

export type RestrictionCategory = "allergen" | "diet" | "wellness";

export type RestrictionDefinition = {
  value: string;
  key: string;
  category: RestrictionCategory;
  promptGuard: string;
  patterns: string[];
};

export type RestrictionViolation = {
  restriction: string;
  restrictionKey: string;
  path: string;
  term: string;
  excerpt: string;
};

type TextInspectionItem = {
  path: string;
  value?: string | null;
};

type ShoppingItemLike = {
  section?: string | null;
  item_name?: string | null;
  note?: string | null;
};

type CookPlanLike = {
  overview: string;
  mise_en_place: string;
  plating_overview: string;
  service_notes: string;
  steps: Array<{
    phase: string;
    title: string;
    details: string;
    technique?: string | null;
    knife_cut?: string | null;
    dish_name?: string | null;
    utensils?: string[] | null;
  }>;
};

const restrictionCatalog: RestrictionDefinition[] = [
  {
    value: "seafood",
    key: "seafood",
    category: "diet",
    promptGuard: "Absolutely no fish, seafood, roe, or shellfish in any dish, ingredient, sauce, garnish, or hidden field.",
    patterns: [
      "seafood",
      "fish",
      "anchovy",
      "sardine",
      "salmon",
      "tuna",
      "cod",
      "halibut",
      "trout",
      "snapper",
      "bass",
      "branzino",
      "sole",
      "mackerel",
      "eel",
      "octopus",
      "squid",
      "calamari",
      "caviar",
      "roe",
      "uni",
      "shrimp",
      "prawn",
      "lobster",
      "crab",
      "mussel",
      "clam",
      "oyster",
      "scallop",
    ],
  },
  {
    value: "shellfish",
    key: "shellfish",
    category: "allergen",
    promptGuard: "Absolutely no shellfish or shellfish-derived ingredients.",
    patterns: [
      "shellfish",
      "shrimp",
      "prawn",
      "lobster",
      "crab",
      "crayfish",
      "langoustine",
      "mussel",
      "clam",
      "oyster",
      "scallop",
      "cockle",
      "abalone",
    ],
  },
  {
    value: "gluten",
    key: "gluten",
    category: "allergen",
    promptGuard: "Absolutely no gluten-containing grains, breading, pasta, or wheat-based sauces.",
    patterns: [
      "gluten",
      "wheat",
      "flour",
      "semolina",
      "couscous",
      "barley",
      "rye",
      "breadcrumb",
      "breadcrumbs",
      "bread",
      "brioche",
      "panko",
      "pasta",
      "noodle",
      "seitan",
      "soy sauce",
      "beer batter",
    ],
  },
  {
    value: "lactose",
    key: "lactose",
    category: "allergen",
    promptGuard: "Absolutely no dairy or lactose-bearing ingredients.",
    patterns: [
      "milk",
      "cream",
      "butter",
      "cheese",
      "yogurt",
      "yoghurt",
      "creme fraiche",
      "mascarpone",
      "ricotta",
      "whey",
      "buttermilk",
      "condensed milk",
      "ghee",
    ],
  },
  {
    value: "peanuts",
    key: "peanuts",
    category: "allergen",
    promptGuard: "Absolutely no peanuts or peanut-based sauces, oils, or garnishes.",
    patterns: ["peanut", "groundnut", "satay"],
  },
  {
    value: "tree nuts",
    key: "treeNuts",
    category: "allergen",
    promptGuard: "Absolutely no tree nuts or nut pastes/pralines.",
    patterns: [
      "almond",
      "pistachio",
      "hazelnut",
      "walnut",
      "pecan",
      "cashew",
      "macadamia",
      "brazil nut",
      "pine nut",
      "chestnut",
      "marzipan",
      "praline",
      "gianduja",
    ],
  },
  {
    value: "eggs",
    key: "eggs",
    category: "allergen",
    promptGuard: "Absolutely no egg or egg-based foams, custards, emulsions, or pasta.",
    patterns: ["egg", "yolk", "meringue", "mayonnaise", "aioli", "custard"],
  },
  {
    value: "soy",
    key: "soy",
    category: "allergen",
    promptGuard: "Absolutely no soy products or soy-based sauces.",
    patterns: ["soy", "tofu", "tempeh", "miso", "edamame", "tamari", "shoyu"],
  },
  {
    value: "sesame",
    key: "sesame",
    category: "allergen",
    promptGuard: "Absolutely no sesame seeds, tahini, or sesame oil.",
    patterns: ["sesame", "tahini", "gomashio"],
  },
  {
    value: "vegetarian",
    key: "vegetarian",
    category: "diet",
    promptGuard: "All dishes must be vegetarian with no meat, poultry, seafood, fish sauce, or animal stock.",
    patterns: [
      "beef",
      "pork",
      "chicken",
      "duck",
      "lamb",
      "veal",
      "turkey",
      "bacon",
      "ham",
      "pancetta",
      "prosciutto",
      "sausage",
      "salami",
      "anchovy",
      "fish",
      "seafood",
      "shellfish",
      "chicken stock",
      "beef stock",
      "veal stock",
      "fish stock",
      "gelatin",
      "gelatine",
    ],
  },
  {
    value: "vegan",
    key: "vegan",
    category: "diet",
    promptGuard: "All dishes must be fully vegan with no animal products whatsoever.",
    patterns: [
      "beef",
      "pork",
      "chicken",
      "duck",
      "lamb",
      "veal",
      "turkey",
      "bacon",
      "ham",
      "fish",
      "seafood",
      "shellfish",
      "milk",
      "cream",
      "butter",
      "cheese",
      "yogurt",
      "yoghurt",
      "egg",
      "honey",
      "gelatin",
      "gelatine",
    ],
  },
  {
    value: "pork-free",
    key: "porkFree",
    category: "diet",
    promptGuard: "Absolutely no pork or pork-derived charcuterie, fat, or gelatin.",
    patterns: ["pork", "bacon", "ham", "pancetta", "prosciutto", "guanciale", "chorizo", "salami", "lard", "nduja"],
  },
  {
    value: "diabetes type 1",
    key: "diabetesType1",
    category: "wellness",
    promptGuard:
      "Keep dishes diabetes-aware: avoid overtly sugary dishes, syrups, candies, dessert-style courses, sweet fruit-heavy finales, or refined-sugar-heavy preparations. Favor savory, low-sugar finishes instead.",
    patterns: [
      "dessert",
      "sweet",
      "sweetened",
      "sugar",
      "cane sugar",
      "brown sugar",
      "icing sugar",
      "powdered sugar",
      "syrup",
      "honey",
      "caramel",
      "candy",
      "candied",
      "marshmallow",
      "jam",
      "jelly",
      "soda",
      "cola",
      "frosting",
      "cake",
      "brownie",
      "doughnut",
      "donut",
      "biscuit",
      "sable",
      "fruit coulis",
      "fruit puree",
      "mango",
      "passionfruit",
      "passion fruit",
      "pastry cream",
      "sweetened condensed milk",
      "maple syrup",
      "agave",
      "molasses",
      "sorbet",
      "ice cream",
    ],
  },
  {
    value: "diabetes type 2",
    key: "diabetesType2",
    category: "wellness",
    promptGuard:
      "Keep dishes diabetes-aware: avoid overtly sugary dishes, syrups, candies, dessert-style courses, sweet fruit-heavy finales, or refined-sugar-heavy preparations. Favor savory, low-sugar finishes instead.",
    patterns: [
      "dessert",
      "sweet",
      "sweetened",
      "sugar",
      "cane sugar",
      "brown sugar",
      "icing sugar",
      "powdered sugar",
      "syrup",
      "honey",
      "caramel",
      "candy",
      "candied",
      "marshmallow",
      "jam",
      "jelly",
      "soda",
      "cola",
      "frosting",
      "cake",
      "brownie",
      "doughnut",
      "donut",
      "biscuit",
      "sable",
      "fruit coulis",
      "fruit puree",
      "mango",
      "passionfruit",
      "passion fruit",
      "pastry cream",
      "sweetened condensed milk",
      "maple syrup",
      "agave",
      "molasses",
      "sorbet",
      "ice cream",
    ],
  },
];

const restrictionLookup = new Map(restrictionCatalog.map((item) => [normalizeRestrictionValue(item.value), item]));
const negationMarkers = ["free", "free of", "without", "omit", "omitting", "avoiding", "avoid", "exclude", "excluding", "skip"];

export const restrictionOptions = restrictionCatalog.map((item) => item.value);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildPatternRegex(term: string) {
  return new RegExp(`(^|[^a-z])${escapeRegex(term).replace(/\s+/g, "\\s+")}([^a-z]|$)`, "gi");
}

function hasNegatingContext(text: string, index: number) {
  const windowStart = Math.max(0, index - 20);
  const leadingText = text.slice(windowStart, index);
  return negationMarkers.some((marker) => leadingText.includes(marker));
}

function buildExcerpt(text: string, index: number, length: number) {
  const start = Math.max(0, index - 28);
  const end = Math.min(text.length, index + length + 28);
  return text.slice(start, end).trim();
}

export function normalizeRestrictionValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRestrictionDefinition(restriction: string) {
  return restrictionLookup.get(normalizeRestrictionValue(restriction)) ?? null;
}

export function getRestrictionPromptGuidance(restrictions: string[]) {
  const seen = new Set<string>();
  return restrictions
    .map((restriction) => getRestrictionDefinition(restriction))
    .filter((definition): definition is RestrictionDefinition => Boolean(definition))
    .filter((definition) => {
      if (seen.has(definition.value)) return false;
      seen.add(definition.value);
      return true;
    })
    .map((definition) => `- ${definition.promptGuard}`)
    .join("\n");
}

function inspectTextItems(items: TextInspectionItem[], restrictions: string[]) {
  const violations: RestrictionViolation[] = [];

  for (const restriction of restrictions) {
    const definition = getRestrictionDefinition(restriction);
    if (!definition) continue;

    for (const item of items) {
      const source = item.value?.trim();
      if (!source) continue;

      const normalized = normalizeText(source);

      for (const term of definition.patterns) {
        const regex = buildPatternRegex(term);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(normalized)) !== null) {
          const index = match.index + (match[1]?.length ?? 0);
          if (hasNegatingContext(normalized, index)) continue;

          violations.push({
            restriction: definition.value,
            restrictionKey: definition.key,
            path: item.path,
            term,
            excerpt: buildExcerpt(source, index, term.length),
          });
          break;
        }

        const mostRecent = violations[violations.length - 1];
        if (mostRecent?.path === item.path && mostRecent.term === term) {
          break;
        }
      }
    }
  }

  return violations;
}

export function validateMenuOptionsAgainstRestrictions(options: MenuOption[], restrictions: string[]) {
  return inspectTextItems(
    options.flatMap((option, optionIndex) => [
      { path: `options[${optionIndex}].title`, value: option.title },
      { path: `options[${optionIndex}].concept`, value: option.concept },
      ...option.dishes.flatMap((dish, dishIndex) => [
        { path: `options[${optionIndex}].dishes[${dishIndex}].course`, value: dish.course },
        { path: `options[${optionIndex}].dishes[${dishIndex}].name`, value: dish.name },
        { path: `options[${optionIndex}].dishes[${dishIndex}].description`, value: dish.description },
        { path: `options[${optionIndex}].dishes[${dishIndex}].platingNotes`, value: dish.platingNotes },
        { path: `options[${optionIndex}].dishes[${dishIndex}].decorationNotes`, value: dish.decorationNotes },
        { path: `options[${optionIndex}].dishes[${dishIndex}].beverageSuggestion`, value: dish.beverageSuggestion },
        { path: `options[${optionIndex}].dishes[${dishIndex}].imagePrompt`, value: dish.imagePrompt },
      ]),
    ]),
    restrictions,
  );
}

export function validateShoppingItemsAgainstRestrictions(items: ShoppingItemLike[], restrictions: string[]) {
  return inspectTextItems(
    items.flatMap((item, index) => [
      { path: `shoppingItems[${index}].section`, value: item.section },
      { path: `shoppingItems[${index}].item_name`, value: item.item_name },
      { path: `shoppingItems[${index}].note`, value: item.note },
    ]),
    restrictions,
  );
}

export function validateCookPlanAgainstRestrictions(cookPlan: CookPlanLike, restrictions: string[], allowedDishNames: string[] = []) {
  const violations = inspectTextItems(
    [
      { path: "cookPlan.overview", value: cookPlan.overview },
      { path: "cookPlan.mise_en_place", value: cookPlan.mise_en_place },
      { path: "cookPlan.plating_overview", value: cookPlan.plating_overview },
      { path: "cookPlan.service_notes", value: cookPlan.service_notes },
      ...cookPlan.steps.flatMap((step, index) => [
        { path: `cookPlan.steps[${index}].phase`, value: step.phase },
        { path: `cookPlan.steps[${index}].title`, value: step.title },
        { path: `cookPlan.steps[${index}].details`, value: step.details },
        { path: `cookPlan.steps[${index}].technique`, value: step.technique ?? null },
        { path: `cookPlan.steps[${index}].knife_cut`, value: step.knife_cut ?? null },
        { path: `cookPlan.steps[${index}].dish_name`, value: step.dish_name ?? null },
        { path: `cookPlan.steps[${index}].utensils`, value: (step.utensils ?? []).join(", ") },
      ]),
    ],
    restrictions,
  );

  const normalizedDishNames = new Set(allowedDishNames.map((dishName) => normalizeText(dishName)));
  const leakage = cookPlan.steps
    .filter((step) => step.dish_name?.trim())
    .filter((step) => !normalizedDishNames.has(normalizeText(step.dish_name ?? "")))
    .map<RestrictionViolation>((step, index) => ({
      restriction: "selected menu context",
      restrictionKey: "menuContext",
      path: `cookPlan.steps[${index}].dish_name`,
      term: step.dish_name ?? "",
      excerpt: step.dish_name ?? "",
    }));

  return [...violations, ...leakage];
}

export function evaluateDishRestrictionCompliance(
  dish: Pick<MenuOption["dishes"][number], "name" | "description" | "platingNotes" | "decorationNotes">,
  restrictions: string[],
) {
  return restrictions.map((restriction) => {
    const issues = inspectTextItems(
      [
        { path: "dish.name", value: dish.name },
        { path: "dish.description", value: dish.description },
        { path: "dish.platingNotes", value: dish.platingNotes },
        { path: "dish.decorationNotes", value: dish.decorationNotes },
      ],
      [restriction],
    );

    return {
      restriction,
      restrictionKey: getRestrictionDefinition(restriction)?.key ?? normalizeRestrictionValue(restriction),
      category: getRestrictionDefinition(restriction)?.category ?? "diet",
      compliant: issues.length === 0,
    };
  });
}

export function summarizeRestrictionViolations(violations: RestrictionViolation[]) {
  if (!violations.length) return "No restriction violations found.";

  return violations
    .map((violation) => `- ${violation.restriction} violated at ${violation.path} because of "${violation.term}" (${violation.excerpt})`)
    .join("\n");
}

export function formatRestrictionLabel(t: (key: string, fallback?: string) => string, restriction: string) {
  const definition = getRestrictionDefinition(restriction);
  if (!definition) return restriction;
  return t(`restrictions.labels.${definition.key}`, restriction);
}

export function formatRestrictionComplianceLabel(t: (key: string, fallback?: string) => string, restriction: string) {
  const definition = getRestrictionDefinition(restriction);
  if (!definition) return `${restriction}-safe`;

  const fallbackMap: Record<string, string> = {
    seafood: "seafood-free",
    shellfish: "shellfish-free",
    gluten: "gluten-aware",
    lactose: "lactose-aware",
    peanuts: "peanut-free",
    treeNuts: "nut-free",
    eggs: "egg-free",
    soy: "soy-aware",
    sesame: "sesame-aware",
    vegetarian: "vegetarian",
    vegan: "vegan",
    porkFree: "pork-free",
    diabetesType1: "diabetes-aware",
    diabetesType2: "diabetes-aware",
  };

  return t(`restrictions.compliance.${definition.key}`, fallbackMap[definition.key] ?? `${restriction}-safe`);
}

export function getRestrictionBadgeVariant(restriction: string) {
  const definition = getRestrictionDefinition(restriction);
  if (!definition) return "default" as const;
  if (definition.category === "wellness") return "warning" as const;
  if (definition.category === "allergen") return "accent" as const;
  return "success" as const;
}
