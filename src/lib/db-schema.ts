import crypto from "node:crypto";
import { z } from "zod";
import { MenuOption } from "@/types/domain";

export const shoppingItemAiSchema = z.object({
  section: z.string().min(1),
  item_name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const cookPlanAiSchema = z.object({
  overview: z.string().min(1),
  mise_en_place: z.string().min(1),
  plating_overview: z.string().min(1),
  service_notes: z.string().min(1),
  steps: z.array(
    z.object({
      step_no: z.number().int().min(1),
      phase: z.string().min(1),
      title: z.string().min(1),
      details: z.string().min(1),
      dish_name: z.string().nullable().optional(),
      relative_minutes: z.number().int().nullable().optional(),
    }),
  ),
});

export type ShoppingItemInsert = {
  shopping_list_id: string;
  section: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  purchased: boolean;
  estimated_unit_price_eur?: number | null;
  estimated_total_price_eur?: number | null;
  sort_order: number;
};

export function mapShoppingItemsToInsert(shoppingListId: string, items: z.infer<typeof shoppingItemAiSchema>[]): ShoppingItemInsert[] {
  return items.map((item, index) => ({
    shopping_list_id: shoppingListId,
    section: item.section,
    item_name: item.item_name,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    note: item.note ?? null,
    purchased: false,
    estimated_unit_price_eur: null,
    estimated_total_price_eur: null,
    sort_order: index + 1,
  }));
}

export function hashPublicToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type NormalizedCookPlan = {
  overview: string | null;
  mise_en_place: string | null;
  plating_overview: string | null;
  service_notes: string | null;
  steps: {
    id: string;
    step_no: number;
    phase: string;
    title: string;
    details: string;
    dish_name: string | null;
    relative_minutes: number | null;
  }[];
};

export function formatMenuOptionForAi(option: MenuOption) {
  return {
    id: option.id,
    title: option.title,
    concept: option.concept,
    dishes: option.dishes.map((dish) => ({
      course: dish.course,
      name: dish.name,
      description: dish.description,
      platingNotes: dish.platingNotes,
      decorationNotes: dish.decorationNotes ?? null,
    })),
  };
}
