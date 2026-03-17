import type { Locale } from "@/lib/i18n/config";
import type { TranslationRequestOptions } from "@/lib/ai/content-translation";
import { translatePlainText, translateTextBlocks } from "@/lib/ai/content-translation";
import type { MenuOption } from "@/types/domain";

type DishRowLike = {
  course_label: string | null;
  dish_name: string;
  description: string;
  plating_notes: string | null;
  decoration_notes: string | null;
};

type ApprovedOptionLike = {
  title: string | null;
  michelin_name: string | null;
  concept_summary: string | null;
  concept: string | null;
  chef_notes?: string | null;
  beverage_pairing?: string | null;
};

type CookPlanLike = {
  overview: string | null;
  mise_en_place: string | null;
  plating_overview: string | null;
  service_notes: string | null;
};

type CookStepLike = {
  phase: string;
  title: string;
  details: string;
  technique?: string | null;
  knife_cut?: string | null;
  dish_name?: string | null;
  utensils?: string[] | null;
};

type ShoppingItemLike = {
  section: string | null;
  item_name: string | null;
  note?: string | null;
};

export async function localizeMenuOptions(options: MenuOption[], locale: Locale, translationOptions?: TranslationRequestOptions) {
  const translations = await translateTextBlocks(
    locale,
    options.flatMap((option, optionIndex) => [
      { id: `option-${optionIndex}-title`, text: option.title },
      { id: `option-${optionIndex}-concept`, text: option.concept },
      ...option.dishes.flatMap((dish, dishIndex) => [
        { id: `option-${optionIndex}-dish-${dishIndex}-course`, text: dish.course },
        { id: `option-${optionIndex}-dish-${dishIndex}-name`, text: dish.name },
        { id: `option-${optionIndex}-dish-${dishIndex}-description`, text: dish.description },
        { id: `option-${optionIndex}-dish-${dishIndex}-plating`, text: dish.platingNotes },
        ...(dish.decorationNotes ? [{ id: `option-${optionIndex}-dish-${dishIndex}-decoration`, text: dish.decorationNotes }] : []),
        ...(dish.beverageSuggestion ? [{ id: `option-${optionIndex}-dish-${dishIndex}-beverage`, text: dish.beverageSuggestion }] : []),
      ]),
    ]),
    "Translate generated Michelin-style menu option titles, concepts, course names, dish names, descriptions, plating notes, and beverage pairings for display in the Cuisine app.",
    translationOptions,
  );

  return options.map((option, optionIndex) => ({
    ...option,
    title: translations[`option-${optionIndex}-title`] ?? option.title,
    concept: translations[`option-${optionIndex}-concept`] ?? option.concept,
    dishes: option.dishes.map((dish, dishIndex) => ({
      ...dish,
      course: translations[`option-${optionIndex}-dish-${dishIndex}-course`] ?? dish.course,
      name: translations[`option-${optionIndex}-dish-${dishIndex}-name`] ?? dish.name,
      description: translations[`option-${optionIndex}-dish-${dishIndex}-description`] ?? dish.description,
      platingNotes: translations[`option-${optionIndex}-dish-${dishIndex}-plating`] ?? dish.platingNotes,
      decorationNotes: dish.decorationNotes
        ? translations[`option-${optionIndex}-dish-${dishIndex}-decoration`] ?? dish.decorationNotes
        : dish.decorationNotes,
      beverageSuggestion: dish.beverageSuggestion
        ? translations[`option-${optionIndex}-dish-${dishIndex}-beverage`] ?? dish.beverageSuggestion
        : dish.beverageSuggestion,
    })),
  }));
}

export async function localizeDishRows<T extends DishRowLike>(dishes: T[], locale: Locale, translationOptions?: TranslationRequestOptions) {
  const translations = await translateTextBlocks(
    locale,
    dishes.flatMap((dish, index) => [
      ...(dish.course_label ? [{ id: `dish-${index}-course`, text: dish.course_label }] : []),
      { id: `dish-${index}-name`, text: dish.dish_name },
      { id: `dish-${index}-description`, text: dish.description },
      ...(dish.plating_notes ? [{ id: `dish-${index}-plating`, text: dish.plating_notes }] : []),
      ...(dish.decoration_notes ? [{ id: `dish-${index}-decoration`, text: dish.decoration_notes }] : []),
    ]),
    "Translate menu dish course labels, names, descriptions, plating notes, and decoration notes for display in the Cuisine app.",
    translationOptions,
  );

  return dishes.map((dish, index) => ({
    ...dish,
    course_label: dish.course_label ? translations[`dish-${index}-course`] ?? dish.course_label : dish.course_label,
    dish_name: translations[`dish-${index}-name`] ?? dish.dish_name,
    description: translations[`dish-${index}-description`] ?? dish.description,
    plating_notes: dish.plating_notes ? translations[`dish-${index}-plating`] ?? dish.plating_notes : dish.plating_notes,
    decoration_notes: dish.decoration_notes ? translations[`dish-${index}-decoration`] ?? dish.decoration_notes : dish.decoration_notes,
  }));
}

export async function localizeApprovedOption<T extends ApprovedOptionLike>(option: T | null, locale: Locale, translationOptions?: TranslationRequestOptions) {
  if (!option) return option;

  const translations = await translateTextBlocks(
    locale,
    [
      { id: "option-title", text: option.title ?? option.michelin_name ?? "" },
      ...(option.concept_summary ? [{ id: "option-concept-summary", text: option.concept_summary }] : []),
      ...(option.concept ? [{ id: "option-concept", text: option.concept }] : []),
      ...(option.chef_notes ? [{ id: "option-chef-notes", text: option.chef_notes }] : []),
      ...(option.beverage_pairing ? [{ id: "option-beverage", text: option.beverage_pairing }] : []),
    ],
    "Translate menu option titles, concept summaries, chef notes, and beverage pairing notes for display in the Cuisine app.",
    translationOptions,
  );

  return {
    ...option,
    title: option.title ? translations["option-title"] ?? option.title : option.title,
    michelin_name: option.title ? option.michelin_name : translations["option-title"] ?? option.michelin_name,
    concept_summary: option.concept_summary ? translations["option-concept-summary"] ?? option.concept_summary : option.concept_summary,
    concept: option.concept ? translations["option-concept"] ?? option.concept : option.concept,
    chef_notes: option.chef_notes ? translations["option-chef-notes"] ?? option.chef_notes : option.chef_notes,
    beverage_pairing: option.beverage_pairing ? translations["option-beverage"] ?? option.beverage_pairing : option.beverage_pairing,
  };
}

export async function localizeCookPlan<T extends CookPlanLike>(cookPlan: T | null, locale: Locale, translationOptions?: TranslationRequestOptions) {
  if (!cookPlan) return cookPlan;

  const translations = await translateTextBlocks(
    locale,
    [
      ...(cookPlan.overview ? [{ id: "cook-overview", text: cookPlan.overview }] : []),
      ...(cookPlan.mise_en_place ? [{ id: "cook-mise", text: cookPlan.mise_en_place }] : []),
      ...(cookPlan.plating_overview ? [{ id: "cook-plating", text: cookPlan.plating_overview }] : []),
      ...(cookPlan.service_notes ? [{ id: "cook-service", text: cookPlan.service_notes }] : []),
    ],
    "Translate high-detail cook plan overview copy, mise en place notes, plating overview, and service notes for display in the Cuisine app.",
    translationOptions,
  );

  return {
    ...cookPlan,
    overview: cookPlan.overview ? translations["cook-overview"] ?? cookPlan.overview : cookPlan.overview,
    mise_en_place: cookPlan.mise_en_place ? translations["cook-mise"] ?? cookPlan.mise_en_place : cookPlan.mise_en_place,
    plating_overview: cookPlan.plating_overview ? translations["cook-plating"] ?? cookPlan.plating_overview : cookPlan.plating_overview,
    service_notes: cookPlan.service_notes ? translations["cook-service"] ?? cookPlan.service_notes : cookPlan.service_notes,
  };
}

export async function localizeCookSteps<T extends CookStepLike>(steps: T[], locale: Locale, translationOptions?: TranslationRequestOptions) {
  const translations = await translateTextBlocks(
    locale,
    steps.flatMap((step, index) => [
      { id: `step-${index}-phase`, text: step.phase },
      { id: `step-${index}-title`, text: step.title },
      { id: `step-${index}-details`, text: step.details },
      ...(step.technique ? [{ id: `step-${index}-technique`, text: step.technique }] : []),
      ...(step.knife_cut ? [{ id: `step-${index}-knife`, text: step.knife_cut }] : []),
      ...(step.dish_name ? [{ id: `step-${index}-dish`, text: step.dish_name }] : []),
      ...((step.utensils ?? []).map((tool, toolIndex) => ({ id: `step-${index}-tool-${toolIndex}`, text: tool }))),
    ]),
    "Translate highly detailed cooking step metadata, including phases, titles, detailed instructions, techniques, knife cuts, tools, and dish names for display in the Cuisine app.",
    translationOptions,
  );

  return steps.map((step, index) => ({
    ...step,
    phase: translations[`step-${index}-phase`] ?? step.phase,
    title: translations[`step-${index}-title`] ?? step.title,
    details: translations[`step-${index}-details`] ?? step.details,
    technique: step.technique ? translations[`step-${index}-technique`] ?? step.technique : step.technique,
    knife_cut: step.knife_cut ? translations[`step-${index}-knife`] ?? step.knife_cut : step.knife_cut,
    dish_name: step.dish_name ? translations[`step-${index}-dish`] ?? step.dish_name : step.dish_name,
    utensils: (step.utensils ?? []).map((tool, toolIndex) => translations[`step-${index}-tool-${toolIndex}`] ?? tool),
  }));
}

export async function localizeShoppingItems<T extends ShoppingItemLike>(items: T[], locale: Locale, translationOptions?: TranslationRequestOptions) {
  const translations = await translateTextBlocks(
    locale,
    items.flatMap((item, index) => [
      ...(item.section ? [{ id: `shopping-${index}-section`, text: item.section }] : []),
      ...(item.item_name ? [{ id: `shopping-${index}-name`, text: item.item_name }] : []),
      ...(item.note ? [{ id: `shopping-${index}-note`, text: item.note }] : []),
    ]),
    "Translate shopping list section labels, ingredient names, and planning notes for display in the Cuisine app.",
    translationOptions,
  );

  return items.map((item, index) => ({
    ...item,
    section: item.section ? translations[`shopping-${index}-section`] ?? item.section : item.section,
    item_name: item.item_name ? translations[`shopping-${index}-name`] ?? item.item_name : item.item_name,
    note: item.note ? translations[`shopping-${index}-note`] ?? item.note : item.note,
  }));
}

export async function localizeDisplayTitle(locale: Locale, title: string, translationOptions?: TranslationRequestOptions) {
  return (await translatePlainText(locale, title, "Translate this menu title for display in the Cuisine app.", translationOptions)) ?? title;
}
